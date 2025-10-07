import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Check if user has a valid JWT token
  const token = localStorage.getItem("token");
  
  if (!token) {
    // Clear any stale user data and redirect to login
    localStorage.removeItem("user");
    localStorage.removeItem("userEmail");
    return <Navigate to="/login" replace />;
  }

  // Optional: You could add token validation/expiration check here
  // For now, just check if token exists

  return <>{children}</>;
};

export default ProtectedRoute;