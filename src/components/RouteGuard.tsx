import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from 'next-auth/react';
import { UserRole } from '../lib/types';
import { useHasRole } from '../lib/hooks/useRBAC';

interface RouteGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole | UserRole[];
  redirectTo?: string;
}

/**
 * ルートガードコンポーネント
 * 認証とロールベースのアクセス制御を提供する
 */
export default function RouteGuard({
  children,
  requiredRoles,
  redirectTo = '/auth/signin',
}: RouteGuardProps) {
  const { data: session, status } = useSession();
  const location = useLocation();
  const hasRequiredRole = requiredRoles ? useHasRole(requiredRoles) : true;
  
  // 認証状態がまだロード中の場合
  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  // 認証されていない場合、サインインページにリダイレクト（現在のパスを保存）
  if (status !== 'authenticated') {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }
  
  // 認証されているが必要なロールがない場合
  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // 認証およびロール要件を満たしている場合、コンテンツを表示
  return <>{children}</>;
} 