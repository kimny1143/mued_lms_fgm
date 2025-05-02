import { useState, useRef } from "react";
import { ImageIcon, UploadIcon, XCircleIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

interface FileUploadProps {
  onChange: (file: File | null) => void;
  value: File | string | null;
  accept?: string;
  maxSize?: number; // サイズ制限（MB）
  className?: string;
  previewUrl?: string;
}

export function FileUpload({
  onChange,
  value,
  accept = "image/*",
  maxSize = 5, // デフォルトは5MB
  className,
  previewUrl,
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(
    typeof value === "string" ? value : previewUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (!file) {
      onChange(null);
      setPreview(null);
      return;
    }

    // ファイルサイズのバリデーション
    if (file.size > maxSize * 1024 * 1024) {
      setError(`ファイルサイズは${maxSize}MB以下である必要があります`);
      return;
    }

    // ファイルタイプのバリデーション
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルのみアップロード可能です");
      return;
    }

    setError(null);
    onChange(file);

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />

      {!preview ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={triggerFileInput}
        >
          <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
          <div className="text-sm text-gray-500 text-center">
            クリックして画像をアップロード
            <span className="block mt-1">または画像をドラッグ＆ドロップ</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={(e) => {
              e.stopPropagation();
              triggerFileInput();
            }}
          >
            <UploadIcon className="w-4 h-4 mr-2" />
            画像を選択
          </Button>
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="プレビュー"
            className="rounded-lg w-full h-auto max-h-64 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
          >
            <XCircleIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <p className="text-gray-500 text-xs mt-2">
        最大ファイルサイズ: {maxSize}MB、推奨サイズ: 400 x 400 ピクセル
      </p>
    </div>
  );
} 