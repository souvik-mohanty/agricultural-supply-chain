import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { LoadingState } from '../components/ui/PageState';

// Protects a route. Without `roles` any logged-in user may enter; with `roles` only those roles may.
// The backend enforces the same rules: this only decides what the browser shows.
const PrivateRoute = ({ children, roles }) => {
  const { status, role } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingState label="Checking your session…" fullPage />;
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

export default PrivateRoute;
