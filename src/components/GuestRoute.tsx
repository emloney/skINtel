import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

export default function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, profileCompleted } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to={profileCompleted ? '/landing' : '/onboarding'} replace />;
  }

  return <>{children}</>;
}
