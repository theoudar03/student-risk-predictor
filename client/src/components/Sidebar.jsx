import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUserGraduate, FaChartPie, FaExclamationTriangle, FaCog, FaClipboardList, FaSignOutAlt, FaEnvelope, FaChalkboardTeacher } from 'react-icons/fa';

const Sidebar = ({ onLogout, user }) => {
  const location = useLocation();

  const isActive = (path) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
  };

  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 bg-white sidebar" style={{ width: '260px', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1000, overflowY: 'auto' }}>
      <Link to="/" className="d-flex align-items-center mb-4 mb-md-0 me-md-auto link-dark text-decoration-none px-2">
        <span className="fs-4 fw-bold" style={{color: '#4361EE'}}>Edu<span style={{color: '#F72585'}}>Risk</span>AI</span>
      </Link>
      <hr />
      <Nav className="flex-column mb-auto">
        {user?.role === 'admin' && (
            <>
                <Nav.Item>
                  <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>
                    <FaHome className="me-3" /> Dashboard
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/admin/students" className={`nav-link ${isActive('/admin/students') ? 'active' : ''}`}>
                    <FaUserGraduate className="me-3" /> Students
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/admin/mentors" className={`nav-link ${isActive('/admin/mentors') ? 'active' : ''}`}>
                    <FaChalkboardTeacher className="me-3" /> Mentors
                  </Link>
                </Nav.Item>
            </>
        )}

        {user?.role === 'mentor' && (
            <>
                <Nav.Item>
                  <Link to="/mentor/dashboard" className={`nav-link ${isActive('/mentor/dashboard') ? 'active' : ''}`}>
                    <FaHome className="me-3" /> Dashboard
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/mentor/students" className={`nav-link ${isActive('/mentor/students') ? 'active' : ''}`}>
                    <FaUserGraduate className="me-3" /> Students
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/mentor/attendance" className={`nav-link ${isActive('/mentor/attendance') ? 'active' : ''}`}>
                    <FaClipboardList className="me-3" /> Attendance
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/mentor/messages" className={`nav-link ${isActive('/mentor/messages') ? 'active' : ''}`}>
                    <FaEnvelope className="me-3" /> Messages
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/mentor/assessments" className={`nav-link ${isActive('/mentor/assessments') ? 'active' : ''}`}>
                    <FaClipboardList className="me-3" /> Assessment Inbox
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/mentor/risk" className={`nav-link ${isActive('/mentor/risk') ? 'active' : ''}`}>
                    <FaChartPie className="me-3" /> Risk Analysis
                  </Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/mentor/alerts" className={`nav-link ${isActive('/mentor/alerts') ? 'active' : ''}`}>
                    <FaExclamationTriangle className="me-3" /> Alerts
                  </Link>
                </Nav.Item>
                 <Nav.Item className="mt-4">
                     <div className="text-muted small fw-bold px-3 mb-2 text-uppercase">System</div>
                </Nav.Item>
                <Nav.Item>
                    <Link to="/mentor/settings" className={`nav-link ${isActive('/mentor/settings') ? 'active' : ''}`}>
                        <FaCog className="me-3" /> Settings
                    </Link>
                </Nav.Item>
            </>
        )}

        {user?.role === 'student' && (
            <Nav.Item>
                <Link to="/student/dashboard" className={`nav-link ${isActive('/student/dashboard') ? 'active' : ''}`}>
                    <FaUserGraduate className="me-3" /> My Dashboard
                </Link>
            </Nav.Item>
        )}

        {user?.role === 'parent' && (
            <Nav.Item>
                <Link to="/parent/dashboard" className={`nav-link ${isActive('/parent/dashboard') ? 'active' : ''}`}>
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
  );
};

export default Sidebar;
