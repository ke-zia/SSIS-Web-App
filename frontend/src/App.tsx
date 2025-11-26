import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CollegesPage from "./pages/CollegesPage";
import ProgramsPage from "./pages/ProgramsPage";
import Login from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import StudentsPage from "./pages/StudentsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { isAuthenticated } from "./services/authService";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Prevent access to /login when already authenticated */}
        <Route
          path="/login"
          element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Protected Dashboard layout with sidebar - nested routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="colleges" replace />} />
          <Route path="colleges" element={<CollegesPage />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="students" element={<StudentsPage />} />
        </Route>

        {/* Redirect old routes to new nested structure */}
        <Route path="/colleges" element={<Navigate to="/dashboard/colleges" replace />} />
        <Route path="/programs" element={<Navigate to="/dashboard/programs" replace />} />
        <Route path="/students" element={<Navigate to="/dashboard/students" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;