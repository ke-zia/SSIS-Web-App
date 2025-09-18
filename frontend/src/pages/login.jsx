import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const Login = ({ onLogin }) => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin) onLogin();
    navigate("/college"); // redirect to dashboard page
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
