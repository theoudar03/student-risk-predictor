import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUserGraduate, FaChartPie, FaExclamationTriangle, FaCog, FaClipboardList, FaSignOutAlt } from 'react-icons/fa';

const Sidebar = ({ onLogout, user }) => {
  const location = useLocation();

  const isActive = (path) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
  };

  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 bg-white sidebar" style={{ width: '260px', height: '100vh', position: 'sticky', top: 0 }}>
      <Link to="/" className="d-flex align-items-center mb-4 mb-md-0 me-md-auto link-dark text-decoration-none px-2">
        <span className="fs-4 fw-bold" style={{color: '#4361EE'}}>Edu<span style={{color: '#F72585'}}>Risk</span>AI</span>
      </Link>
      <hr />
      <Nav className="flex-column mb-auto">
        <Nav.Item>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <FaHome className="me-3" /> Dashboard
          </Link>
        </Nav.Item>
        <Nav.Item>
          <Link to="/students" className={`nav-link ${isActive('/students') ? 'active' : ''}`}>
            <FaUserGraduate className="me-3" /> Students
          </Link>
        </Nav.Item>
        <Nav.Item>
          <Link to="/attendance" className={`nav-link ${isActive('/attendance') ? 'active' : ''}`}>
            <FaClipboardList className="me-3" /> Attendance
          </Link>
        </Nav.Item>
        <Nav.Item>
          <Link to="/risk" className={`nav-link ${isActive('/risk') ? 'active' : ''}`}>
            <FaChartPie className="me-3" /> Risk Analysis
          </Link>
        </Nav.Item>
        <Nav.Item>
          <Link to="/alerts" className={`nav-link ${isActive('/alerts') ? 'active' : ''}`}>
            <FaExclamationTriangle className="me-3" /> Alerts
          </Link>
        </Nav.Item>
        <Nav.Item className="mt-4">
             <div className="text-muted small fw-bold px-3 mb-2 text-uppercase">System</div>
        </Nav.Item>
        <Nav.Item>
            <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`}>
                <FaCog className="me-3" /> Settings
            </Link>
        </Nav.Item>
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
