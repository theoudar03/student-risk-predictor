import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import RiskAnalysis from './pages/RiskAnalysis';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Attendance from './pages/Attendance';
import Login from './pages/Login';
import Messages from './pages/Messages';
import AssessmentInbox from './pages/AssessmentInbox';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminMentors from './pages/admin/AdminMentors';

// Set global base URL for Axios
// Use environment variable for production, fallback to localhost for dev
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Check Local Storage for session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const handleLogin = (data) => {
      setIsAuthenticated(true);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
  };

  if (!isAuthenticated) {
      return (
          <Router>
              <Routes>
                  <Route path="*" element={<Login onLogin={handleLogin} />} />
              </Routes>
          </Router>
      );
  }

  const getRoutes = () => {
      switch(user?.role) {
          case 'admin':
              return (
                  <Routes>
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/students" element={<AdminStudents />} />
                      <Route path="/admin/mentors" element={<AdminMentors />} />
                      <Route path="*" element={<Navigate to="/admin/dashboard" />} />
                  </Routes>
              );
          case 'student':
              return (
                  <Routes>
                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                    <Route path="*" element={<Navigate to="/student/dashboard" />} />
                  </Routes>
              );
          case 'parent':
              return (
                  <Routes>
                    <Route path="/parent/dashboard" element={<ParentDashboard />} />
                     <Route path="*" element={<Navigate to="/parent/dashboard" />} />
                  </Routes>
              );
          case 'mentor':
          default:
               return (
                  <Routes>
                    <Route path="/mentor/dashboard" element={<Dashboard />} />
                    <Route path="/mentor/students" element={<Students />} />
                    <Route path="/mentor/students/:id" element={<StudentProfile />} />
                    <Route path="/mentor/messages" element={<Messages />} />
                    <Route path="/mentor/assessments" element={<AssessmentInbox />} />
                    <Route path="/mentor/risk" element={<RiskAnalysis />} />
                    <Route path="/mentor/alerts" element={<Alerts />} />
                    <Route path="/mentor/attendance" element={<Attendance />} />
                    <Route path="/mentor/settings" element={<Settings />} />
                    <Route path="/" element={<Navigate to="/mentor/dashboard" />} />
                    <Route path="*" element={<Navigate to="/mentor/dashboard" />} />
                  </Routes>
               );
      }
  };



  return (
    <Router>
      <div className="d-flex" style={{ overflowX: 'hidden' }}>
        <Sidebar 
            mobileOpen={showMobileSidebar} 
            setMobileOpen={setShowMobileSidebar} 
            onLogout={handleLogout} 
            user={user} 
        />
        
        {/* Main Content Area */}
        <div 
            className="flex-grow-1 p-3 p-md-4" 
            style={{ 
                minHeight: '100vh', 
                background: '#f0f2f5',
                marginLeft: '0', 
                transition: 'margin-left 0.3s'
            }}
        >
          {/* Responsive Margin Helper */}
          <style>{`
            @media (min-width: 768px) {
                .flex-grow-1 { margin-left: 260px !important; }
            }
          `}</style>

          <TopBar user={user} onToggleSidebar={() => setShowMobileSidebar(!showMobileSidebar)} />
          {getRoutes()}
        </div>
        
        {/* Mobile Overlay */}
        {showMobileSidebar && (
            <div 
                className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50"
                style={{ zIndex: 999 }}
                onClick={() => setShowMobileSidebar(false)}
            />
        )}
      </div>
    </Router>
  );
}

export default App;
