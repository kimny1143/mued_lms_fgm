export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PAID = "PAID",
  CANCELED = "CANCELED",
  COMPLETED = "COMPLETED"
}

export interface BookingInput {
  startTime: string; // ISO文字列形式
  endTime: string; // ISO文字列形式
  notes?: string;
  price: number;
  studentId: string;
  mentorId: string;
}

export interface BookingUpdateInput {
  id: string;
  startTime?: string;
  endTime?: string;
  status?: BookingStatus;
  notes?: string;
  price?: number;
}

export interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  studentId: string;
  mentorId: string;
} 