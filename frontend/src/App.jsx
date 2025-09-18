import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import College from "./pages/college";
import Program from "./pages/program";
import Students from "./pages/students";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);

  return (
    <Router>
      <Routes>
        {/* Login route */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        {/* Protected dashboard routes */}
        {isLoggedIn ? (
          <Route path="/" element={<Dashboard />}>
            {/* Nested routes rendered inside Dashboard's Outlet */}
            <Route index element={<Navigate to="college" />} />
            <Route path="college" element={<College />} />
            <Route path="program" element={<Program />} />
            <Route path="students" element={<Students />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
