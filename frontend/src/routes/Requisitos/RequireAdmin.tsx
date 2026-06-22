import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.roles?.includes('ADMIN') && !user?.roles?.includes('ROLE_ADMIN')) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default RequireAdmin;
