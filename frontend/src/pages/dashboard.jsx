import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../styles/dashboard.css";

const Dashboard = () => {
  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>SSIS</h2>
        <NavLink to="/college" className="menu-link">College</NavLink>
        <NavLink to="/program" className="menu-link">Program</NavLink>
        <NavLink to="/students" className="menu-link">Students</NavLink>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Outlet renders the current route page */}
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
