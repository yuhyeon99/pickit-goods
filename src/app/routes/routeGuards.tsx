import type { PropsWithChildren } from 'react';
import { AdminAccessDeniedPage, LoginRequiredPage } from '../../pages/auth';
import { useAuth } from '../../shared/model/auth/useAuth';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <section className="state-card">로그인 상태를 확인하는 중입니다.</section>;
  }

  if (!isAuthenticated) {
    return <LoginRequiredPage />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: PropsWithChildren) {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <section className="state-card">관리자 권한을 확인하는 중입니다.</section>;
  }

  if (!isAuthenticated) {
    return (
      <LoginRequiredPage
        title="관리자 로그인이 필요합니다"
        description="관리자 페이지는 로그인 후 권한 확인이 필요합니다."
      />
    );
  }

  if (!isAdmin) {
    return <AdminAccessDeniedPage />;
  }

  return <>{children}</>;
}
