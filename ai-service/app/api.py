"""
MUED LMS AI Service - API Endpoints
"""
from fastapi import APIRouter, HTTPException, Request, Depends, Body, Path, Query, status
import uuid
from datetime import datetime
import json
import logging
import base64
import os
from os import environ

# テスト実行時にstripeモジュールが存在しない場合のモック対応
try:
    import stripe
except ImportError:
    # Stripeモジュールが存在しない場合はMockオブジェクトを作成
    class MockStripe:
        def __getattr__(self, name):
            return lambda *args, **kwargs: None
    
    stripe = MockStripe()

from app.models import (
    CourseGenerationRequest, 
    CourseGenerationResponse, 
    CourseModule, 
    LessonContent, 
    ExerciseLogCreate, 
    ExerciseLog,
    WebhookEvent,
    StripeWebhookEvent,
    ChatMessageCreate,
    ChatMessage,
    ChatMessageList,
    MusicXMLConvertRequest,
    MusicXMLConvertResponse,
    BookingCreate, BookingUpdate, Booking, BookingStatusUpdate, BookingStatus,
    PDFExtractRequest, PDFExtractResponse
)

router = APIRouter()

# ロガーの設定
logger = logging.getLogger("mued.api")

# 予約関連のルーター
booking_router = APIRouter(
    prefix="/bookings",
    tags=["Booking"]
)

# 疑似DB（実際の実装ではPrismaClient経由でDBアクセス）
fake_bookings_db = []
booking_id_counter = 1

@router.post("/v1/courses/generate", response_model=CourseGenerationResponse)
async def generate_course(request: CourseGenerationRequest) -> CourseGenerationResponse:
    """
    コース生成エンドポイント
    
    指定されたトピックと条件に基づいて新しいコースを生成します。
    現在はモックデータを返します。
    """
    # TODO: 実際のAIモデルを使用したコース生成を実装
    # 現段階ではモックレスポンスを返す
    
    # リクエストデータに基づいて動的にモックデータを生成
    course_id = f"{'-'.join(request.topic.lower().split()[:3])}-{uuid.uuid4().hex[:8]}"
    
    # モジュール1
    module1_lessons = [
        LessonContent(
            title=f"{request.topic}の基本概念",
            description=f"{request.topic}における基本的な概念と用語を学びます。",
            content_type="video",
            duration_minutes=15,
            content_url=f"https://example.com/videos/{course_id}/intro"
        ),
        LessonContent(
            title="歴史と背景",
            description=f"{request.topic}の歴史的背景と発展について学びます。",
            content_type="text",
            duration_minutes=20,
            content_text="ここにテキストコンテンツが入ります。"
        )
    ]
    
    # モジュール2
    module2_lessons = [
        LessonContent(
            title=f"{request.topic}の実践テクニック",
            description="実践的なテクニックと演習",
            content_type="video",
            duration_minutes=25,
            content_url=f"https://example.com/videos/{course_id}/techniques"
        ),
        LessonContent(
            title="演習問題",
            description="学んだ内容を確認するための演習問題",
            content_type="exercise",
            duration_minutes=30,
            content_url=f"https://example.com/exercises/{course_id}/practice"
        )
    ]
    
    # レスポンスの作成
    response = CourseGenerationResponse(
        course_id=course_id,
        title=f"{request.topic}: {request.level}レベルコース",
        description=f"{request.topic}の{request.level}レベルの学習者向けコースです。" + 
                   (f"目標: {request.goal}" if request.goal else ""),
        level=request.level,
        estimated_duration_hours=2.5,
        modules=[
            CourseModule(
                title="基礎と概念",
                description=f"{request.topic}の基礎知識を学びます。",
                order=1,
                lessons=module1_lessons
            ),
            CourseModule(
                title="実践とスキル習得",
                description="実践的なスキルを身につけます。",
                order=2,
                lessons=module2_lessons
            )
        ]
    )
    
    return response

@router.post("/v1/exercise/logs", response_model=ExerciseLog)
async def create_exercise_log(request: ExerciseLogCreate) -> ExerciseLog:
    """
    練習記録保存エンドポイント
    
    ユーザーの練習記録を保存します。
    現在はモックデータを返します。
    """
    # 実際にはデータベースに保存する処理を実装
    # 現段階ではモックレスポンスを返す
    
    # 日付が設定されていない場合は現在時刻を使用
    log_date = request.date or datetime.now()
    
    # レスポンスの作成
    response = ExerciseLog(
        id=str(uuid.uuid4()),
        user_id=request.user_id,
        instrument=request.instrument,
        duration_minutes=request.duration_minutes,
        difficulty=request.difficulty,
        notes=request.notes,
        mood=request.mood,
        date=log_date,
        created_at=datetime.now()
    )
    
    return response

@router.post("/v1/webhooks/general")
async def general_webhook_handler(event: WebhookEvent):
    """
    汎用Webhookエンドポイント
    
    様々なサービスからのイベント通知を受け取ります。
    """
    logger.info(f"Received webhook event: {event.type}")
    
    # イベントタイプに応じた処理を実装
    # 現段階では受信したイベントをログに記録するのみ
    
    return {"status": "success", "message": f"Event {event.id} of type {event.type} processed"}

@router.post("/v1/webhooks/stripe")
async def stripe_webhook_handler(request: Request):
    """
    Stripe Webhookエンドポイント
    
    Stripeからの支払い関連イベント通知を受け取ります。
    """
    # リクエストボディを取得
    body = await request.body()
    payload = json.loads(body)
    
    # Stripe署名検証はここでは省略（本番実装時に追加）
    
    event_type = payload.get("type", "unknown")
    event_id = payload.get("id", "unknown")
    
    logger.info(f"Received Stripe webhook: {event_type} (ID: {event_id})")
    
    # イベントタイプに応じた処理
    if event_type == "payment_intent.succeeded":
        # 支払い成功時の処理
        logger.info("Payment succeeded!")
    elif event_type == "checkout.session.completed":
        # チェックアウト完了時の処理
        logger.info("Checkout completed!")
    elif event_type == "customer.subscription.created":
        # サブスクリプション作成時の処理
        logger.info("Subscription created!")
    else:
        logger.info(f"Unhandled event type: {event_type}")
    
    return {"status": "success", "message": f"Stripe event {event_id} processed"}

@router.get("/v1/chat/messages", response_model=ChatMessageList)
async def get_chat_messages(room_id: str, limit: int = 20) -> ChatMessageList:
    """
    チャットメッセージ取得エンドポイント
    
    指定されたルームのチャットメッセージを取得します。
    現在はモックデータを返します。
    """
    # 現段階ではモックデータを返す
    messages = [
        ChatMessage(
            id=str(uuid.uuid4()),
            room_id=room_id,
            user_id="user1",
            username="田中先生",
            message="こんにちは、レッスンの準備はできていますか？",
            created_at=datetime.now()
        ),
        ChatMessage(
            id=str(uuid.uuid4()),
            room_id=room_id,
            user_id="user2",
            username="山田さん",
            message="はい、準備できています。今日は何から始めますか？",
            created_at=datetime.now()
        )
    ]
    
    return ChatMessageList(messages=messages, total=len(messages))

@router.post("/v1/chat/messages", response_model=ChatMessage)
async def create_chat_message(message: ChatMessageCreate) -> ChatMessage:
    """
    チャットメッセージ作成エンドポイント
    
    新しいチャットメッセージを作成します。
    現在はモックレスポンスを返します。
    """
    # メッセージにIDと作成日時を追加
    message_id = str(uuid.uuid4())
    created_at = datetime.now()
    
    saved_message = ChatMessage(
        id=message_id,
        room_id=message.room_id,
        user_id=message.user_id,
        username=message.username,
        message=message.message,
        created_at=created_at
    )
    
    return saved_message

@router.post("/v1/musicxml/convert", response_model=MusicXMLConvertResponse)
async def convert_musicxml(request: MusicXMLConvertRequest) -> MusicXMLConvertResponse:
    """
    MusicXML変換エンドポイント
    
    MusicXMLデータをJSON形式またはプレビュー画像に変換します。
    現在はモックデータを返します。
    """
    logger.info(f"MusicXML conversion requested in format: {request.format}")
    
    # 最初にフォーマットの検証を行い、無効な場合は早期に400エラーを返す
    if request.format not in ["json", "preview"]:
        logger.warning(f"Invalid format requested: {request.format}")
        raise HTTPException(status_code=400, detail=f"Unsupported format: {request.format}")
    
    try:
        # Base64デコードする（実際の処理では使用）
        # xml_content = base64.b64decode(request.xml_content).decode('utf-8')
        # ここでXML解析と変換処理を行う（現段階ではスキップ）
        
        result = {}
        preview_url = None
        
        if request.format == "json":
            # JSONフォーマットの場合
            result = {
                "metadata": {
                    "title": "サンプル楽譜",
                    "composer": "MUED LMS",
                },
                "parts": [
                    {
                        "id": "P1",
                        "name": "Piano",
                        "measures": [
                            {
                                "number": 1,
                                "notes": [
                                    {"pitch": "C4", "duration": "quarter"},
                                    {"pitch": "D4", "duration": "quarter"},
                                    {"pitch": "E4", "duration": "quarter"},
                                    {"pitch": "F4", "duration": "quarter"}
                                ]
                            }
                        ]
                    }
                ]
            }
        elif request.format == "preview":
            # プレビュー画像の場合
            result = {"status": "generated"}
            preview_url = f"https://example.com/musicxml/preview/{uuid.uuid4().hex}.png"
        
        response = MusicXMLConvertResponse(
            id=f"convert-{uuid.uuid4().hex[:8]}",
            format=request.format,
            result=result,
            preview_url=preview_url,
            created_at=datetime.now()
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error converting MusicXML: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")

# 新規予約の作成
@booking_router.post("/", response_model=Booking, status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingCreate):
    global booking_id_counter
    booking_id = str(booking_id_counter)
    booking_id_counter += 1
    
    new_booking = Booking(
        id=booking_id,
        start_time=booking.start_time,
        end_time=booking.end_time,
        notes=booking.notes,
        price=booking.price,
        status=BookingStatus.PENDING,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        student_id=booking.student_id,
        mentor_id=booking.mentor_id,
        # ここでは簡易的に実装。実際はDBから取得
        student={"id": booking.student_id, "name": "Student Name", "email": "student@example.com"},
        mentor={"id": booking.mentor_id, "name": "Mentor Name", "email": "mentor@example.com"}
    )
    
    fake_bookings_db.append(new_booking)
    return new_booking

# 全予約の取得
@booking_router.get("/", response_model=list[Booking])
async def get_all_bookings():
    return fake_bookings_db

# IDで予約を取得
@booking_router.get("/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str = Path(..., description="予約ID")):
    for booking in fake_bookings_db:
        if booking.id == booking_id:
            return booking
    raise HTTPException(status_code=404, detail="予約が見つかりません")

# ユーザーの予約を取得
@booking_router.get("/user/{user_id}", response_model=list[Booking])
async def get_user_bookings(
    user_id: str = Path(..., description="ユーザーID"),
    role: str = Query(..., description="ユーザーの役割（student または mentor）")
):
    if role not in ["student", "mentor"]:
        raise HTTPException(status_code=400, detail="役割は 'student' または 'mentor' である必要があります")
    
    result = []
    for booking in fake_bookings_db:
        if (role == "student" and booking.student_id == user_id) or \
           (role == "mentor" and booking.mentor_id == user_id):
            result.append(booking)
    
    return result

# 予約を更新
@booking_router.put("/{booking_id}", response_model=Booking)
async def update_booking(
    booking_update: BookingUpdate,
    booking_id: str = Path(..., description="予約ID")
):
    for i, booking in enumerate(fake_bookings_db):
        if booking.id == booking_id:
            updated_booking = booking.dict()
            
            # 更新対象のフィールドを更新
            for key, value in booking_update.dict(exclude_unset=True).items():
                if value is not None:
                    updated_booking[key] = value
            
            updated_booking["updated_at"] = datetime.now()
            
            # 更新内容を反映
            fake_bookings_db[i] = Booking(**updated_booking)
            return fake_bookings_db[i]
    
    raise HTTPException(status_code=404, detail="予約が見つかりません")

# 予約のステータスを更新
@booking_router.patch("/{booking_id}/status", response_model=Booking)
async def update_booking_status(
    status_update: BookingStatusUpdate,
    booking_id: str = Path(..., description="予約ID")
):
    for i, booking in enumerate(fake_bookings_db):
        if booking.id == booking_id:
            # ステータスを更新
            updated_booking = booking.dict()
            updated_booking["status"] = status_update.status
            updated_booking["updated_at"] = datetime.now()
            
            # 更新内容を反映
            fake_bookings_db[i] = Booking(**updated_booking)
            return fake_bookings_db[i]
    
    raise HTTPException(status_code=404, detail="予約が見つかりません")

# 予約を削除
@booking_router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(booking_id: str = Path(..., description="予約ID")):
    """予約を削除します"""
    global fake_bookings_db
    
    # 指定されたIDの予約を検索
    booking_index = None
    for i, booking in enumerate(fake_bookings_db):
        if booking.id == booking_id:
            booking_index = i
            break
    
    if booking_index is None:
        raise HTTPException(status_code=404, detail=f"予約ID {booking_id} が見つかりません")
    
    # 予約を削除
    fake_bookings_db.pop(booking_index)
    
    return None

# Stripe Webhook処理
@booking_router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(event: StripeWebhookEvent):
    try:
        # checkout.session.completed イベントを処理
        if event.type == "checkout.session.completed":
            session = event.data.get("object", {})
            
            # セッションからメタデータを取得
            metadata = session.get("metadata", {})
            booking_id = metadata.get("booking_id")
            
            if booking_id:
                # 予約のステータスを PAID に更新
                for i, booking in enumerate(fake_bookings_db):
                    if booking.id == booking_id:
                        updated_booking = booking.dict()
                        updated_booking["status"] = BookingStatus.PAID
                        updated_booking["updated_at"] = datetime.now()
                        
                        # 更新内容を反映
                        fake_bookings_db[i] = Booking(**updated_booking)
                        break
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook処理エラー: {str(e)}")

@router.post("/v1/extract/pdf", response_model=PDFExtractResponse)
async def extract_pdf_text(request: PDFExtractRequest) -> PDFExtractResponse:
    """
    PDFからテキストを抽出するエンドポイント
    
    PDFファイルからテキストを抽出し、オプションで表データも抽出します。
    現在はモックデータを返します。
    """
    # 実際のPDF処理はここで行うが、MVPではモックデータを返す
    try:
        # 実際の実装では、Base64でエンコードされたPDFをデコードして処理する
        # decoded_content = base64.b64decode(request.file_content)
        # この例では、デコードされたPDFをパースし、テキストと表を抽出するロジックを追加
        
        # モックデータ生成
        extract_id = f"extract-{uuid.uuid4().hex[:8]}"
        current_time = datetime.now()
        
        # 言語検出のモック
        language_detected = request.language if request.language != "auto" else "ja"
        
        # モックの抽出テキスト
        mock_text = (
            "これはPDFから抽出されたモックテキストです。\n"
            "実際の実装では、PDFパーサーライブラリを使用して\n"
            "テキストを抽出します。\n\n"
            "複数ページのPDFからすべてのテキストが抽出されます。\n"
            "表や画像などの特殊なコンテンツについても、\n"
            "可能な限り処理されます。\n\n"
            "見出し1\n"
            "-----\n"
            "ここにはセクション1のコンテンツが入ります。\n"
            "音楽教育に関する内容が含まれています。\n\n"
            "見出し2\n"
            "-----\n"
            "ここにはセクション2のコンテンツが入ります。\n"
            "レッスン計画や教材についての説明が含まれています。"
        )
        
        # モックの表データ
        mock_tables = None
        if request.extract_tables:
            mock_tables = [
                {
                    "header": ["項目", "説明", "備考"],
                    "rows": [
                        ["基本レッスン", "初心者向け基礎講座", "週1回"],
                        ["中級レッスン", "楽器経験者向け", "週2回"],
                        ["マスタークラス", "プロ志望者向け", "月2回"]
                    ]
                },
                {
                    "header": ["教材名", "対象レベル", "価格"],
                    "rows": [
                        ["入門テキスト", "初級", "2,500円"],
                        ["演奏テクニック", "中級", "3,800円"],
                        ["専門家養成コース", "上級", "12,000円"]
                    ]
                }
            ]
        
        # レスポンス作成
        response = PDFExtractResponse(
            id=extract_id,
            text_content=mock_text,
            page_count=5,  # モックのページ数
            language_detected=language_detected,
            tables=mock_tables,
            created_at=current_time
        )
        
        return response
        
    except Exception as e:
        # エラーハンドリング
        logger.error(f"PDF extraction error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"PDF extraction failed: {str(e)}"
        )

# メインルーターにサブルーターを登録
api_router = APIRouter()
api_router.include_router(router)
api_router.include_router(booking_router) 