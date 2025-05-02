import { useNavigate } from 'react-router-dom';
import { useSession } from 'next-auth/react';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              アクセス権限がありません
            </h2>
            <p className="mt-4 text-center text-md text-gray-600">
              このページにアクセスするための権限がありません。
            </p>
            
            {session?.user && (
              <p className="mt-2 text-sm text-gray-500">
                現在 {session.user.email} として{' '}
                {session.user.role ? `(${session.user.role})` : ''} ログインしています。
              </p>
            )}
            
            <div className="mt-6 flex flex-col space-y-4">
              <button
                onClick={() => navigate('/')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ホームに戻る
              </button>
              
              <button
                onClick={() => navigate(-1)}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                前のページに戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 