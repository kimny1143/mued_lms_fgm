import { createClient } from '@supabase/supabase-js';

import { getSiteUrl } from './utils/url';

// Supabase環境変数
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数チェック（存在しなければビルドを失敗させる）
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Supabase 環境変数が不足しています: ' +
      `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl ?? 'undefined'} ` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey ? '(set)' : 'undefined'}`
  );
}

// 現在の環境に合わせたサイトURL
const siteUrl = getSiteUrl();
console.log(`Supabase初期化 - サイトURL: ${siteUrl}`);

// Supabaseクライアント設定
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce' // PKCEフローに統一
  },
  global: {
    // こちらがリダイレクトURLのベースとなるURL
    headers: {
      'x-site-url': siteUrl  // カスタムヘッダーでサイトURLを通知
    }
  }
});

// このファイルがインポートされた時点でSupabaseクライアントの初期状態をログ出力
if (process.env.NODE_ENV !== 'production') {
  console.log(`Supabase認証設定 - ${new Date().toISOString()}`);
  console.log(`- サイトURL: ${siteUrl}`);
  console.log(`- 環境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`- Vercel URL: ${process.env.VERCEL_URL || 'なし'}`);
  console.log(`- 認証フロー: implicit`);
}

// Supabaseの認証状態が変わったときのハンドラーを設定
if (typeof window !== 'undefined') {
  // クライアント側でのみ実行
  supabaseServer.auth.onAuthStateChange(async (event, session) => {
    if (event === 'INITIAL_SESSION') {
      console.log(`認証状態初期化: ${session ? '認証済み' : '未認証'}`);
    } else if (event === 'SIGNED_IN' && session) {
      console.log('ログイン検知 - ユーザー:', session.user.email);
    } else if (event === 'SIGNED_OUT') {
      console.log('ログアウト検知');
    } else {
      console.log('認証状態変更:', event);
    }
  });
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY missing!');
}

export { supabaseServer as supabase };