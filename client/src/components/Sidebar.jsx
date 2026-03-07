import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUserGraduate, FaChartPie, FaExclamationTriangle, FaCog, FaClipboardList, FaSignOutAlt, FaEnvelope, FaChalkboardTeacher } from 'react-icons/fa';

const NavItem = ({ to, icon: Icon, children, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center px-4 py-3 mb-2 rounded-xl font-medium transition-all duration-200 ${
      active
        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30'
        : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1'
    }`}
  >
    <Icon className="mr-3 text-lg" />
    {children}
  </Link>
);

const Sidebar = ({ onLogout, user, mobileOpen, setMobileOpen }) => {
  const location = useLocation();

  const isActive = (path) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
  };

  return (
    <div
      className={`flex flex-col shrink-0 p-4 bg-white shadow-md border-r border-gray-100 w-[260px] h-screen fixed top-0 left-0 z-50 overflow-y-auto transition-transform duration-300 ease-in-out md:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between mb-8 px-2">
        <Link to="/" className="flex items-center text-gray-800 no-underline">
            <img src="/logo.jpg" alt="EduRiskAI Logo" className="max-h-[60px] w-auto object-contain" />
        </Link>
        {/* Mobile Close Button */}
        <button 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors" 
            onClick={() => setMobileOpen(false)}
        >
            <FaSignOutAlt className="rotate-180" size={20} /> 
        </button>
      </div>

      <hr className="border-gray-100 mb-4" />
      
      <div className="flex flex-col mb-auto">
        {user?.role === 'admin' && (
            <>
                <NavItem to="/admin/dashboard" icon={FaHome} active={isActive('/admin/dashboard')} onClick={() => setMobileOpen(false)}>
                    Dashboard
                </NavItem>
                <NavItem to="/admin/students" icon={FaUserGraduate} active={isActive('/admin/students')} onClick={() => setMobileOpen(false)}>
                    Students
                </NavItem>
                <NavItem to="/admin/mentors" icon={FaChalkboardTeacher} active={isActive('/admin/mentors')} onClick={() => setMobileOpen(false)}>
                    Mentors
                </NavItem>
            </>
        )}

        {user?.role === 'mentor' && (
            <>
                <NavItem to="/mentor/dashboard" icon={FaHome} active={isActive('/mentor/dashboard')} onClick={() => setMobileOpen(false)}>
                    Dashboard
                </NavItem>
                <NavItem to="/mentor/students" icon={FaUserGraduate} active={isActive('/mentor/students')} onClick={() => setMobileOpen(false)}>
                    Students
                </NavItem>
                <NavItem to="/mentor/attendance" icon={FaClipboardList} active={isActive('/mentor/attendance')} onClick={() => setMobileOpen(false)}>
                    Attendance
                </NavItem>
                <NavItem to="/mentor/messages" icon={FaEnvelope} active={isActive('/mentor/messages')} onClick={() => setMobileOpen(false)}>
                    Messages
                </NavItem>
                <NavItem to="/mentor/assessments" icon={FaClipboardList} active={isActive('/mentor/assessments')} onClick={() => setMobileOpen(false)}>
                    Assessment Inbox
                </NavItem>
                <NavItem to="/mentor/risk" icon={FaChartPie} active={isActive('/mentor/risk')} onClick={() => setMobileOpen(false)}>
                    Risk Analysis
                </NavItem>
                <NavItem to="/mentor/alerts" icon={FaExclamationTriangle} active={isActive('/mentor/alerts')} onClick={() => setMobileOpen(false)}>
                    Alerts
                </NavItem>
                
                <div className="mt-6 mb-2">
                    <div className="text-gray-400 text-xs font-bold px-4 uppercase tracking-wider">System</div>
                </div>
                
                <NavItem to="/mentor/settings" icon={FaCog} active={isActive('/mentor/settings')} onClick={() => setMobileOpen(false)}>
                    Settings
                </NavItem>
            </>
        )}

        {user?.role === 'student' && (
            <NavItem to="/student/dashboard" icon={FaUserGraduate} active={isActive('/student/dashboard')} onClick={() => setMobileOpen(false)}>
                My Dashboard
            </NavItem>
        )}

        {user?.role === 'parent' && (
            <NavItem to="/parent/dashboard" icon={FaUserGraduate} active={isActive('/parent/dashboard')} onClick={() => setMobileOpen(false)}>
                Parent View
            </NavItem>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100/50 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full text-white flex items-center justify-center mr-3 font-bold shadow-md">
                      {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="leading-tight">
                      <div className="font-bold text-sm text-gray-800 max-w-[100px] truncate">
                          {user?.name || 'User'}
                      </div>
                      <div className="text-gray-500 text-[10px] uppercase tracking-wider mt-1">{user?.role || 'Mentor'}</div>
                  </div>
              </div>
              <button 
                onClick={onLogout} 
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors focus:outline-none" 
                title="Logout"
              >
                  <FaSignOutAlt size={18} />
              </button>
          </div>
      </div>
    </div>
  );
};

export default Sidebar;
