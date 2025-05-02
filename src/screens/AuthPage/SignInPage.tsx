import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useNavigate } from 'react-router-dom';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // NextAuthでGoogleサインイン
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false
      });
      
      if (result?.error) {
        setError(result.error);
      } else if (result?.url) {
        // Next.jsではredirect: trueにして自動リダイレクトが基本だが
        // Viteプロジェクトでは手動リダイレクトが必要
        window.location.href = result.url;
      }
    } catch (err) {
      setError('サインイン中にエラーが発生しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          アカウントにサインイン
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
              {error}
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold leading-6 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <svg className="h-5 w-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              {isLoading ? 'ロード中...' : 'Googleでサインイン'}
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          アカウントをお持ちでないですか？{' '}
          <button
            onClick={() => navigate('/auth/signup')}
            className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
          >
            新規登録はこちら
          </button>
        </p>
      </div>
    </div>
  );
} 