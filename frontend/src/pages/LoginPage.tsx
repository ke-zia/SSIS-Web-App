import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { apiPost } from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LoginProps {
  onLogin?: () => void;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiPost<LoginResponse>("/auth/login", { email, password });
      
      // Debug log
      console.log("Login response:", response);
      
      // Validate response structure
      if (!response.token || !response.user || !response.user.id || !response.user.email) {
        console.error("Invalid response structure:", response);
        throw new Error("Failed to load user data. Please login again.");
      }
      
      // Store token and user data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("userEmail", response.user.email);
      
      if (onLogin) onLogin();
      navigate("/dashboard/colleges");
    } catch (err: unknown) {
      console.error("Login error:", err);
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="brand-section">
            <div className="logo-circle">
              <span className="logo-text">SSIS</span>
            </div>
            <div className="brand-content">
              <h1 className="brand-title">Simple Student Information System</h1>
              <p className="brand-description">
                A web application that allows users to easily manage academic data by adding and organizing colleges, programs, and student records in one place.
              </p>
            </div>
          </div>
          
          <div className="quote-section">
            <p className="quote-text">
              "Simplifying education management through innovative technology solutions."
            </p>
          </div>
        </div>
        
        <div className="login-right">
          <Card className="login-card">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-800">Login</CardTitle>
              <CardDescription className="text-gray-500">
                Enter your credentials to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-gray-300 focus:border-red-600 focus:ring-red-600"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-gray-300 focus:border-red-600 focus:ring-red-600"
                    />
                  </div>
                </div>
                
                {error && (
                  <Alert variant="destructive" className="mt-4 border-red-200 bg-red-50 text-red-700">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "LOGIN"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
};

export default Login;