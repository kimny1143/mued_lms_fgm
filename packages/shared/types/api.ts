// @mued/shared/types/api - API request/response types

// Base API Response
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username?: string;
  role?: 'student' | 'mentor';
}

export interface AuthResponse {
  user: import('./models').User;
  session?: any;
  token?: string;
}

// Reservations
export interface CreateReservationRequest {
  lessonSlotId: string;
  notes?: string;
}

export interface UpdateReservationRequest {
  status?: import('./models').Reservation['status'];
  notes?: string;
}

// Lesson Slots
export interface CreateLessonSlotRequest {
  startTime: string;
  endTime: string;
  price: number;
  description?: string;
  topics?: string[];
  recurrence?: 'none' | 'weekly' | 'biweekly' | 'monthly';
}

export interface UpdateLessonSlotRequest {
  startTime?: string;
  endTime?: string;
  price?: number;
  status?: import('./models').LessonSlot['status'];
  description?: string;
  topics?: string[];
}

// Sessions
export interface StartSessionRequest {
  reservationId: string;
}

export interface EndSessionRequest {
  actualDuration?: number;
  notes?: string;
}

export interface SessionFeedbackRequest {
  rating: number;
  text?: string;
}

// Subscription
export interface CreateCheckoutSessionRequest {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

// Chat
export interface GetMessagesResponse {
  messages: import('./models').ChatMessage[];
  has_more: boolean;
  next_cursor?: string;
}

export interface SendMessageRequest {
  content: string;
  room_id: string;
  files?: File[];
}

// Cancellation & Reschedule
export interface CancelReservationRequest {
  reservationId: string;
  reason: import('./models').CancelReason;
  notes?: string;
}

export interface RescheduleReservationRequest {
  reservationId: string;
  newSlotId: string;
  newStartTime: Date;
  newEndTime: Date;
  reason?: string;
}

export interface RefundRequest {
  reservationId: string;
  refundAmount: number;
  reason: string;
}

export interface CancellationPolicyResult {
  canCancel: boolean;
  cancellationFee: number;
  reason?: string;
}

// Notification
export interface NotificationData {
  type: 'cancellation' | 'reschedule' | 'refund' | 'payment_reminder';
  reservationId: string;
  userId: string;
  metadata?: Record<string, string | number | boolean>;
}