import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

interface LoginProps {
  onLogin?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onLogin) onLogin();
    navigate("/dashboard/colleges"); // redirect to colleges page
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Simple Student Information System</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <button type="submit" className="login-btn">Login</button>
        </form>
        <div className="links">
          <a href="#">Forgot Password?</a>
          <a href="#">Sign Up</a>
        </div>
      </div>
    </div>
  );
};

export default Login;

