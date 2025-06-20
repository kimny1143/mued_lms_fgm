'use client';

import { ReservationStatus } from '@prisma/client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';


import { Button } from '@/app/components/ui/button';
import { api, ApiError } from '@/lib/api-client';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { CancelReason } from '@/lib/types/reservation';

import { MentorDayView } from './_components/MentorDayView';
import { ReservationManagementModal } from './_components/ReservationManagementModal';
import { SlotsCalendar } from './_components/SlotsCalendar';




// デバッグモード
const DEBUG = true;

// レッスンスロットの型定義（メンター視点）
interface MentorLessonSlot {
  id: string;
  teacherId: string;
  startTime: string | Date;
  endTime: string | Date;
  isAvailable: boolean;
  hourlyRate?: number;
  currency?: string;
  minDuration?: number;
  maxDuration?: number;
  // descriptionフィールドは存在しない
  // description?: string;
  teacher: {
    id: string;
    name: string | null;
    email?: string | null;
    image: string | null;
  };
  reservations: Array<{
    id: string;
    status: string;
    bookedStartTime?: string;
    bookedEndTime?: string;
    totalAmount?: number;
    notes?: string;
    student?: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

type ModalMode = 'view' | 'cancel' | 'reschedule' | 'approve' | 'reject';

// 予約データの型定義
interface ReservationData {
  id: string;
  status: ReservationStatus;
  bookedStartTime: Date;
  bookedEndTime: Date;
  totalAmount: number;
  notes?: string;
  teacher: { name: string; };
  student?: { name: string; };
}

interface SlotsCalendarClientProps {
  userRole: string;
}

export default function SlotsCalendarClient({ userRole }: SlotsCalendarClientProps) {
  const [slots, setSlots] = useState<MentorLessonSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 予約管理モーダル関連の状態
  const [selectedReservation, setSelectedReservation] = useState<ReservationData | null>(null);
  const [reservationModalMode, setReservationModalMode] = useState<ModalMode>('view');
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isReservationProcessing, setIsReservationProcessing] = useState(false);

  // 表示モード関連の状態
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [selectedDayViewDate, setSelectedDayViewDate] = useState<Date | null>(null);

  // スロットデータを取得する関数（RLSポリシー対応版）
  const fetchMySlots = useCallback(async () => {
    const startTime = performance.now();
    console.log('🔄 fetchMySlots開始');
    
    try {
      setIsLoading(true);
      
      const authStartTime = performance.now();
      // 認証トークンを取得
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData.session?.access_token ?? null;
      console.log(`⏱️ fetchMySlots - 認証取得: ${(performance.now() - authStartTime).toFixed(2)}ms`);
      
      if (!token) {
        throw new Error('認証が必要です。ログインしてください。');
      }
      
      // プロップスから渡されたユーザーロールを使用（Hydrationエラー回避）
      const currentUserRole = userRole;
      
      console.log('📊 userRole from props:', userRole);
      console.log(`APIリクエスト開始: レッスンスロットを取得 (ロール: ${currentUserRole})`);
      
      // ロールに応じてviewModeを設定
      let viewMode = 'own'; // デフォルト（メンターの場合）
      
      // スロットカレンダーページでは常に自分のスロットを表示
      // （メンターが自分のスロットを管理するためのページ）
      if (window.location.pathname.includes('slots-calendar')) {
        viewMode = 'own';
        console.log('📍 スロットカレンダーページのため、viewMode=ownを強制');
      } else if (currentUserRole === 'student') {
        viewMode = 'available'; // 生徒の場合は利用可能なスロットを取得
      } else if (currentUserRole === 'admin') {
        viewMode = 'all'; // 管理者の場合はすべてのスロットを取得
      }
      
      const apiStartTime = performance.now();
      const response = await fetch(`/api/lesson-slots?viewMode=${viewMode}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      console.log(`⏱️ fetchMySlots - API呼び出し: ${(performance.now() - apiStartTime).toFixed(2)}ms`);
      
      if (!response.ok) {
        const errorResponse = await response.json();
        console.error('APIエラーレスポンス:', errorResponse);
        throw new Error(
          errorResponse.error || 
          `API通信エラー: ${response.status} ${response.statusText}`
        );
      }
      
      const parseStartTime = performance.now();
      const data: MentorLessonSlot[] = await response.json();
      console.log(`⏱️ fetchMySlots - レスポンス解析: ${(performance.now() - parseStartTime).toFixed(2)}ms`);
      console.log(`取得したレッスンスロット: ${data.length}件 (${viewMode}モード)`);
      
      if (DEBUG && data.length > 0) {
        console.log('最初のスロット例:', {
          id: data[0].id,
          startTime: data[0].startTime,
          endTime: data[0].endTime,
          isAvailable: data[0].isAvailable,
          reservations: data[0].reservations?.length || 0,
          teacherName: data[0].teacher?.name
        });
        
        // PENDING_APPROVALの予約を確認
        const pendingApprovalReservations = data.flatMap(slot => 
          slot.reservations?.filter(res => res.status === 'PENDING_APPROVAL') || []
        );
        
        if (pendingApprovalReservations.length > 0) {
          console.log('🔍 PENDING_APPROVALの予約:', pendingApprovalReservations.length + '件');
          console.log('PENDING_APPROVAL予約詳細:', pendingApprovalReservations);
        } else {
          console.log('⚠️ PENDING_APPROVALの予約が見つかりません');
        }
      }
      
      setSlots(data);
      setError(null);
      console.log(`✅ fetchMySlots完了: ${(performance.now() - startTime).toFixed(2)}ms`);
      
    } catch (err) {
      console.error('スロット情報取得エラー:', err);
      setError(err instanceof Error ? err.message : 'スロット情報の取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, [userRole]);


  // 初回スロットデータ取得
  useEffect(() => {
    fetchMySlots();
  }, [fetchMySlots]);

  // リアルタイム更新を設定（RLSポリシー対応版）
  useEffect(() => {
    let subscription: ReturnType<typeof supabaseBrowser.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        // 認証されたユーザーの情報を取得
        const { data: sessionData } = await supabaseBrowser.auth.getSession();
        if (!sessionData.session?.user?.id) {
          console.log('認証されていないため、リアルタイム監視をスキップ');
          return;
        }

        // プロップスから渡されたユーザーロールを使用（Hydrationエラー回避）
        const roleForChannel = userRole;
        
        // ロールに応じたリアルタイム監視の設定
        const channelName = `lesson-slots-changes-${roleForChannel}`;
        
        subscription = supabaseBrowser
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'lesson_slots',
              // RLSポリシーによりアクセス可能なデータのみが配信される
              // フィルターは不要（RLSが自動的に適用される）
            },
            (payload) => {
              console.log(`リアルタイム更新を受信 (${userRole}):`, payload);
              
              // データ変更があった場合に自動的にリフレッシュ
              setTimeout(() => {
                fetchMySlots();
              }, 500);
            }
          )
          .subscribe((status) => {
            console.log(`リアルタイム監視状態 (${userRole}):`, status);
            
            if (status === 'SUBSCRIBED') {
              console.log('✅ リアルタイム監視が開始されました');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error('❌ リアルタイム監視でエラーが発生しました:', status);
            }
          });
      } catch (error) {
        console.error('リアルタイム監視の設定エラー:', error);
      }
    };

    setupRealtimeSubscription();

    // クリーンアップ
    return () => {
      if (subscription) {
        console.log('リアルタイム監視を停止');
        supabaseBrowser.removeChannel(subscription);
      }
    };
  }, [fetchMySlots, userRole]);

  // 予約クリック処理
  const handleReservationClick = async (reservation: MentorLessonSlot['reservations'][0], mode: ModalMode = 'view') => {
    try {
      // デバッグ: 予約情報を確認
      if (DEBUG) {
        console.log('=== handleReservationClick Debug ===');
        console.log('Reservation:', {
          id: reservation.id,
          status: reservation.status,
          bookedStartTime: reservation.bookedStartTime,
          bookedEndTime: reservation.bookedEndTime
        });
        console.log('Mode:', mode);
      }
      
      // スロット情報を取得（予約から逆引き）
      const parentSlot = slots.find(slot => 
        slot.reservations.some(res => res.id === reservation.id)
      );

      let totalAmount = 0;
      try {
        // 予約の詳細情報をAPIから取得
        const reservationDetail = await api.get(`/api/reservations/${reservation.id}`) as {
          totalAmount?: number;
          total_amount?: number;
          [key: string]: unknown;
        };
        
        // デバッグ用ログ
        console.log('=== handleReservationClick API Debug ===');
        console.log('API Response:', reservationDetail);
        console.log('totalAmount from API:', reservationDetail.totalAmount);
        console.log('total_amount from API:', reservationDetail.total_amount);
        console.log('============================================');
        
        totalAmount = reservationDetail.totalAmount || 0;
      } catch (error) {
        if (error instanceof ApiError) {
          console.warn(`API request failed (${error.status}), calculating from slot data`);
        } else {
          console.warn('API request failed, calculating from slot data');
        }
        // APIエラーの場合はスロットの時間単価から計算
        const duration = new Date(reservation.bookedEndTime || '').getTime() - new Date(reservation.bookedStartTime || '').getTime();
        const hours = duration / (1000 * 60 * 60);
        totalAmount = Math.round((parentSlot?.hourlyRate || 5000) * hours);
        console.log('Calculated totalAmount from slot:', totalAmount);
      }
      
      console.log('Final totalAmount value:', totalAmount);
      
      // 予約データを適切な形式に変換
      const reservationData: ReservationData = {
        id: reservation.id,
        status: reservation.status as ReservationStatus,
        bookedStartTime: new Date(reservation.bookedStartTime || ''),
        bookedEndTime: new Date(reservation.bookedEndTime || ''),
        totalAmount: totalAmount,
        notes: reservation.notes,
        teacher: { 
          name: parentSlot?.teacher?.name || 'Unknown Teacher' 
        },
        student: reservation.student ? { 
          name: reservation.student.name || 'Unknown Student' 
        } : undefined,
      };

      setSelectedReservation(reservationData);
      setReservationModalMode(mode);
      setIsReservationModalOpen(true);
    } catch (error) {
      console.error('予約詳細取得エラー:', error);
      toast.error('予約詳細の取得に失敗しました');
    }
  };

  // 日付クリック処理 - 日別表示に切り替え
  const handleDateClick = (date: Date) => {
    console.log('日付クリック:', date);
    setSelectedDayViewDate(date);
    setViewMode('day');
  };

  // 月表示に戻る
  const handleBackToMonth = () => {
    setViewMode('month');
    setSelectedDayViewDate(null);
  };

  // 日別表示での日付ナビゲーション
  const handleDayNavigation = (date: Date) => {
    setSelectedDayViewDate(date);
  };

  // 日別表示からの予約クリック処理
  const handleDayViewReservationClick = (reservation: MentorLessonSlot['reservations'][0]) => {
    console.log('🔍 日別表示から予約クリック:', {
      id: reservation.id,
      status: reservation.status,
      studentName: reservation.student?.name
    });
    // 既存のhandleReservationClickを利用
    handleReservationClick(reservation, 'view');
  };

  // 日別表示での直接承認処理
  const handleDayViewApprove = async (reservationId: string) => {
    const startTime = performance.now();
    console.log(`🚀 承認処理開始: ${reservationId}`);
    
    try {
      setIsReservationProcessing(true);
      
      const authStartTime = performance.now();
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData.session?.access_token ?? null;
      console.log(`⏱️ 認証取得: ${(performance.now() - authStartTime).toFixed(2)}ms`);

      if (!token) {
        throw new Error('認証が必要です');
      }

      const apiStartTime = performance.now();
      console.log('📡 承認APIコール開始:', {
        url: `/api/reservations/${reservationId}/approve`,
        token: token ? 'あり' : 'なし',
        tokenLength: token?.length
      });
      
      const response = await fetch(`/api/reservations/${reservationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        // タイムアウトを10秒に設定
        signal: AbortSignal.timeout(10000)
      });
      console.log(`⏱️ API呼び出し: ${(performance.now() - apiStartTime).toFixed(2)}ms`);
      console.log('📡 レスポンス詳細:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorMessage = '承認処理に失敗しました';
        let errorDetails = {};
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            errorMessage = result.error || errorMessage;
            errorDetails = result;
          } else {
            // JSONではないレスポンスの場合
            const text = await response.text();
            console.error('非JSONエラーレスポンス:', text);
            errorMessage = `サーバーエラー (${response.status}): ${text.substring(0, 100)}`;
          }
        } catch (jsonError) {
          console.error('エラーレスポンスの解析に失敗:', {
            error: jsonError,
            status: response.status,
            statusText: response.statusText
          });
        }
        
        console.error('承認APIエラー詳細:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          errorDetails
        });
        
        throw new Error(errorMessage);
      }

      // 成功時もレスポンスを読み取る（空の場合も処理）
      let result = {};
      try {
        const text = await response.text();
        if (text) {
          result = JSON.parse(text);
        }
      } catch (parseError) {
        console.warn('レスポンスのJSON解析に失敗（空の可能性）:', parseError);
      }
      console.log('承認API成功レスポンス:', result);
      
      toast.success('予約を承認しました');
      
      // 🚀 高速化: ローカル状態を直接更新
      const localUpdateStartTime = performance.now();
      setSlots(prevSlots => 
        prevSlots.map(slot => ({
          ...slot,
          reservations: slot.reservations.map(reservation => 
            reservation.id === reservationId 
              ? { ...reservation, status: 'APPROVED' }
              : reservation
          )
        }))
      );
      console.log(`⚡ ローカル状態更新: ${(performance.now() - localUpdateStartTime).toFixed(2)}ms`);
      console.log(`✅ 承認処理完了: ${(performance.now() - startTime).toFixed(2)}ms`);
      
      // フォールバック: 2秒後に全データ同期（リアルタイム更新と競合回避）
      setTimeout(async () => {
        console.log('🔄 フォールバック同期開始');
        const refreshStartTime = performance.now();
        await fetchMySlots();
        console.log(`🔄 フォールバック同期完了: ${(performance.now() - refreshStartTime).toFixed(2)}ms`);
      }, 2000);
      
    } catch (error) {
      console.error('承認処理エラー:', error);
      
      // タイムアウトエラーの場合
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('承認処理がタイムアウトしました。しばらく待ってから再度お試しください。');
      } else {
        toast.error(`承認に失敗しました: ${(error as Error).message}`);
      }
    } finally {
      setIsReservationProcessing(false);
    }
  };

  // 日別表示での直接キャンセル処理
  const handleDayViewCancel = async (reservationId: string, reason: string = 'MENTOR_CANCELLED') => {
    const startTime = performance.now();
    console.log(`🚀 キャンセル処理開始: ${reservationId}`);
    
    try {
      setIsReservationProcessing(true);
      
      const authStartTime = performance.now();
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData.session?.access_token ?? null;
      console.log(`⏱️ 認証取得: ${(performance.now() - authStartTime).toFixed(2)}ms`);

      if (!token) {
        throw new Error('認証が必要です');
      }

      const apiStartTime = performance.now();
      const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, notes: 'メンターによりキャンセル' }),
        credentials: 'include',
      });
      console.log(`⏱️ API呼び出し: ${(performance.now() - apiStartTime).toFixed(2)}ms`);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'キャンセル処理に失敗しました');
      }

      console.log('キャンセルAPI成功レスポンス:', result);
      toast.success('予約をキャンセルしました');
      
      // 🚀 高速化: ローカル状態を直接更新
      const localUpdateStartTime = performance.now();
      setSlots(prevSlots => 
        prevSlots.map(slot => ({
          ...slot,
          reservations: slot.reservations.map(reservation => 
            reservation.id === reservationId 
              ? { ...reservation, status: 'CANCELED' }
              : reservation
          )
        }))
      );
      console.log(`⚡ ローカル状態更新: ${(performance.now() - localUpdateStartTime).toFixed(2)}ms`);
      console.log(`✅ キャンセル処理完了: ${(performance.now() - startTime).toFixed(2)}ms`);
      
      // フォールバック: 2秒後に全データ同期（リアルタイム更新と競合回避）
      setTimeout(async () => {
        console.log('🔄 フォールバック同期開始');
        const refreshStartTime = performance.now();
        await fetchMySlots();
        console.log(`🔄 フォールバック同期完了: ${(performance.now() - refreshStartTime).toFixed(2)}ms`);
      }, 2000);
      
    } catch (error) {
      console.error('キャンセル処理エラー:', error);
      toast.error(`キャンセルに失敗しました: ${(error as Error).message}`);
    } finally {
      setIsReservationProcessing(false);
    }
  };

  // 予約キャンセル処理（リアルタイム更新版）
  const handleReservationCancel = async (reason: CancelReason, notes?: string) => {
    if (!selectedReservation) return;
    
    try {
      setIsReservationProcessing(true);
      
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData.session?.access_token ?? null;

      if (!token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`/api/reservations/${selectedReservation.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, notes }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'キャンセル処理に失敗しました');
      }

      toast.success('予約をキャンセルしました');
      
      // モーダルを閉じる
      setIsReservationModalOpen(false);
      setSelectedReservation(null);
      
      // スロット一覧をリアルタイム更新
      await fetchMySlots();
      
    } catch (error) {
      console.error('キャンセル処理エラー:', error);
      toast.error(`キャンセルに失敗しました: ${(error as Error).message}`);
      throw error;
    } finally {
      setIsReservationProcessing(false);
    }
  };

  // 予約承認処理（リアルタイム更新版）
  const handleReservationApprove = async () => {
    if (!selectedReservation) return;
    
    try {
      setIsReservationProcessing(true);
      
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData.session?.access_token ?? null;

      if (!token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`/api/reservations/${selectedReservation.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '承認処理に失敗しました');
      }

      toast.success('予約を承認しました');
      
      // モーダルを閉じる
      setIsReservationModalOpen(false);
      setSelectedReservation(null);
      
      // スロット一覧をリアルタイム更新
      await fetchMySlots();
      
    } catch (error) {
      console.error('承認処理エラー:', error);
      toast.error(`承認に失敗しました: ${(error as Error).message}`);
      throw error;
    } finally {
      setIsReservationProcessing(false);
    }
  };

  // 予約拒否処理（リアルタイム更新版）
  const handleReservationReject = async (reason: string) => {
    if (!selectedReservation) return;
    
    try {
      setIsReservationProcessing(true);
      
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData.session?.access_token ?? null;

      if (!token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`/api/reservations/${selectedReservation.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
        credentials: 'include',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '拒否処理に失敗しました');
      }

      toast.success('予約を拒否しました');
      
      // モーダルを閉じる
      setIsReservationModalOpen(false);
      setSelectedReservation(null);
      
      // スロット一覧をリアルタイム更新
      await fetchMySlots();
      
    } catch (error) {
      console.error('拒否処理エラー:', error);
      toast.error(`拒否に失敗しました: ${(error as Error).message}`);
      throw error;
    } finally {
      setIsReservationProcessing(false);
    }
  };

  // リスケジュール処理（リアルタイム更新版）
  const handleReservationReschedule = async (newStartTime: Date, newEndTime: Date) => {
    if (!selectedReservation) return;
    
    try {
      setIsReservationProcessing(true);
      
      const { data: sessionData } = await supabaseBrowser.auth.getSession();
      const token = sessionData.session?.access_token ?? null;

      if (!token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`/api/reservations/${selectedReservation.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          newStartTime: newStartTime.toISOString(),
          newEndTime: newEndTime.toISOString()
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'リスケジュール処理に失敗しました');
      }

      toast.success('予約をリスケジュールしました');
      
      // モーダルを閉じる
      setIsReservationModalOpen(false);
      setSelectedReservation(null);
      
      // スロット一覧をリアルタイム更新
      await fetchMySlots();
      
    } catch (error) {
      console.error('リスケジュール処理エラー:', error);
      toast.error(`リスケジュールに失敗しました: ${(error as Error).message}`);
      throw error;
    } finally {
      setIsReservationProcessing(false);
    }
  };

  // スロット更新処理（最適化版）
  const handleSlotUpdate = useCallback((updatedSlot: MentorLessonSlot) => {
    console.log('🔄 handleSlotUpdate called:', {
      slotId: updatedSlot.id,
      startTime: updatedSlot.startTime,
      endTime: updatedSlot.endTime,
      isNew: !slots.some(s => s.id === updatedSlot.id)
    });
    
    setSlots(prev => {
      const existingSlotIndex = prev.findIndex(slot => slot.id === updatedSlot.id);
      
      if (existingSlotIndex >= 0) {
        // 既存スロットの更新
        console.log('✏️ 既存スロットを更新:', updatedSlot.id);
        const newSlots = [...prev];
        newSlots[existingSlotIndex] = updatedSlot;
        return newSlots;
      } else {
        // 新規スロットの追加
        console.log('➕ 新規スロットを追加:', updatedSlot.id);
        return [...prev, updatedSlot];
      }
    });
    
    // 成功メッセージを表示
    toast.success('スロットが正常に保存されました');
    
    // 更新が反映されない場合のフォールバック（短縮）
    setTimeout(() => {
      console.log('🔄 フォールバック: fetchMySlots を実行');
      fetchMySlots();
    }, 1000);
  }, [fetchMySlots, slots]);

  // スロット削除処理（最適化版）
  const handleSlotDelete = useCallback((deletedSlotId: string) => {
    setSlots(prev => prev.filter(slot => slot.id !== deletedSlotId));
    
    // 成功メッセージを表示
    toast.success('スロットが正常に削除されました');
    
    // 削除が反映されない場合のフォールバック（短縮）
    setTimeout(() => {
      fetchMySlots();
    }, 1000);
  }, [fetchMySlots]);

  // エラー時の再読み込み処理
  const handleRetry = () => {
    setError(null);
    fetchMySlots();
  };

  return (
    <>
      {/* ページヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">レッスンスロット管理</h1>
        <p className="text-sm text-gray-600 mt-1">
          あなたのレッスン予定と予約状況を管理できます
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg" role="alert">
          <p>{error}</p>
          <Button 
            onClick={handleRetry}
            variant="outline" 
            className="mt-2"
          >
            再読み込み
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {viewMode === 'month' ? (
            <SlotsCalendar
              slots={slots}
              isLoading={isLoading}
              onSlotUpdate={handleSlotUpdate}
              onSlotDelete={handleSlotDelete}
              onReservationClick={handleReservationClick}
              onDateClick={handleDateClick}
              userRole={userRole}
            />
          ) : (
            selectedDayViewDate && (
              <MentorDayView
                selectedDate={selectedDayViewDate}
                slots={slots}
                isLoading={isLoading}
                onBackToMonth={handleBackToMonth}
                onDayNavigation={handleDayNavigation}
                onReservationClick={handleDayViewReservationClick}
                onApprove={handleDayViewApprove}
                userRole={userRole as 'student' | 'mentor' | 'admin'}
                onSlotUpdate={handleSlotUpdate}
                onSlotDelete={handleSlotDelete}
              />
            )
          )}
        </div>
      )}
      
      {/* 予約管理モーダル */}
      {selectedReservation && (
        <ReservationManagementModal
          isOpen={isReservationModalOpen}
          onClose={() => {
            setIsReservationModalOpen(false);
            setSelectedReservation(null);
          }}
          mode={reservationModalMode}
          reservation={selectedReservation}
          userRole={userRole as 'student' | 'mentor' | 'admin'}
          onCancel={handleReservationCancel}
          onApprove={handleReservationApprove}
          onReject={handleReservationReject}
          onReschedule={handleReservationReschedule}
          onModeChange={(newMode) => setReservationModalMode(newMode)}
          isLoading={isReservationProcessing}
        />
      )}
      
      {DEBUG && slots.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold mb-2 text-blue-900">📊 スロット統計</h3>
          <div className="text-xs space-y-1 text-blue-800">
            <p>• 総スロット数: <span className="font-medium">{slots.length}</span></p>
            <p>• 予約済み: <span className="font-medium">{slots.filter(s => s.reservations?.some(r => r.status === 'CONFIRMED')).length}</span></p>
            <p>• 利用可能: <span className="font-medium">{slots.filter(s => s.isAvailable && !s.reservations?.some(r => r.status === 'CONFIRMED')).length}</span></p>
          </div>
        </div>
      )}
    </>
  );
} 