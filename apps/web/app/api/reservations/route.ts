// 動的ルートフラグ
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { randomUUID } from 'crypto';

import { Prisma, ReservationStatus } from '@prisma/client';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';


import { convertReservationToResponse } from '@/lib/caseConverter';
import { getSessionFromRequest } from '@/lib/session';
import { getBaseUrl, calculateTotalReservedMinutes, calculateSlotTotalMinutes } from '@/lib/utils';
import { isPastJst, addJstFields, parseAsUTC } from '@/lib/utils/timezone';
import { getFeature } from '@/lib/config/features';

import { prisma } from '../../../lib/prisma';




// Stripe インスタンスの初期化
const _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

// 未使用のユーティリティ関数（将来使用予定のため保持）
const _getBaseUrl = getBaseUrl;
const _calculateTotalReservedMinutes = calculateTotalReservedMinutes;
const _calculateSlotTotalMinutes = calculateSlotTotalMinutes;
const _format = format;
const _ja = ja;

// Prismaクエリ実行のラッパー関数（エラーハンドリング強化）
async function executePrismaQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    console.error('Prismaクエリエラー:', error);
    
    // PostgreSQL接続エラーの場合、一度明示的に接続を再確立
    if (error instanceof Prisma.PrismaClientInitializationError || 
        error instanceof Prisma.PrismaClientKnownRequestError) {
      console.log('Prisma接続リセット試行...');
      
      // エラー後の再試行（最大3回）
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          // 少し待機してから再試行
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          return await queryFn();
        } catch (retryError) {
          console.error(`再試行 ${attempt + 1}/3 失敗:`, retryError);
          if (attempt === 2) throw retryError; // 最後の試行でもエラーなら投げる
        }
      }
    }
    
    throw error;
  }
}

// 予約一覧を取得
export async function GET(request: NextRequest) {
  try {
    console.log('予約一覧API呼び出し - リクエストヘッダー:', 
      Object.fromEntries(request.headers.entries()));
    
    // セッション情報を取得
    const sessionInfo = await getSessionFromRequest(request);
    
    console.log('セッション取得結果:', 
      sessionInfo ? `認証済み: ${sessionInfo.user.email} (${sessionInfo.role})` : '認証なし');
    
    if (!sessionInfo) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const slotId = searchParams.get('slotId');
    const date = searchParams.get('date'); // 日付パラメータを追加
    const includeAll = searchParams.get('includeAll') === 'true'; // 全予約取得フラグ
    const startDate = searchParams.get('startDate'); // 開始日
    const endDate = searchParams.get('endDate'); // 終了日
    const debug = searchParams.get('debug') === 'true'; // デバッグモード
    
    // フィーチャーフラグでビュー使用を判定
    const useDbViews = getFeature('USE_DB_VIEWS');
    const tableName = useDbViews ? 'active_reservations' : 'reservations';
    
    console.log(`APIレスポンス: ${tableName}を使用 (ビュー利用: ${useDbViews})`);
    
    // クエリ条件を構築
    const where: Prisma.reservationsWhereInput = {};
    
    // includeAllフラグが設定されている場合は、プライバシー保護された全予約を返す
    if (includeAll) {
      // 全ての予約を取得（プライバシー保護のため最小限の情報のみ）
      console.log('🔍 全予約取得モード（プライバシー保護）');
    } else {
      // 通常モード：ロール別のアクセス制御
      if (sessionInfo.role === 'mentor') {
        where.lesson_slots = {
          teacher_id: sessionInfo.user.id,
        };
      } else if (sessionInfo.role === 'admin') {
        // 管理者は全ての予約を閲覧可能
      } else {
        // 生徒は自分の予約のみ閲覧可能
        where.student_id = sessionInfo.user.id;
      }
    }
    
    if (status && Object.values(ReservationStatus).includes(status as ReservationStatus)) {
      where.status = status as ReservationStatus;
    }
    
    if (slotId) {
      where.slot_id = slotId;
    }
    
    if (date) {
      // 指定された日付の0:00〜23:59:59の範囲で予約を検索
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.booked_start_time = {
        gte: startOfDay,
        lte: endOfDay
      };
      
      console.log(`🗓️ 日付フィルタ適用: ${date} (${startOfDay.toISOString()} 〜 ${endOfDay.toISOString()})`);
    } else if (startDate || endDate) {
      // 日付範囲でフィルタリング
      where.booked_start_time = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.booked_start_time.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.booked_start_time.lte = end;
      }
      console.log(`🗓️ 日付範囲フィルタ適用: ${startDate || '開始日なし'} 〜 ${endDate || '終了日なし'}`);
    }
    
    // データベースから予約を取得（エラーハンドリング強化）
    console.log('📊 Prismaクエリ実行開始...');
    console.log('🔍 Where条件:', JSON.stringify(where, null, 2));
    
    // フィーチャーフラグに基づいてクエリを構築
    let queryPromise: Promise<any[]>;
    
    if (useDbViews) {
      // ビューを使用する場合は$queryRawを使用
      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      // ベースクエリ
      let baseQuery = `SELECT * FROM ${tableName}`;
      
      // 条件構築
      if (!includeAll) {
        if (sessionInfo.role === 'mentor') {
          conditions.push(`lesson_slot_id IN (SELECT id FROM lesson_slots WHERE teacher_id = $${paramCount})`);
          values.push(sessionInfo.user.id);
          paramCount++;
        } else if (sessionInfo.role !== 'admin') {
          conditions.push(`student_id = $${paramCount}`);
          values.push(sessionInfo.user.id);
          paramCount++;
        }
      }
      
      if (status) {
        conditions.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }
      
      if (slotId) {
        conditions.push(`slot_id = $${paramCount}`);
        values.push(slotId);
        paramCount++;
      }
      
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        conditions.push(`booked_start_time >= $${paramCount} AND booked_start_time <= $${paramCount + 1}`);
        values.push(startOfDay.toISOString(), endOfDay.toISOString());
        paramCount += 2;
      } else if (startDate || endDate) {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          conditions.push(`booked_start_time >= $${paramCount}`);
          values.push(start.toISOString());
          paramCount++;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          conditions.push(`booked_start_time <= $${paramCount}`);
          values.push(end.toISOString());
          paramCount++;
        }
      }
      
      // WHERE句を追加
      if (conditions.length > 0) {
        baseQuery += ' WHERE ' + conditions.join(' AND ');
      }
      
      // ORDER BY句を追加
      baseQuery += ' ORDER BY created_at DESC';
      
      queryPromise = executePrismaQuery(() => prisma.$queryRawUnsafe(baseQuery, ...values));
    } else {
      // 従来のPrismaクエリ
      queryPromise = executePrismaQuery(() => prisma.reservations.findMany({
        where,
        orderBy: { created_at: 'desc' },
      }));
    }
    
    // 10秒タイムアウトを追加
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('クエリがタイムアウトしました（10秒）')), 10000);
    });
    
    const reservations = await Promise.race([queryPromise, timeoutPromise]) as any[];
    console.log('📊 Prismaクエリ完了:', reservations.length, '件');
    
    // 過去の予約をフィルタリング（ビューを使用している場合は既にフィルタ済み）
    const filteredReservations = useDbViews || includeAll 
      ? reservations 
      : reservations.filter(reservation => {
          // 終了時刻が過去の予約は除外
          return !isPastJst(reservation.booked_end_time);
        });
    
    console.log(`📊 過去の予約フィルタリング後: ${filteredReservations.length}件 (元: ${reservations.length}件)`);
    
    // フロントエンドが期待する形式に変換（簡素化）
    const formattedReservations = filteredReservations.map(reservation => {
      // 基本的な予約情報のみ返す（キャメルケース変換）
      const baseReservation = {
        id: reservation.id,
        slotId: reservation.slot_id,           // slot_id → slotId
        status: reservation.status,
        bookedStartTime: reservation.booked_start_time,  // booked_start_time → bookedStartTime
        bookedEndTime: reservation.booked_end_time,      // booked_end_time → bookedEndTime
        studentId: reservation.student_id,     // student_id → studentId
        createdAt: reservation.created_at,     // created_at → createdAt
      };
      
      // JST表示用フィールドを追加
      return addJstFields(baseReservation, ['bookedStartTime', 'bookedEndTime', 'createdAt'], debug);
    });
    
    console.log(`📊 予約取得完了: ${formattedReservations.length}件 (簡素化版)`);
    
    return NextResponse.json(formattedReservations, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: '予約の取得中にエラーが発生しました', details: String(error) },
      { status: 500 }
    );
  }
}

// 新しい予約のための決済セッションを作成
export async function POST(request: NextRequest) {
  try {
    // セッション情報を取得
    const session = await getSessionFromRequest(request);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    // リクエストボディからデータを取得
    const data = await request.json();
    // durationだけを変数として宣言し、他は定数のまま
    const { slotId, bookedStartTime, bookedEndTime, notes, totalAmount, createPaymentIntent, paymentMethodId } = data;
    let duration = data.duration || 60; // デフォルト60分
    
    // 処理のログ出力
    console.log(`予約リクエスト: slotId=${slotId}, duration=${duration}分, 時間帯=${bookedStartTime ? `${new Date(bookedStartTime).toLocaleTimeString()}~${new Date(bookedEndTime).toLocaleTimeString()}` : '未指定'}`);
    
    // 必須項目の検証
    if (!slotId) {
      return NextResponse.json({ error: 'レッスン枠IDが必要です' }, { status: 400 });
    }
    
    // 予約時間の基本制約チェック（60〜90分）
    if (duration < 60 || duration > 90) {
      return NextResponse.json(
        { error: 'レッスン時間は60分〜90分の間で設定してください' },
        { status: 400 }
      );
    }
    
    // 予約時間の指定が不完全な場合はエラー
    if ((bookedStartTime && !bookedEndTime) || (!bookedStartTime && bookedEndTime)) {
      return NextResponse.json(
        { error: '予約開始時間と終了時間の両方を指定してください' },
        { status: 400 }
      );
    }
    
    // ユーザーのロールを取得
    const role = session.role || 'student'; // デフォルトはstudent
    
    // studentロールのみ予約可能
    if (role !== 'student') {
      return NextResponse.json(
        { error: '生徒アカウントのみがレッスンを予約できます' },
        { status: 403 }
      );
    }
    
    // トランザクション開始 - 予約作成から決済まで一貫して処理
    const result = await prisma.$transaction(async (tx) => {
      // レッスンスロットを取得（新しく追加したフィールドも含める）
      const slot = await tx.lesson_slots.findUnique({
        where: { 
          id: slotId,
          is_available: true // 利用可能なスロットのみを対象
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reservations: {
            where: {
              status: { in: ['PENDING', 'CONFIRMED'] }
            },
            select: {
              id: true,
              booked_start_time: true,
              booked_end_time: true,
              status: true
            }
          }
        }
      });

      if (!slot) {
        throw new Error('指定されたレッスン枠が見つからないか、既に予約されています');
      }

      // スロット固有の時間制約を取得（デフォルト値を設定）
      interface ExtendedSlot {
        minDuration?: number;
        maxDuration?: number;
      }
      const extendedSlot = slot as typeof slot & ExtendedSlot;
      const slotMinDuration = extendedSlot.minDuration || 60; // デフォルト60分
      const slotMaxDuration = extendedSlot.maxDuration || 90; // デフォルト90分
      
      // 固定料金で計算（hourlyRateをそのまま使用）
      const fixedAmount = slot.hourly_rate || 5000;
      const currency = slot.currency || 'jpy';
      
      // 予約時間の計算（固定時間）
      let reservationStartTime: Date;
      let reservationEndTime: Date;
      
      if (bookedStartTime && bookedEndTime) {
        // ユーザーが選択した正確な時間帯を使用
        // フロントエンドからの時刻をUTCとして確実に解釈
        reservationStartTime = parseAsUTC(bookedStartTime);
        reservationEndTime = parseAsUTC(bookedEndTime);
        
        console.log('受信した予約時間（変換前）:', {
          originalStart: bookedStartTime,
          originalEnd: bookedEndTime,
        });
        
        console.log('Dateオブジェクト変換後:', {
          reservationStart: reservationStartTime.toISOString(),
          reservationEnd: reservationEndTime.toISOString(),
        });
        
        // 予約時間が指定された範囲内かチェック（スロット固有の制約を適用）
        const durationInMinutes = Math.round((reservationEndTime.getTime() - reservationStartTime.getTime()) / (1000 * 60));
        if (durationInMinutes < slotMinDuration || durationInMinutes > slotMaxDuration) {
          throw new Error(`このメンターのレッスン時間は${slotMinDuration}分〜${slotMaxDuration}分の間で設定してください（現在: ${durationInMinutes}分）`);
        }
      } else {
        // 選択がない場合は、開始時間からduration分の枠を予約
        reservationStartTime = parseAsUTC(slot.start_time);
        
        // 予約時間がスロットの最小時間制約を満たしているか検証
        if (duration < slotMinDuration) {
          duration = slotMinDuration; // 最小時間に調整
        }
        
        // 予約時間がスロットの最大時間制約を超えていないか検証
        if (duration > slotMaxDuration) {
          duration = slotMaxDuration; // 最大時間に調整
        }
        
        // 調整された時間で終了時間を設定
        reservationEndTime = new Date(reservationStartTime);
        reservationEndTime.setMinutes(reservationEndTime.getMinutes() + duration);
        
        // 予約終了時間がスロット終了時間を超えないようにする
        const slotEndTime = parseAsUTC(slot.end_time);
        if (reservationEndTime > slotEndTime) {
          reservationEndTime = slotEndTime;
        }
      }
      
      // 予約時間の整合性チェック
      const slotStartTime = parseAsUTC(slot.start_time);
      const slotEndTime = parseAsUTC(slot.end_time);
      
      if (reservationStartTime < slotStartTime || reservationEndTime > slotEndTime) {
        throw new Error('予約時間がレッスン枠の範囲外です');
      }
      
      // 予約時間の重複チェック
      const existingReservations = slot.reservations || [];
      const hasOverlap = existingReservations.some(reservation => {
        // 既存予約の時刻をUTCとして解釈
        const existingStart = parseAsUTC(reservation.booked_start_time);
        const existingEnd = parseAsUTC(reservation.booked_end_time);
        
        console.log('重複チェック - 既存予約:', {
          id: reservation.id,
          existingStart: existingStart.toISOString(),
          existingEnd: existingEnd.toISOString(),
        });
        
        // 時間帯の重複チェック
        return (
          (reservationStartTime < existingEnd && reservationEndTime > existingStart) ||
          (existingStart < reservationEndTime && existingEnd > reservationStartTime)
        );
      });
      
      if (hasOverlap) {
        throw new Error('選択した時間帯は既に予約されています。別の時間を選択してください。');
      }
      
      // 生徒の既存予約との重複チェック
      console.log('🔍 生徒の既存予約との重複チェック開始');
      const studentExistingReservations = await tx.reservations.findMany({
        where: {
          student_id: session.user.id,
          // 新規作成時はidはまだないため、この条件は不要
          status: { 
            in: ['PENDING_APPROVAL', 'APPROVED', 'CONFIRMED'] 
          },
          // 時間帯の重複を検索
          OR: [
            {
              AND: [
                { booked_start_time: { lt: reservationEndTime } },
                { booked_end_time: { gt: reservationStartTime } }
              ]
            }
          ]
        },
        include: {
          lesson_slots: {
            include: {
              users: {
                select: { name: true }
              }
            }
          }
        }
      });
      
      if (studentExistingReservations.length > 0) {
        // 重複する予約の詳細情報を作成
        const conflictDetails = studentExistingReservations.map(r => {
          const startTime = new Date(r.booked_start_time).toLocaleTimeString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          const endTime = new Date(r.booked_end_time).toLocaleTimeString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          const teacherName = r.lesson_slots.users.name || '不明';
          return `${startTime}-${endTime} (${teacherName}先生)`;
        }).join(', ');
        
        console.log('❌ 重複予約が見つかりました:', conflictDetails);
        
        throw new Error(
          `選択した時間帯に既に他の予約があります。\n` +
          `重複する予約: ${conflictDetails}\n` +
          `別の時間帯を選択してください。`
        );
      }
      
      console.log('✅ 生徒の既存予約との重複なし');

      // 実際のduration（分）を計算
      const durationInMinutes = Math.round((reservationEndTime.getTime() - reservationStartTime.getTime()) / (1000 * 60));
      
      // 予約データの作成準備（固定料金方式）
      const reservationData = {
        id: randomUUID(),
        slot_id: slot.id,
        student_id: session.user.id,
        status: 'PENDING_APPROVAL' as ReservationStatus, // メンター承認待ち状態で作成
        booked_start_time: reservationStartTime,
        booked_end_time: reservationEndTime,
        hours_booked: Math.ceil(durationInMinutes / 60),
        duration_minutes: durationInMinutes, // 分単位の予約時間を明示的に保存
        total_amount: fixedAmount, // 時間に関わらず固定料金
        notes: typeof notes === 'string' ? notes : null,
        updated_at: new Date()
      };
      
              // 日付と時間をフォーマット（JST時間で表示）
        const formattedDate = reservationStartTime.toLocaleDateString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const startTimeJST = reservationStartTime.toLocaleTimeString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        const endTimeJST = reservationEndTime.toLocaleTimeString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        const formattedTimeRange = `${startTimeJST} - ${endTimeJST}`;
        const formattedDuration = `${durationInMinutes}分`;
        
        console.log('📅 JST変換結果:', {
          originalStart: reservationStartTime.toISOString(),
          originalEnd: reservationEndTime.toISOString(),
          formattedDate,
          formattedTimeRange,
          note: 'Stripe決済ページと成功ページで日本時間が表示されます'
        });
        
        // 予約レコードを作成（直前に最終チェック）
        console.log('🔒 予約作成直前の最終重複チェック');
        const lastMinuteCheck = await tx.reservations.findFirst({
          where: {
            student_id: session.user.id,
            slot_id: slot.id,
            status: { 
              in: ['PENDING_APPROVAL', 'APPROVED', 'CONFIRMED'] 
            },
            // 完全に同じ時間帯の予約をチェック
            booked_start_time: reservationStartTime,
            booked_end_time: reservationEndTime
          }
        });
        
        if (lastMinuteCheck) {
          console.log('❌ 最終チェックで重複予約を検出:', {
            existingId: lastMinuteCheck.id,
            status: lastMinuteCheck.status,
            time: `${startTimeJST} - ${endTimeJST}`
          });
          throw new Error(
            `この時間帯の予約は既に処理中または登録済みです。\n` +
            `時間: ${formattedTimeRange}\n` +
            `予約一覧をご確認ください。`
          );
        }
        
        const reservation = await tx.reservations.create({
          data: reservationData
        });
        
        // 2時間以内の予約の場合は即座決済が必要な旨を通知
        const { getPaymentExecutionTiming } = await import('@/lib/payment-flow');
        const timing = getPaymentExecutionTiming(reservationStartTime);
        
        if (timing.shouldExecuteImmediately) {
          console.log('⚠️ 2時間以内の予約: 承認後即座決済が必要');
        }
        
        // 決済は後でCheckout Sessionで処理するため、ここでは予約のみ作成
        
        // セッション情報・リクエスト情報をログ出力（デバッグ用）
        console.log('セッション情報:', {
          userId: session.user.id,
          userEmail: session.user.email,
          role: session.role
        });
        
        // 予約作成完了 - 決済はメンター承認後に実行
        console.log('✅ 予約作成完了:', {
          reservationId: reservation.id,
          status: reservation.status,
          teacher: slot.users.name,
          student: session.user.email,
          timeRange: formattedTimeRange
        });
        
        return {
          success: true,
          reservation,
          message: '予約が作成されました。決済ページで支払いを完了してください。',
          pricing: {
            fixedAmount,
            currency,
            durationInMinutes
          }
        };
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('予約作成エラー:', error);
    return NextResponse.json(
      { error: '予約の作成中にエラーが発生しました', details: String(error) },
      { status: 500 }
    );
  }
} 