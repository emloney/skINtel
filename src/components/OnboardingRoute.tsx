import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

export default function OnboardingRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, profileCompleted } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (profileCompleted) {
    return <Navigate to="/landing" replace />;
  }

  return <>{children}</>;
}
