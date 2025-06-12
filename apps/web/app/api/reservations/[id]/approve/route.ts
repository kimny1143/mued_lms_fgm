import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { hasPermission, normalizeRoleName } from '@/lib/role-utils';
import { getSessionFromRequest } from '@/lib/session';

// コールドスタート対策：モジュールレベルでPrisma接続を事前確立
if (process.env.NODE_ENV === 'production') {
  prisma.$connect().catch(console.error);
}

// 決済関連の型定義
interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  metadata?: string;
}

interface PaymentMetadata {
  setupIntentId?: string;
  paymentMethodId?: string;
  customerId?: string;
}

// Vercel Function のタイムアウト設定（秒単位）
// Hobbyプランは最大10秒、Proプランは最大60秒
export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const headers = Object.fromEntries(request.headers.entries());
  console.log(`🎯 [APPROVE API] 開始: ${params.id}`, {
    timestamp: new Date().toISOString(),
    authorization: headers.authorization ? `Bearer ${headers.authorization.substring(7, 17)}...` : 'なし',
    cookie: headers.cookie ? 'あり' : 'なし',
    contentType: headers['content-type'],
    origin: headers.origin,
    referer: headers.referer
  });
  
  try {
    const authStartTime = Date.now();
    const session = await getSessionFromRequest(request);
    console.log(`⏱️ [APPROVE API] 認証取得: ${Date.now() - authStartTime}ms`);
    
    if (!session || !session.user) {
      console.log(`❌ [APPROVE API] 認証エラー - 合計処理時間: ${Date.now() - startTime}ms`);
      return NextResponse.json({ error: '認証が必要です' }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // メンターロールのチェック（role-utilsを使用した統一的な判定）
    console.log('🔍 ロール判定詳細:', {
      sessionRole: session.role,
      roleType: typeof session.role,
      userId: session.user.id,
      userEmail: session.user.email
    });
    
    const normalizedRole = normalizeRoleName(session.role);
    const canApproveMentor = hasPermission(session.role || '', 'mentor');
    const canApproveAdmin = hasPermission(session.role || '', 'admin');
    
    console.log('🔍 権限チェック結果 (role-utils):', {
      originalRole: session.role,
      normalizedRole,
      canApproveMentor,
      canApproveAdmin,
      canApprove: canApproveMentor || canApproveAdmin
    });
    
    if (!canApproveMentor && !canApproveAdmin) {
      return NextResponse.json(
        { 
          error: 'メンターのみが予約を承認できます',
          debug: {
            providedRole: session.role,
            normalizedRole,
            canApproveMentor,
            canApproveAdmin
          }
        },
        { status: 403 }
      );
    }
    
    const reservationId = params.id;
    
    // 予約の存在確認と権限チェック
    const findStartTime = Date.now();
    const reservation = await prisma.reservations.findUnique({
      where: { id: reservationId },
      include: {
        lesson_slots: {
          select: {
            teacher_id: true,
            users: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });
    console.log(`⏱️ [APPROVE API] 予約検索: ${Date.now() - findStartTime}ms`);
    
    if (!reservation) {
      return NextResponse.json(
        { error: '予約が見つかりません' },
        { status: 404 }
      );
    }
    
    // メンターが自分のレッスン枠の予約のみ承認できることを確認
    if (reservation.lesson_slots.teacher_id !== session.user.id) {
      return NextResponse.json(
        { error: 'この予約を承認する権限がありません' },
        { status: 403 }
      );
    }
    
    // 承認可能な状態かチェック
    if (reservation.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: `この予約は承認できません。現在の状態: ${reservation.status}` },
        { status: 400 }
      );
    }
    
    // トランザクションで承認と決済処理を実行
    const transactionStartTime = Date.now();
    console.log(`🔄 [APPROVE API] トランザクション開始`);
    
    const result = await prisma.$transaction(async (tx) => {
      // 承認前に生徒の重複予約をチェック
      const conflictCheckStartTime = Date.now();
      console.log('🔍 生徒の重複予約チェック開始');
      
      const conflictingReservations = await tx.reservations.findMany({
        where: {
          student_id: reservation.student_id,
          id: { not: reservationId }, // 現在の予約は除外
          status: { 
            in: ['PENDING_APPROVAL', 'APPROVED', 'CONFIRMED'] // 承認待ち・承認済みの予約をチェック
          },
          // 時間帯の重複を検索
          AND: [
            { booked_start_time: { lt: reservation.booked_end_time } },
            { booked_end_time: { gt: reservation.booked_start_time } }
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
        },
        // パフォーマンス最適化：必要最小限の結果のみ取得
        take: 10
      });
      console.log(`⏱️ [APPROVE API] 重複チェック: ${Date.now() - conflictCheckStartTime}ms`);
      
      if (conflictingReservations.length > 0) {
        // 重複する予約の詳細情報を作成
        const conflictDetails = conflictingReservations.map(r => {
          const date = new Date(r.booked_start_time).toLocaleDateString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
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
          const statusText = r.status === 'PENDING_APPROVAL' ? ' [承認待ち]' : 
                           r.status === 'APPROVED' ? ' [承認済み]' : 
                           r.status === 'CONFIRMED' ? ' [確定済み]' : '';
          return `${date} ${startTime}-${endTime} (${teacherName}先生)${statusText}`;
        }).join(', ');
        
        console.log('❌ 生徒に重複予約が見つかりました:', {
          conflictDetails,
          conflictingReservations: conflictingReservations.map(r => ({
            id: r.id,
            status: r.status,
            time: `${new Date(r.booked_start_time).toLocaleTimeString('ja-JP')} - ${new Date(r.booked_end_time).toLocaleTimeString('ja-JP')}`
          }))
        });
        
        throw new Error(
          `生徒に時間が重複する他の予約があるため承認できません。\n` +
          `重複する予約: ${conflictDetails}\n` +
          `※承認待ちの予約がある場合は、先にそれらをキャンセルしてください。`
        );
      }
      
      console.log('✅ 生徒の重複予約なし - 承認処理を続行');
      // 予約を承認状態に更新
      const updateStartTime = Date.now();
      const updatedReservation = await tx.reservations.update({
        where: { id: reservationId },
        data: {
          status: 'APPROVED',
          approved_at: new Date(),
          approved_by: session.user.id
        },
        include: {
          payments: true
        }
      });
      console.log(`⏱️ [APPROVE API] 予約更新: ${Date.now() - updateStartTime}ms`);

      // レッスンセッションを自動作成
      const sessionCreateStartTime = Date.now();
      // UUIDを生成
      const { v4: uuidv4 } = await import('uuid');
      const lessonSession = await tx.lesson_sessions.create({
        data: {
          id: uuidv4(),
          reservation_id: reservationId,
          scheduled_start: reservation.booked_start_time,
          scheduled_end: reservation.booked_end_time,
          status: 'SCHEDULED',
          updated_at: new Date()
        }
      });
      console.log(`⏱️ [APPROVE API] セッション作成: ${Date.now() - sessionCreateStartTime}ms`);

      console.log('📚 レッスンセッション作成完了:', {
        sessionId: lessonSession.id,
        reservationId: lessonSession.reservation_id,
        scheduledStart: lessonSession.scheduled_start,
        scheduledEnd: lessonSession.scheduled_end
      });
      
      // Setup完了済みの場合は自動決済実行
      let paymentResult = null;
      
      console.log('🔍 決済情報確認:', {
        hasPayments: !!updatedReservation.payments,
        paymentStatus: updatedReservation.payments ? (updatedReservation.payments as PaymentRecord).status : 'なし',
        paymentId: updatedReservation.payments?.id
      });
      
      if (updatedReservation.payments && (updatedReservation.payments as PaymentRecord).status === 'SETUP_COMPLETED') {
        try {
          console.log('💳 決済タイミング判定開始');
          
          // 🔧 修正：2時間前判定を追加
          const { getPaymentExecutionTiming } = await import('@/lib/payment-flow');
          const { differenceInMinutes } = await import('date-fns');
          const timing = getPaymentExecutionTiming(updatedReservation.booked_start_time);
          
          // 安全チェック：実際の時間差を再計算（分単位）
          const now = new Date();
          const minutesUntilLesson = differenceInMinutes(updatedReservation.booked_start_time, now);
          const hoursUntilLesson = minutesUntilLesson / 60;
          
          console.log('⏰ 決済実行タイミング詳細:', {
            currentTimeUTC: now.toISOString(),
            currentTimeJST: now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            lessonStartTimeUTC: updatedReservation.booked_start_time.toISOString(),
            lessonStartTimeJST: updatedReservation.booked_start_time.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            minutesUntilLesson: minutesUntilLesson,
            hoursUntilLesson: hoursUntilLesson.toFixed(2),
            timingCalculation: {
              executionTime: timing.executionTime.toISOString(),
              shouldExecuteImmediately: timing.shouldExecuteImmediately,
              hoursUntilExecution: timing.hoursUntilExecution,
              isAutoExecution: timing.isAutoExecution
            }
          });
          
          // 環境変数による制御（デフォルトは有効）
          const immediatePaymentEnabled = process.env.ENABLE_IMMEDIATE_PAYMENT_ON_APPROVAL !== 'false';
          
          if (!immediatePaymentEnabled) {
            console.log('⚠️ 即座決済は環境変数により無効化されています');
          }
          
          // 安全チェック：120分（2時間）以内かつ、timing判定が正しいか確認
          const shouldExecuteNow = minutesUntilLesson <= 120 && timing.shouldExecuteImmediately && immediatePaymentEnabled;
          
          if (minutesUntilLesson > 120 && timing.shouldExecuteImmediately) {
            console.error('🚨 タイミング判定エラー検出: レッスンまで' + minutesUntilLesson + '分（' + hoursUntilLesson.toFixed(2) + '時間）あるのに即座決済フラグがtrue');
          }
          
          if (shouldExecuteNow) {
            console.log('🚀 2時間以内のため即座決済を実行（検証済み）');
            console.log('✅ 決済実行条件:', {
              minutesUntilLesson: minutesUntilLesson + '分',
              hoursUntilLesson: hoursUntilLesson.toFixed(2) + '時間',
              timingFlag: timing.shouldExecuteImmediately,
              envEnabled: immediatePaymentEnabled,
              result: '決済実行'
            });
            
            const stripe = new (await import('stripe')).default(process.env.STRIPE_SECRET_KEY!, {
              apiVersion: '2025-03-31.basil',
            });
            
            // Setup Intentから決済手段情報を取得
            const paymentMetadata: PaymentMetadata = JSON.parse((updatedReservation.payments as PaymentRecord).metadata || '{}');
            
            console.log('📋 決済メタデータ:', {
              setupIntentId: paymentMetadata.setupIntentId,
              paymentMethodId: paymentMetadata.paymentMethodId,
              customerId: paymentMetadata.customerId
            });
            const paymentMethodId = paymentMetadata.paymentMethodId;
            const customerId = paymentMetadata.customerId;
            
            if (!paymentMethodId) {
              throw new Error('決済手段が見つかりません');
            }
            
            console.log('🔄 Payment Intent作成開始');
            
            // Payment Intentを作成して即座に実行
            const paymentIntent = await stripe.paymentIntents.create({
              amount: updatedReservation.payments.amount,
              currency: 'jpy',
              customer: customerId,
              payment_method: paymentMethodId,
              confirm: true, // 即座に決済実行
              automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never' // リダイレクト系決済を無効化
              },
              metadata: {
                reservationId: reservationId,
                studentId: updatedReservation.student_id,
                teacherId: reservation.lesson_slots.teacher_id,
                slotId: updatedReservation.slot_id,
                executionTrigger: 'mentor_approval_immediate'
              },
              description: `レッスン予約の即座決済 - 予約ID: ${reservationId}`,
            });
            
            // Payment レコードを更新
            await tx.payments.update({
              where: { id: updatedReservation.payments.id },
              data: {
                stripe_payment_id: paymentIntent.id,
                status: 'SUCCEEDED',
                updated_at: new Date()
              }
            });
            
            // 予約ステータスを確定済みに更新
            await tx.reservations.update({
              where: { id: reservationId },
              data: { status: 'CONFIRMED' }
            });
            
            paymentResult = {
              paymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount,
              status: paymentIntent.status,
              executionType: 'immediate'
            };
            
            console.log('💳 即座決済実行完了:', paymentResult);
          } else {
            // 🔧 新機能：2時間以上前の場合はCronジョブに委ねる
            console.log(`⏰ レッスン開始まで${timing.hoursUntilExecution}時間以上あるため、Cronジョブによる自動決済を待機`);
            console.log(`📅 自動決済予定時刻: ${timing.executionTime.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`);
            
            paymentResult = {
              executionType: 'scheduled',
              scheduledExecutionTime: timing.executionTime,
              hoursUntilExecution: timing.hoursUntilExecution,
              message: `レッスン開始2時間前（${timing.executionTime.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}）に自動決済されます`
            };
          }
          
        } catch (paymentError) {
          console.error('決済処理エラー:', paymentError);
          // 決済エラーでも承認は完了させる（手動決済可能）
          paymentResult = {
            executionType: 'error',
            error: String(paymentError)
          };
        }
      }
      
      return { updatedReservation, paymentResult };
    });
    
    console.log(`⏱️ [APPROVE API] トランザクション完了: ${Date.now() - transactionStartTime}ms`);
    
    // 型アサーションで一時的に回避（Prismaクライアントの型が更新されるまで）
    const reservationWithApprovedAt = result.updatedReservation as typeof result.updatedReservation & { approvedAt: Date };
    
    console.log('✅ 予約承認完了:', {
      reservationId: result.updatedReservation.id,
      mentorId: session.user.id,
      mentorName: (session.user as { name?: string }).name || 'Unknown',
      approvedAt: reservationWithApprovedAt.approvedAt,
      autoPayment: !!result.paymentResult
    });
    
    // 🔧 修正：決済実行タイプに応じたメッセージ生成
    let message: string;
    if (result.paymentResult) {
      switch (result.paymentResult.executionType) {
        case 'immediate':
          message = '予約を承認し、決済も自動で完了しました！';
          break;
        case 'scheduled':
          message = `予約を承認しました。${result.paymentResult.message}`;
          break;
        case 'error':
          message = '予約を承認しましたが、決済処理でエラーが発生しました。手動で決済を確認してください。';
          break;
        default:
          message = '予約を承認しました。決済処理を確認中です。';
      }
    } else {
      message = '予約を承認しました。生徒に決済手続きの案内が送信されます。';
    }
    
    console.log(`✅ [APPROVE API] 成功 - 合計処理時間: ${Date.now() - startTime}ms`);
    
    return NextResponse.json({
      success: true,
      message,
      reservation: result.updatedReservation,
      payment: result.paymentResult
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Connection': 'keep-alive'
      }
    });
    
  } catch (error) {
    console.error(`❌ [APPROVE API] エラー - 合計処理時間: ${Date.now() - startTime}ms`);
    console.error('予約承認エラー詳細:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      reservationId: params.id,
      userId: (session as any)?.user?.id
    });
    
    // エラーメッセージの詳細化
    if (error instanceof Error) {
      if (error.message.includes('重複する')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 } // Conflict
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '予約の承認中にエラーが発生しました', details: String(error) },
      { status: 500 }
    );
  }
} 