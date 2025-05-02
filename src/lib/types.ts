// チャットメッセージ関連の型定義

export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'student' | 'instructor' | 'system';
  room_id: string;
  timestamp: string;
  files?: ChatAttachment[];
}

export interface ChatAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  participants: ChatParticipant[];
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar_url?: string;
  role: 'student' | 'instructor';
}

// 通信用リクエスト/レスポンス型
export interface GetMessagesResponse {
  messages: ChatMessage[];
  has_more: boolean;
  next_cursor?: string;
}

export interface SendMessageRequest {
  content: string;
  room_id: string;
  files?: File[];
}

// ユーザーロール定義
export enum UserRole {
  STUDENT = 'student',
  MENTOR = 'mentor',
  ADMIN = 'admin'
}

// ユーザータイプ拡張（NextAuth + Supabase用）
export interface UserWithRole {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: UserRole;
} 