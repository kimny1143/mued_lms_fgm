import { prisma } from '../prisma';
import type { BookingInput, BookingUpdateInput, BookingStatus } from '../types/booking';

export const bookingService = {
  // 予約の作成
  async createBooking(data: BookingInput) {
    return await prisma.booking.create({
      data: {
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        notes: data.notes,
        price: data.price,
        student: { connect: { id: data.studentId } },
        mentor: { connect: { id: data.mentorId } }
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        mentor: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  // 予約の取得（ID指定）
  async getBookingById(id: string) {
    return await prisma.booking.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        mentor: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  // ユーザーの予約一覧を取得（生徒またはメンター）
  async getUserBookings(userId: string, role: 'student' | 'mentor') {
    const whereClause = role === 'student' 
      ? { studentId: userId }
      : { mentorId: userId };
    
    return await prisma.booking.findMany({
      where: whereClause,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        mentor: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });
  },

  // 全ての予約を取得（管理者用）
  async getAllBookings() {
    return await prisma.booking.findMany({
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        mentor: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });
  },

  // 予約の更新
  async updateBooking(data: BookingUpdateInput) {
    const { id, ...updateData } = data;
    
    const updates: any = {};
    
    if (updateData.startTime) updates.startTime = new Date(updateData.startTime);
    if (updateData.endTime) updates.endTime = new Date(updateData.endTime);
    if (updateData.status) updates.status = updateData.status;
    if (updateData.notes !== undefined) updates.notes = updateData.notes;
    if (updateData.price !== undefined) updates.price = updateData.price;
    
    return await prisma.booking.update({
      where: { id },
      data: updates,
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        mentor: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  // 予約のステータス更新
  async updateBookingStatus(id: string, status: BookingStatus) {
    return await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        mentor: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  // 予約の削除
  async deleteBooking(id: string) {
    return await prisma.booking.delete({
      where: { id }
    });
  }
}; 