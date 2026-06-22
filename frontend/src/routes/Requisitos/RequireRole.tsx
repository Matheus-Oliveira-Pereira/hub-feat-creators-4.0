import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

function RequireRole({ role, children }: { role: string; children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.roles?.includes(role)) return <Navigate to="/acesso-negado" replace />;
  return <>{children}</>;
}

export default RequireRole;
