// Cloudinaryスタブモジュール
// 本実装時には実際のCloudinary APIと連携する予定

/**
 * ファイルをCloudinaryにアップロードするスタブ関数
 * @param file アップロードするファイル
 * @returns ファイルの公開ID (実際のCloudinaryではこれを保存して後で参照する)
 */
export async function uploadImage(file: File): Promise<string> {
  // 本実装では実際のCloudinary APIを呼び出す
  console.log(`[STUB] Uploading image: ${file.name}`);
  
  // ファイル名からランダムなIDを生成するスタブロジック
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000);
  const publicId = `user_upload_${timestamp}_${randomSuffix}`;
  
  // アップロード成功を模倣するため少し遅延
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(publicId);
    }, 800);
  });
}

/**
 * Cloudinaryの画像URLを生成するスタブ関数
 * @param publicId 画像の公開ID
 * @param options 変換オプション
 * @returns 画像URL
 */
export function generateImageUrl(publicId: string, options?: {
  width?: number;
  height?: number;
  crop?: 'fill' | 'scale' | 'fit';
}): string {
  // ダミー画像URLを返す
  // 本実装では実際のCloudinary URLを構築する
  const width = options?.width || 400;
  const height = options?.height || 400;
  const crop = options?.crop || 'fill';
  
  // プレースホルダー画像URL (実際のCloudinaryではなくPlaceholderサービスを使用)
  return `https://place-hold.it/${width}x${height}?text=User_Image`;
} 