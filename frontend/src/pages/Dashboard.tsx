// Updated Dashboard.tsx with logout loading state
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { 
  LogOut, 
  Building2, 
  GraduationCap, 
  Users,
  Loader2,
  User
} from "lucide-react";
import "../styles/dashboard.css";
import { apiGet } from "../services/api";
import { Card, CardContent } from "../components/ui/card";

interface User {
  id: string;
  email: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const userData = await apiGet<User>("/auth/me");
        setUser(userData);
        localStorage.setItem("userEmail", userData.email);
        localStorage.setItem("user", JSON.stringify(userData));
        setError(null);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setError("Failed to load user data. Please login again.");
        
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userEmail");
        
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    // Simulate a small delay for logout process (like API call)
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userEmail");
      navigate("/login", { replace: true });
      setIsLoggingOut(false);
    }, 500); // Small delay to show loading state
  };

  const getInitials = (email: string) => {
    if (!email) return "U";
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="sidebar" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Card className="bg-red-50/50 border-red-100">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-red-600 animate-spin mb-4" />
                <div className="text-gray-700 text-sm">Loading user data...</div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="main-content">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-red-600 animate-spin mr-3" />
            <div className="text-gray-600">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="sidebar" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-red-600 mb-2 font-medium">Authentication Error</div>
                <div className="text-sm text-gray-600">Redirecting to login...</div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="main-content">
          <div className="flex items-center justify-center h-full">
            <Card className="border-red-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-red-600 mb-2 font-medium">Error</div>
                  <div className="text-gray-600">{error}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>SSIS</h2>
        
        {/* User Profile Section */}
        <div className="user-profile">
          <div className="user-avatar">
            {user ? getInitials(user.email) : <User className="h-5 w-5" />}
          </div>
          <div className="user-info">
            <h3>{user?.email || "Not logged in"}</h3>
          </div>
        </div>

        {/* Menu Container */}
        <div className="menu-container">
          <NavLink 
            to="/dashboard/colleges" 
            className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
          >
            <Building2 className="menu-icon" />
            <span>College</span>
          </NavLink>
          
          <NavLink 
            to="/dashboard/programs" 
            className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
          >
            <GraduationCap className="menu-icon" />
            <span>Program</span>
          </NavLink>
          
          <NavLink 
            to="/dashboard/students" 
            className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
          >
            <Users className="menu-icon" />
            <span>Students</span>
          </NavLink>
        </div>
        
        {/* Logout Button */}
        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="logout-button"
            title="Logout"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;