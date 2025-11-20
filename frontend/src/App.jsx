import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import ChatBot from "./components/ChatBot.jsx";
import AdjunctApplicationPage from "./pages/AdjunctApplicationPage.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import CourseDashboard from "./pages/CourseDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - only login page */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes - everything requires authentication */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <LandingPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chatbot" 
          element={
            <ProtectedRoute>
              <ChatBot />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/apply" 
          element={
            <ProtectedRoute>
              <AdjunctApplicationPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses" 
          element={
            <ProtectedRoute>
              <CourseDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch-all -> home (which will redirect to login if not authed) */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
