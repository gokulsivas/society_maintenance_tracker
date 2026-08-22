import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Route wrapper that allows access only to unauthenticated/guest users.
 * If the user is authenticated, they are immediately redirected to their dashboard.
 */
export default function GuestOnlyRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f3]">
        <LoadingSpinner message="Checking authentication..." size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    const destination = isAdmin ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children || <Outlet />;
}
