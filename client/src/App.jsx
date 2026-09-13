import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

// Lazy-loaded Page Components for Optimized Code-Splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const RiskAnalysis = lazy(() => import('./pages/RiskAnalysis'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Settings = lazy(() => import('./pages/Settings'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Login = lazy(() => import('./pages/Login'));
const Messages = lazy(() => import('./pages/Messages'));
const AssessmentInbox = lazy(() => import('./pages/AssessmentInbox'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents'));
const AdminMentors = lazy(() => import('./pages/admin/AdminMentors'));

// Lightweight Suspense Loader Component
const PageLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500 animate-pulse">Loading module...</p>
    </div>
);

// Set global base URL for Axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/';

console.log(`API Base URL: ${axios.defaults.baseURL}`);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');
    if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const handleLogin = (data) => {
      setIsAuthenticated(true);
      setUser(data.user);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setUser(null);
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
  };

  if (!isAuthenticated) {
      return (
          <Router>
              <Suspense fallback={<PageLoader />}>
                  <Routes>
                      <Route path="*" element={<Login onLogin={handleLogin} />} />
                  </Routes>
              </Suspense>
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
      <div className="flex overflow-x-hidden relative">
        <Sidebar 
            mobileOpen={showMobileSidebar} 
            setMobileOpen={setShowMobileSidebar} 
            onLogout={handleLogout} 
            user={user} 
        />
        
        {/* Main Content Area */}
        <div 
            className="flex-1 min-w-0 min-h-screen bg-gray-50 transition-all duration-300 md:ml-[260px]" 
        >
          <div className="p-4 md:p-6 lg:p-8">
            <TopBar user={user} onToggleSidebar={() => setShowMobileSidebar(!showMobileSidebar)} />
            <main>
              <Suspense fallback={<PageLoader />}>
                {getRoutes()}
              </Suspense>
            </main>
          </div>
        </div>
        
        {/* Mobile Overlay */}
        {showMobileSidebar && (
            <div 
                className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                onClick={() => setShowMobileSidebar(false)}
            />
        )}
      </div>
    </Router>
  );
}

export default App;

