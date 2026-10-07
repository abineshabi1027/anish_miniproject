import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If unauthorized for role, route to their proper default
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'STAFF') return <Navigate to="/staff" replace />;
    return <Navigate to="/customer/dashboard" replace />;
  }

  return <Outlet />;
};
