import { z } from "zod";
import { BookingStatus } from "../types/booking";

// 予約作成用スキーマ
export const createBookingSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
  price: z.number().positive(),
  studentId: z.string().min(1),
  mentorId: z.string().min(1)
}).refine(data => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: "終了時間は開始時間より後である必要があります",
  path: ["endTime"]
});

// 予約更新用スキーマ
export const updateBookingSchema = z.object({
  id: z.string().min(1),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  notes: z.string().optional(),
  price: z.number().positive().optional()
}).refine(data => {
  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end > start;
  }
  return true;
}, {
  message: "終了時間は開始時間より後である必要があります",
  path: ["endTime"]
});

// 予約ID取得用スキーマ
export const bookingIdSchema = z.object({
  id: z.string().min(1)
});

// ステータス更新用スキーマ
export const updateBookingStatusSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(BookingStatus)
}); 