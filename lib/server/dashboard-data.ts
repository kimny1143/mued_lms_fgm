import { prisma } from '@/lib/prisma';
import { isToday, isFuture } from 'date-fns';
import { cache } from 'react';

export interface DashboardData {
  user: {
    id: string;
    email: string;
    name: string | null;
    role_id: string;
    image: string | null;
  };
  subscription: {
    priceId: string | null;
    status: string;
    currentPeriodEnd: number | null;
  };
  todaySchedule: Array<{
    id: string;
    startTime: string;
    endTime: string;
    actorName: string;
    status: string;
  }>;
  reservationStats: {
    pendingApproval: number;
    approved: number;
    confirmed: number;
  };
}

// React cacheを使用してリクエスト内でのキャッシュ
export const getDashboardData = cache(async (userId: string): Promise<DashboardData | null> => {
  try {
    // 並列でデータを取得
    const [user, reservations, roles] = await Promise.all([
      // ユーザー情報
      prisma.users.findUnique({
        where: { id: userId }
      }),
      
      // 予約情報
      prisma.reservations.findMany({
        where: {
          OR: [
            { student_id: userId }
          ]
        },
        include: {
          lesson_slots: {
            include: {
              users: true
            }
          },
          users: true
        },
        orderBy: { booked_start_time: 'asc' }
      }),
      
      // ロール情報
      prisma.roles.findMany({
        select: { id: true, name: true }
      })
    ]);

    if (!user) {
      return null;
    }

    const userRole = user.role_id || 'student';
    const isMentor = userRole === 'mentor';

    // メンターの場合は、メンターとしての予約も取得
    let mentorReservations: any[] = [];
    if (isMentor) {
      mentorReservations = await prisma.reservations.findMany({
        where: {
          lesson_slots: {
            teacher_id: userId
          }
        },
        include: {
          users: true,
          lesson_slots: true
        },
        orderBy: { booked_start_time: 'asc' }
      });
    }

    // すべての予約を結合
    const allReservations = [...reservations, ...mentorReservations];

    // 今日の予定を抽出
    const todaySchedule = allReservations
      .filter(res => {
        const startTime = new Date(res.booked_start_time);
        return res.status === 'CONFIRMED' && (isToday(startTime) || isFuture(startTime));
      })
      .map(res => ({
        id: res.id,
        startTime: res.booked_start_time.toISOString(),
        endTime: res.booked_end_time.toISOString(),
        actorName: isMentor 
          ? res.users?.name || '生徒情報なし'
          : res.lesson_slots?.users?.name || 'メンター情報なし',
        status: res.status
      }))
      .slice(0, 5); // 最初の5件のみ

    // 予約統計
    const reservationStats = {
      pendingApproval: allReservations.filter(r => r.status === 'PENDING_APPROVAL').length,
      approved: allReservations.filter(r => r.status === 'APPROVED').length,
      confirmed: allReservations.filter(r => r.status === 'CONFIRMED').length
    };

    // サブスクリプション情報（簡易版）
    const subscription = {
      priceId: null,
      status: userRole === 'mentor' || userRole === 'admin' ? 'role_exempt' : 'free',
      currentPeriodEnd: null
    };

    return {
      user: {
        id: user.id,
        email: user.email || '',
        name: user.name,
        role_id: userRole,
        image: user.image
      },
      subscription,
      todaySchedule,
      reservationStats
    };
  } catch (error) {
    console.error('ダッシュボードデータ取得エラー:', error);
    return null;
  }
});