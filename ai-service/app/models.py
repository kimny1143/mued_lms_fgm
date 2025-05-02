"""
MUED LMS AI Service - Data Models
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
from pydantic import validator

class CourseGenerationRequest(BaseModel):
    """コース生成リクエストモデル"""
    topic: str = Field(..., description="コースのトピック")
    level: str = Field(..., description="難易度レベル (beginner, intermediate, advanced)")
    goal: Optional[str] = Field(None, description="学習目標")
    keywords: Optional[List[str]] = Field(None, description="含めるべきキーワード")
    
    class Config:
        schema_extra = {
            "example": {
                "topic": "ジャズピアノ入門",
                "level": "beginner",
                "goal": "基本的なジャズピアノコードと即興演奏の基礎を学ぶ",
                "keywords": ["ジャズハーモニー", "コードプログレッション", "即興演奏"]
            }
        }

class LessonContent(BaseModel):
    """レッスンコンテンツモデル"""
    title: str
    description: str
    content_type: str = Field(..., description="コンテンツタイプ (video, text, exercise)")
    duration_minutes: int
    content_url: Optional[str] = None
    content_text: Optional[str] = None

class CourseModule(BaseModel):
    """コースモジュールモデル"""
    title: str
    description: str
    order: int
    lessons: List[LessonContent]

class CourseGenerationResponse(BaseModel):
    """コース生成レスポンスモデル"""
    course_id: str
    title: str
    description: str
    level: str
    estimated_duration_hours: float
    modules: List[CourseModule]
    
    class Config:
        schema_extra = {
            "example": {
                "course_id": "jazz-piano-basics-001",
                "title": "ジャズピアノ入門: 基礎から即興演奏まで",
                "description": "ジャズピアノの基本的な技術とハーモニーを学び、簡単な即興演奏ができるようになるためのコースです。",
                "level": "beginner",
                "estimated_duration_hours": 12.5,
                "modules": [
                    {
                        "title": "ジャズハーモニーの基礎",
                        "description": "ジャズで使われる基本的なコードとスケールを学びます。",
                        "order": 1,
                        "lessons": [
                            {
                                "title": "ジャズピアノ入門",
                                "description": "ジャズピアノの基本とコースの概要",
                                "content_type": "video",
                                "duration_minutes": 15,
                                "content_url": "https://example.com/videos/jazz-intro"
                            }
                        ]
                    }
                ]
            }
        }

# チャットメッセージ関連のモデル
class ChatMessageCreate(BaseModel):
    """チャットメッセージ作成リクエスト"""
    room_id: str
    user_id: str
    username: str
    message: str

class ChatMessage(BaseModel):
    """チャットメッセージレスポンス"""
    id: str
    room_id: str
    user_id: str
    username: str
    message: str
    created_at: datetime
    
    class Config:
        schema_extra = {
            "example": {
                "id": "msg-123456",
                "room_id": "room-abc123",
                "user_id": "user-456",
                "username": "田中先生",
                "message": "こんにちは、レッスンの準備はできていますか？",
                "created_at": "2024-05-01T12:30:45.123456"
            }
        }

class ChatMessageList(BaseModel):
    """チャットメッセージリストレスポンス"""
    messages: List[ChatMessage]
    total: int

# 練習ログ関連のモデル
class ExerciseLogCreate(BaseModel):
    """練習記録作成リクエスト"""
    user_id: str
    instrument: str
    duration_minutes: int
    difficulty: str  # 'easy', 'medium', 'hard'
    notes: Optional[str] = None
    mood: Optional[str] = None  # 'good', 'normal', 'bad'
    date: Optional[datetime] = None

class ExerciseLog(BaseModel):
    """練習記録レスポンス"""
    id: str
    user_id: str
    instrument: str
    duration_minutes: int
    difficulty: str
    notes: Optional[str] = None
    mood: Optional[str] = None
    date: datetime
    created_at: datetime

# MusicXML関連のモデル
class MusicXMLConvertRequest(BaseModel):
    """MusicXML変換リクエスト"""
    xml_content: str = Field(..., description="MusicXMLコンテンツ（Base64エンコード）")
    format: str = Field(..., description="変換フォーマット (json, preview)")
    options: Optional[Dict[str, Any]] = Field(None, description="変換オプション")
    
    class Config:
        schema_extra = {
            "example": {
                "xml_content": "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPCEtLSBNdXNpY1hNTCBTYW1wbGUgLS0+CjxzY29yZS1wYXJ0aXdpc2U+PC9zY29yZS1wYXJ0aXdpc2U+",
                "format": "json",
                "options": {
                    "includeMetadata": True,
                    "includeNotations": True
                }
            }
        }

class MusicXMLConvertResponse(BaseModel):
    """MusicXML変換レスポンス"""
    id: str
    format: str
    result: Dict[str, Any]
    preview_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        schema_extra = {
            "example": {
                "id": "convert-123456",
                "format": "json",
                "result": {
                    "metadata": {
                        "title": "楽譜タイトル",
                        "composer": "作曲者名"
                    },
                    "parts": [
                        {
                            "id": "P1",
                            "name": "Piano",
                            "measures": []
                        }
                    ]
                },
                "preview_url": "https://example.com/preview/123456.png",
                "created_at": "2024-05-01T12:30:45.123456"
            }
        }

# Webhookモデル
class WebhookEvent(BaseModel):
    """汎用Webhookイベントモデル"""
    id: str = Field(..., description="イベントID")
    type: str = Field(..., description="イベントタイプ")
    created: datetime = Field(..., description="作成日時")
    data: Dict[str, Any] = Field(..., description="イベントデータ")

# 予約関連のモデル
class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PAID = "PAID"
    CANCELED = "CANCELED"
    COMPLETED = "COMPLETED"

class BookingBase(BaseModel):
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None
    price: float = Field(gt=0)
    
    @validator('end_time')
    def end_time_must_be_after_start_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('終了時間は開始時間より後である必要があります')
        return v

class BookingCreate(BookingBase):
    student_id: str
    mentor_id: str

class BookingUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    notes: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    status: Optional[BookingStatus] = None
    
    @validator('end_time')
    def end_time_must_be_after_start_time(cls, v, values):
        if v and 'start_time' in values and values['start_time'] and v <= values['start_time']:
            raise ValueError('終了時間は開始時間より後である必要があります')
        return v

class BookingStatusUpdate(BaseModel):
    status: BookingStatus

class UserInfo(BaseModel):
    id: str
    name: str
    email: str

class Booking(BookingBase):
    id: str
    status: BookingStatus
    created_at: datetime
    updated_at: datetime
    student_id: str
    mentor_id: str
    student: Optional[UserInfo] = None
    mentor: Optional[UserInfo] = None
    
    class Config:
        orm_mode = True

# Stripe Webhook関連のモデル
class StripeWebhookEvent(BaseModel):
    """Stripe Webhook用のモデル"""
    id: str = Field(..., description="Stripeイベント識別子")
    type: str = Field(..., description="イベントタイプ (payment_intent.succeeded 等)")
    data: Dict[str, Any] = Field(..., description="イベントデータ")

# PDFテキスト抽出関連のモデル
class PDFExtractRequest(BaseModel):
    """PDF抽出リクエストモデル"""
    file_content: str = Field(..., description="PDFファイルのBase64エンコードされたコンテンツ")
    language: Optional[str] = Field("auto", description="抽出するテキストの言語（auto, ja, en, etc）")
    extract_tables: Optional[bool] = Field(False, description="表を抽出するかどうか")
    
    class Config:
        schema_extra = {
            "example": {
                "file_content": "JVBERi0xLjUKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCB...",
                "language": "ja",
                "extract_tables": True
            }
        }

class PDFExtractResponse(BaseModel):
    """PDF抽出レスポンスモデル"""
    id: str = Field(..., description="抽出処理のID")
    text_content: str = Field(..., description="抽出されたテキストコンテンツ")
    page_count: int = Field(..., description="PDFのページ数")
    language_detected: Optional[str] = Field(None, description="検出された言語")
    tables: Optional[List[Dict[str, Any]]] = Field(None, description="抽出された表データ")
    created_at: datetime = Field(..., description="抽出処理の作成日時")
    
    class Config:
        schema_extra = {
            "example": {
                "id": "extract-abc123",
                "text_content": "これはサンプルのPDFから抽出されたテキストです。\n複数行にわたるテキストデータが含まれます。",
                "page_count": 5,
                "language_detected": "ja",
                "tables": [
                    {
                        "header": ["項目", "値"],
                        "rows": [
                            ["項目1", "値1"],
                            ["項目2", "値2"]
                        ]
                    }
                ],
                "created_at": "2024-05-10T15:30:45.123456"
            }
        } 