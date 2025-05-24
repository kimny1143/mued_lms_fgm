'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface ReservationDetails {
  sessionId: string;
  status: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  metadata: {
    reservationId?: string;
    userId?: string;
    teacher?: string;
    date?: string;
    time?: string;
    duration?: string;
    // 旧フィールドもサポート（後方互換性）
    slotId?: string;
    mentorId?: string;
    startTime?: string;
    endTime?: string;
    hourlyRate?: string;
  };
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [reservationDetails, setReservationDetails] = useState<ReservationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchReservationDetails(sessionId);
    } else {
      setError('セッションIDが見つかりません');
      setIsLoading(false);
    }
  }, [sessionId]);

  const fetchReservationDetails = async (sessionId: string) => {
    try {
      console.log('🔍 予約詳細取得開始:', sessionId);
      console.log('🌐 ベースURL:', window.location.origin);
      
      // クエリパラメータ形式に変更
      const apiUrl = `/api/checkout-session?sessionId=${sessionId}`;
      console.log('🌐 新しいAPIエンドポイント:', apiUrl);
      
      // まずテストエンドポイントを呼び出してAPIルーティングを確認
      console.log('🧪 テストエンドポイント呼び出し中...');
      try {
        const testResponse = await fetch('/api/checkout-session/test');
        console.log('🧪 テストレスポンス状態:', {
          ok: testResponse.ok,
          status: testResponse.status,
          statusText: testResponse.statusText
        });
        const testData = await testResponse.json();
        console.log('🧪 テストデータ:', testData);
      } catch (testErr) {
        console.error('🧪 テストエンドポイントエラー:', testErr);
      }
      
      console.log('📡 実際のAPIエンドポイント呼び出し中...');
      const response = await fetch(apiUrl);
      
      console.log('📡 レスポンス状態:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });
      
      // レスポンスがJSONかどうかを確認
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ JSONでないレスポンス:', textResponse.substring(0, 100) + '...');
        throw new Error('APIからHTMLレスポンスが返されました。APIエンドポイントに問題があります。');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ APIエラーレスポンス:', errorData);
        throw new Error(errorData.error || '予約詳細の取得に失敗しました');
      }
      
      const details = await response.json();
      console.log('✅ 予約詳細取得成功:', details);
      setReservationDetails(details);
    } catch (err) {
      console.error('❌ 予約詳細取得エラー:', err);
      setError(err instanceof Error ? err.message : '予約詳細の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">予約情報を確認中...</p>
        </div>
      </div>
    );
  }

  if (error || !reservationDetails) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
            <p>{error || '予約情報が見つかりません'}</p>
            <Link href="/dashboard/booking-calendar">
              <Button className="mt-4">予約ページに戻る</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // metadataから時間情報を取得（旧フィールドと新フィールドをサポート）
  const getTimeInfo = () => {
    const metadata = reservationDetails.metadata;
    
    // 新しいフォーマット（teacher, date, time, duration）の場合
    if (metadata.teacher && metadata.date && metadata.time) {
      return {
        teacher: metadata.teacher,
        dateString: metadata.date,
        timeString: metadata.time,
        duration: metadata.duration || '60分',
        isNewFormat: true
      };
    }
    
    // 旧フォーマット（startTime, endTime）の場合
    if (metadata.startTime && metadata.endTime) {
      const startTime = new Date(metadata.startTime);
      const endTime = new Date(metadata.endTime);
      return {
        startTime,
        endTime,
        isNewFormat: false
      };
    }
    
    // どちらの形式でもない場合
    return null;
  };
  
  const timeInfo = getTimeInfo();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">予約完了！</h1>
            <p className="text-gray-600">レッスンの予約が正常に完了しました。</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">予約詳細</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">予約ID:</span>
                <span className="font-medium">{reservationDetails.sessionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">レッスン開始:</span>
                <span className="font-medium">
                  {timeInfo ? (
                    timeInfo.isNewFormat ? (
                      `${timeInfo.dateString} ${timeInfo.timeString}`
                    ) : (
                      timeInfo.startTime && timeInfo.startTime.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short',
                      }) + ' ' + timeInfo.startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                    )
                  ) : (
                    '詳細情報なし'
                  )}
                </span>
              </div>
              {timeInfo && !timeInfo.isNewFormat && timeInfo.endTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">レッスン終了:</span>
                  <span className="font-medium">
                    {timeInfo.endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {timeInfo && timeInfo.isNewFormat && (
                <div className="flex justify-between">
                  <span className="text-gray-600">レッスン時間:</span>
                  <span className="font-medium">{timeInfo.duration}</span>
                </div>
              )}
              {timeInfo && timeInfo.isNewFormat && (
                <div className="flex justify-between">
                  <span className="text-gray-600">講師:</span>
                  <span className="font-medium">{timeInfo.teacher}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">料金:</span>
                <span className="font-medium">
                  ¥{reservationDetails.amount.toLocaleString()} ({reservationDetails.currency.toUpperCase()})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">支払い状況:</span>
                <span className="font-medium text-green-600">完了</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">次のステップ</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 確認メールを送信しました</li>
              <li>• 講師から連絡があります</li>
              <li>• レッスン詳細を確認してください</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard/reservations" className="flex-1">
              <Button variant="outline" className="w-full">
                予約一覧を確認
              </Button>
            </Link>
            <Link href="/dashboard/booking-calendar" className="flex-1">
              <Button className="w-full">
                新しい予約をする
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 