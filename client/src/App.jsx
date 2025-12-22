import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check Local Storage for session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData) => {
      setIsAuthenticated(true);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('user');
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

  return (
    <Router>
      <div className="d-flex" style={{ overflowX: 'hidden' }}>
        <Sidebar onLogout={handleLogout} user={user} />
        <div className="flex-grow-1 p-4" style={{ minHeight: '100vh', marginLeft: '0', background: '#f0f2f5' }}>
          <TopBar user={user} />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/risk" element={<RiskAnalysis />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
