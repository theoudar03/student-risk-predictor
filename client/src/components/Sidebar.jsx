import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUserGraduate, FaChartPie, FaExclamationTriangle, FaCog, FaClipboardList, FaSignOutAlt, FaEnvelope, FaChalkboardTeacher } from 'react-icons/fa';

const Sidebar = ({ onLogout, user, mobileOpen, setMobileOpen }) => {
  const location = useLocation();

  const isActive = (path) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
  };

  return (
    <>
    <div 
        className="d-flex flex-column flex-shrink-0 p-3 bg-white sidebar shadow-sm" 
        style={{ 
            width: '260px', 
            height: '100vh', 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            zIndex: 1000, 
            overflowY: 'auto',
            transition: 'transform 0.3s ease-in-out',
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)', // Logic handled via CSS media query below for Desktop override
        }}
    >
      <style>{`
        @media (min-width: 768px) {
            .sidebar { transform: translateX(0) !important; }
        }
      `}</style>

      <div className="d-flex align-items-center justify-content-between mb-4 px-2">
        <Link to="/" className="d-flex align-items-center link-dark text-decoration-none">
            <img src="/logo.jpg" alt="EduRiskAI Logo" className="img-fluid" style={{ maxHeight: '60px', width: 'auto', objectFit: 'contain' }} />
        </Link>
        {/* Mobile Close Button */}
        <button className="btn btn-link link-dark d-md-none p-0" onClick={() => setMobileOpen(false)}>
            <FaSignOutAlt style={{ transform: 'rotate(180deg)' }} /> 
        </button>
      </div>

      <hr />
      <Nav className="flex-column mb-auto">
        {user?.role === 'admin' && (
            <>
                <Nav.Item>
                  <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                    <FaHome className="me-3" /> Dashboard
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/admin/students" className={`nav-link ${isActive('/admin/students') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                    <FaUserGraduate className="me-3" /> Students
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/admin/mentors" className={`nav-link ${isActive('/admin/mentors') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                    <FaChalkboardTeacher className="me-3" /> Mentors
                  </Link>
                </Nav.Item>
            </>
        )}

        {user?.role === 'mentor' && (
            <>
                <Nav.Item>
                  <Link to="/mentor/dashboard" className={`nav-link ${isActive('/mentor/dashboard') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                    <FaHome className="me-3" /> Dashboard
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/mentor/students" className={`nav-link ${isActive('/mentor/students') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                    <FaUserGraduate className="me-3" /> Students
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/mentor/attendance" className={`nav-link ${isActive('/mentor/attendance') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                    <FaClipboardList className="me-3" /> Attendance
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/mentor/messages" className={`nav-link ${isActive('/mentor/messages') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                    <FaEnvelope className="me-3" /> Messages
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/mentor/assessments" className={`nav-link ${isActive('/mentor/assessments') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                    <FaClipboardList className="me-3" /> Assessment Inbox
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/mentor/risk" className={`nav-link ${isActive('/mentor/risk') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                    <FaChartPie className="me-3" /> Risk Analysis
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/mentor/alerts" className={`nav-link ${isActive('/mentor/alerts') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                    <FaExclamationTriangle className="me-3" /> Alerts
                  </Link>
                </Nav.Item>
                 <Nav.Item className="mt-4">
                     <div className="text-muted small fw-bold px-3 mb-2 text-uppercase">System</div>
                </Nav.Item>
                <Nav.Item>
                    <Link to="/mentor/settings" className={`nav-link ${isActive('/mentor/settings') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                        <FaCog className="me-3" /> Settings
                    </Link>
                </Nav.Item>
            </>
        )}

        {user?.role === 'student' && (
            <Nav.Item>
                <Link to="/student/dashboard" className={`nav-link ${isActive('/student/dashboard') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                    <FaUserGraduate className="me-3" /> My Dashboard
                </Link>
            </Nav.Item>
        )}

        {user?.role === 'parent' && (
            <Nav.Item>
                <Link to="/parent/dashboard" className={`nav-link ${isActive('/parent/dashboard') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                    <FaUserGraduate className="me-3" /> Parent View
                </Link>
            </Nav.Item>
        )}
      </Nav>
      
      <div className="mt-auto p-3 glass-card bg-light border-0">
          <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                  <div style={{width: 32, height: 32, background: '#4361EE', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, fontSize: 14}}>
                      {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div style={{lineHeight: 1.2}}>
                      <div className="fw-bold small" style={{maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                          {user?.name || 'User'}
                      </div>
                      <div className="text-muted" style={{fontSize: 10}}>{user?.role || 'Mentor'}</div>
                  </div>
              </div>
              <button 
                onClick={onLogout} 
                className="btn btn-link text-danger p-0" 
                title="Logout"
                style={{ fontSize: 18 }}
              >
                  <FaSignOutAlt />
              </button>
          </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
