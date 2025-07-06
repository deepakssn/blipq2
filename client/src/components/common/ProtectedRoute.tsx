import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[]; // e.g., ['admin', 'super_admin']
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading, token } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading spinner or a blank page while auth status is being determined
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!token || !user) {
    // User not logged in, redirect to login page
    // Pass the current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // Check if the user's role is included in the allowedRoles
    if (!allowedRoles.includes(user.role)) {
      // User does not have the required role, redirect to an unauthorized page or homepage
      // For simplicity, redirecting to homepage. Could also be a specific "Access Denied" page.
      return <Navigate to="/" state={{ from: location }} replace />;
      // Or: return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated (and has the right role if specified), render the children
  return children;
};

export default ProtectedRoute;
