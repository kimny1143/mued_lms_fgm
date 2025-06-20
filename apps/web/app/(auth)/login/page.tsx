'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

import { signInWithGoogle, signInWithEmail } from '@/app/actions/auth';
import { supabaseBrowser as supabase } from '@/lib/supabase-browser';
import { getBaseUrl } from '@/lib/utils';
import { cleanupPWASession, isPWA } from '@/lib/utils/pwa-logout';

// 検索パラメータを使用するコンポーネント
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessingHash, setIsProcessingHash] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cleaningSession, setCleaningSession] = useState(false);
  
  // PWAセッションクリーンアップ（ログアウト後）
  useEffect(() => {
    const performCleanup = async () => {
      const isAfterLogout = searchParams.get('logout') === 'true';
      
      if (isAfterLogout) {
        setCleaningSession(true);
        console.log('ログアウト後のクリーンアップを実行');
        
        try {
          // PWA環境の場合は強力なクリーンアップを実行
          if (isPWA()) {
            await cleanupPWASession();
          } else {
            // 通常環境でも基本的なクリーンアップを実行
            // ServiceWorkerの登録解除
            if ('serviceWorker' in navigator) {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (const registration of registrations) {
                await registration.unregister();
                console.log('[ServiceWorker] 登録解除:', registration.scope);
              }
            }
            
            // キャッシュのクリア
            if ('caches' in window) {
              const names = await caches.keys();
              for (const name of names) {
                await caches.delete(name);
                console.log('[Cache] 削除:', name);
              }
            }
          }
          
          // URLパラメータを削除
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (error) {
          console.error('クリーンアップエラー:', error);
        } finally {
          setCleaningSession(false);
        }
      }
    };
    
    performCleanup();
  }, [searchParams]);
  
  // 拡張機能の検出（デバッグ用）
  useEffect(() => {
    const detectExtensions = () => {
      const extensions = {
        adblock: window.document.documentElement.getAttribute('data-adblockkey'),
        react: (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
        redux: (window as any).__REDUX_DEVTOOLS_EXTENSION__,
      };
      console.log('[拡張機能検出]', extensions);
    };
    detectExtensions();
  }, []);
  
  // URLのエラーパラメータがあれば表示
  useEffect(() => {
    if (error) {
      setErrorMsg(`${error}${message ? `: ${message}` : ''}`);
    }
  }, [error, message]);
  
  // ハッシュフラグメントからのトークン処理（Implicit Flow対応）
  useEffect(() => {
    const currentRouter = router; // ローカル変数にキャプチャ
    
    async function processAccessToken() {
      // 既に処理中なら実行しない
      if (isProcessingHash) return;
      
      // クライアント側でのみ実行
      if (typeof window !== 'undefined') {
        // #access_token=...の形式のハッシュがあるか確認
        if (window.location.hash && window.location.hash.includes('access_token')) {
          setIsProcessingHash(true);
          setIsLoading(true);
          
          try {
            console.log('[ハッシュ検出] アクセストークンを検出:', window.location.hash.substring(0, 20) + '...');
            
            // supabaseの自動セッション設定を確実にするため強制的に少し待機
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // セッションが正しく設定されたか確認
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('[セッション取得エラー]', error);
              setErrorMsg('認証トークンの処理に失敗しました');
              setIsLoading(false);
              setIsProcessingHash(false);
              return;
            }
            
            if (data.session) {
              // セッション設定成功
              console.log('[セッション成功] ユーザー:', data.session.user.email);
              
              // ベースURLを取得
              const baseUrl = getBaseUrl();
              const dashboardUrl = `${baseUrl}/dashboard`;
              console.log('[リダイレクト] 宛先:', dashboardUrl);
              
              // URLのハッシュ部分をクリア
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // 現在のURLがbaseUrlと同じオリジンかチェック
              const isLocalRedirect = window.location.origin === baseUrl || 
                                     (baseUrl.includes('localhost') && window.location.host.includes('localhost'));
              
              setShouldRedirect(true);
              // window.location.replaceを使用して確実にリダイレクト
              window.location.replace(dashboardUrl);
            } else {
              console.log('[セッション失敗] 見つかりませんでした');
              
              // 2回目の試行 - トークンからセッションを手動で設定
              try {
                // ハッシュからアクセストークンを抽出
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                const accessToken = params.get('access_token');
                
                if (accessToken) {
                  console.log('[再試行] トークンからセッションを設定');
                  
                  // セッションを手動で設定
                  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: ''
                  });
                  
                  if (sessionError) {
                    console.error('[セッション設定エラー]', sessionError);
                    setErrorMsg('セッション設定に失敗しました');
                  } else if (sessionData.session) {
                    console.log('[セッション再設定成功]');
                    
                    // URLのハッシュ部分をクリア
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    setShouldRedirect(true);
                    // window.location.replaceを使用して確実にリダイレクト
                    const baseUrl = getBaseUrl();
                    window.location.replace(`${baseUrl}/dashboard`);
                    return;
                  }
                }
                
                setErrorMsg('セッションの設定に失敗しました');
              } catch (err) {
                console.error('[セッション手動設定エラー]', err);
                setErrorMsg('認証処理中にエラーが発生しました');
              }
            }
          } catch (err) {
            console.error('[全体エラー]', err);
            setErrorMsg('認証処理中にエラーが発生しました');
          } finally {
            setIsLoading(false);
            setIsProcessingHash(false);
          }
        }
      }
    }
    
    processAccessToken();
  }, [isProcessingHash]); // routerを依存配列から削除
  
  // ログイン済みならリダイレクト
  useEffect(() => {
    // ログアウト直後のチェックを追加
    const urlParams = new URLSearchParams(window.location.search);
    const isFromLogout = urlParams.get('from') === 'logout';
    
    if (isFromLogout) {
      console.log('[ログアウト後のアクセス検出]');
      // URLパラメータをクリア
      window.history.replaceState({}, '', '/login');
      // ログアウト直後は2秒間セッションチェックをスキップ
      const skipDelay = setTimeout(() => {
        console.log('[ログアウト後のスキップ期間終了]');
      }, 2000);
      return () => clearTimeout(skipDelay);
    }
    
    // リダイレクト中またはハッシュ処理中はスキップ
    if (shouldRedirect || isProcessingHash) return;
    
    const currentRouter = router; // ローカル変数にキャプチャ
    let mounted = true;

    const checkSession = async () => {
      // マウントされていない場合はスキップ
      if (!mounted) return;
      
      console.log('[セッションチェック開始]', {
        url: window.location.href,
        shouldRedirect,
        isProcessingHash,
        mounted
      });
      
      try {
        // セッションをリフレッシュして最新の状態を取得
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.log('[セッションリフレッシュエラー]', refreshError);
          // エラーの場合はセッションなしとして扱う
          return;
        }
        
        const { data } = await supabase.auth.getSession();
        
        // コンポーネントがアンマウントされていたら処理を中断
        if (!mounted) return;
        
        // セッションが存在し、かつ有効期限内であればリダイレクト
        if (data.session && data.session.expires_at) {
          const expiresAt = new Date(data.session.expires_at * 1000);
          const now = new Date();
          
          if (expiresAt <= now) {
            console.log('[セッション期限切れ]', {
              expiresAt: expiresAt.toISOString(),
              now: now.toISOString()
            });
            // セッションが期限切れの場合はクリア
            await supabase.auth.signOut();
            return;
          }
          
          console.log('[チェック] 既存セッション検出:', data.session.user.email);
          
          // 即座にリダイレクト状態に設定
          setShouldRedirect(true);
          
          // ベースURLを取得
          const baseUrl = getBaseUrl();
          const dashboardUrl = `${baseUrl}/dashboard`;
          
          console.log('[リダイレクト実行]', {
            baseUrl,
            dashboardUrl,
            currentUrl: window.location.href,
            origin: window.location.origin
          });
          
          // 複数の方法でリダイレクトを試行
          const performRedirect = () => {
            try {
              // Method 1: location.replace
              window.location.replace(dashboardUrl);
            } catch (e) {
              console.error('[リダイレクトエラー] location.replace失敗:', e);
              try {
                // Method 2: location.href
                window.location.href = dashboardUrl;
              } catch (e2) {
                console.error('[リダイレクトエラー] location.href失敗:', e2);
                // Method 3: meta refresh
                const meta = document.createElement('meta');
                meta.httpEquiv = 'refresh';
                meta.content = `0;url=${dashboardUrl}`;
                document.head.appendChild(meta);
              }
            }
          };
          
          // 遅延実行で拡張機能の干渉を回避
          setTimeout(performRedirect, 100);
        }
      } catch (err) {
        console.error('[セッションチェックエラー]', err);
      }
    };
    
    // 即座にセッションチェックを実行
    checkSession();
    
    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // メール/パスワード認証でサインイン
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        // 成功時はリダイレクト
        const baseUrl = getBaseUrl();
        window.location.href = `${baseUrl}/dashboard`;
      } else {
        setErrorMsg(result.error || 'ログインに失敗しました');
      }
    } catch (err) {
      console.error('メールログインエラー:', err);
      setErrorMsg('メールログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // Google認証でサインイン
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      // サーバーアクションを呼び出し
      const result = await signInWithGoogle();
      
      // リダイレクトURLが返された場合はクライアント側でリダイレクト
      if (result.success && result.redirectUrl) {
        console.log('[認証開始] リダイレクト:', result.redirectUrl.substring(0, 50) + '...');
        window.location.href = result.redirectUrl;
        return; // リダイレクト後は処理終了
      }
      
      // エラーの場合
      if (!result.success && result.error) {
        setErrorMsg(result.error);
      } else {
        setErrorMsg('認証処理に失敗しました');
      }
    } catch (err) {
      console.error('Googleログインエラー:', err);
      setErrorMsg('Googleログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  // リダイレクト中の場合は、リダイレクト画面を表示
  if (shouldRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ダッシュボードへ移動中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">MUED LMS</h2>
          <p className="mt-2 text-sm text-gray-600">音楽制作のための学習管理システム</p>
        </div>
        
        {errorMsg && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {errorMsg}
          </div>
        )}
        
        <div className="mt-8 space-y-6">
          {!showEmailForm ? (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                  </g>
                </svg>
                {isLoading ? 'ログイン中...' : 'Googleでログイン'}
              </button>

              {/* 開発環境でのみメール認証を表示 */}
              {process.env.NODE_ENV === 'development' && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">または</span>
                  </div>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  メールアドレスでログイン（開発用）
                </button>
              )}
            </>
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="test@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  パスワード
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="パスワード"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </button>

              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                戻る
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// メインコンポーネント
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">ロード中...</div>}>
      <LoginContent />
    </Suspense>
  );
} 