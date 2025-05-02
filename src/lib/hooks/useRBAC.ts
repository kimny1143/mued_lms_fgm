import { useSession } from 'next-auth/react';
import { UserRole } from '../types';

type RoleCheck = UserRole | UserRole[];

/**
 * 現在のユーザーが特定のロールを持っているかチェックするカスタムフック
 * @param requiredRoles チェックするロール（単一または配列）
 * @returns ユーザーが必要なロールを持っているかどうか
 */
export function useHasRole(requiredRoles: RoleCheck): boolean {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  
  if (!userRole) return false;
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }
  
  return userRole === requiredRoles;
}

/**
 * 現在のユーザーが管理者かどうかをチェックするカスタムフック
 * @returns ユーザーが管理者かどうか
 */
export function useIsAdmin(): boolean {
  return useHasRole(UserRole.ADMIN);
}

/**
 * 現在のユーザーがメンターかどうかをチェックするカスタムフック
 * @returns ユーザーがメンターかどうか
 */
export function useIsMentor(): boolean {
  return useHasRole([UserRole.MENTOR, UserRole.ADMIN]);
}

/**
 * 現在のユーザーがログインしているかどうかをチェックするカスタムフック
 * @returns セッション情報と認証状態
 */
export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    session,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    user: session?.user,
  };
} 