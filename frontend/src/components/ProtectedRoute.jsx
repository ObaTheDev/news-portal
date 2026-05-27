import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    // Redirect to home if admin permission is required but they aren't admin
    return <Navigate to="/" replace />;
  }

  return children;
}
