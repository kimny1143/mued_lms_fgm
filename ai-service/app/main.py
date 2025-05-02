"""
MUED LMS AI Service - FastAPI Application
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import time
import logging

from app.api import router, booking_router
from app.error_handlers import register_error_handlers, setup_exception_handlers

app = FastAPI(
    title="MUED LMS AI Service",
    description="AI backend for MUED Learning Management System",
    version="0.1.0"
)

# CORSを設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切なオリジンに制限する
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# エラーハンドラーを登録
register_error_handlers(app)

# ルーターを登録
app.include_router(router, prefix="/api")
app.include_router(booking_router, prefix="/api")

@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "MUED LMS AI Service",
        "status": "running",
        "version": app.version,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 