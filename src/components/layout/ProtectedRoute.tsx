import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // 토큰 복원 중 — 깜빡임 방지

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};
