import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaExclamationTriangle, FaCheckCircle, FaBars } from 'react-icons/fa';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TopBar = ({ user, onToggleSidebar }) => {
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [attendanceReminder, setAttendanceReminder] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchAlerts();
        checkAttendance();
        const interval = setInterval(() => {
            fetchAlerts();
            checkAttendance();
        }, 30000);

        window.addEventListener('attendanceUpdated', checkAttendance);

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            clearInterval(interval);
            window.removeEventListener('attendanceUpdated', checkAttendance);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const checkAttendance = async () => {
        if (user?.role !== 'mentor') return;
        try {
            const res = await axios.get('/api/attendance/status/today');
            setAttendanceReminder(res.data.showReminder);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAlerts = async () => {
        try {
            const res = await axios.get('/api/alerts');
            if (Array.isArray(res.data)) {
                setAlerts(res.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const count = alerts.length + (attendanceReminder ? 1 : 0);
        setUnreadCount(count);
    }, [alerts, attendanceReminder]);

    return (
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 w-full gap-4">
            <div className="flex items-center min-w-0">
                {/* Mobile Menu Button */}
                <button 
                    className="md:hidden mr-4 p-2 text-gray-800 focus:outline-none" 
                    onClick={onToggleSidebar}
                >
                    <FaBars size={24} />
                </button>

                <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-lg md:text-xl text-gray-800 m-0 truncate">Welcome, {user?.name || 'Mentor'}</h4>
                    <p className="text-xs md:text-sm text-gray-500 m-0 truncate">{user?.department || 'Department'} Dashboard</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {(user?.role === 'mentor' || user?.role === 'admin') && (
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
                        >
                            <FaBell size={22} className="text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-600 border-2 border-white rounded-full translate-x-1/4 -translate-y-1/4">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-72 md:w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden max-h-[400px] flex flex-col">
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <h6 className="font-bold text-gray-800 m-0 text-sm">Notifications</h6>
                                    <p className="text-xs text-gray-500 m-0">{unreadCount} Notifications</p>
                                </div>
                                
                                <div className="overflow-y-auto flex-1">
                                    {attendanceReminder && (
                                        <Link 
                                            to="/mentor/attendance" 
                                            className="block p-4 border-b border-red-100 bg-red-50 hover:bg-red-100 transition-colors"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 text-yellow-500">
                                                    <FaExclamationTriangle size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800 m-0">Action Required: Attendance</p>
                                                    <p className="text-xs text-gray-600 mt-1 mb-2 leading-tight">You haven't marked attendance for today yet.</p>
                                                    <span className="text-blue-600 font-bold text-xs">Mark Now</span>
                                                </div>
                                            </div>
                                        </Link>
                                    )}

                                    {alerts.length === 0 && !attendanceReminder ? (
                                        <div className="p-6 text-center text-gray-500">
                                            <FaCheckCircle className="mx-auto mb-2 text-green-500" size={24} />
                                            <p className="text-sm m-0">No active risk alerts.</p>
                                        </div>
                                    ) : (
                                        alerts.map(alert => (
                                            <Link 
                                                key={alert._id} 
                                                to={`/mentor/students/${alert.studentId || ''}`} 
                                                className="block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 text-red-500">
                                                        <FaExclamationTriangle size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-800 m-0">{alert.studentName}</p>
                                                        <p className="text-xs text-gray-600 mt-1 mb-1 leading-tight">{alert.message}</p>
                                                        <span className="text-gray-400 text-[10px]">
                                                            {new Date(alert.lastUpdatedAt || alert.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                                <div className="p-3 text-center bg-gray-50 border-t border-gray-100">
                                    <Link 
                                        to="/mentor/alerts" 
                                        className="text-sm font-bold text-blue-600 hover:text-blue-800"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        View All Alerts
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="hidden md:block text-right">
                    <div className="font-bold text-sm text-gray-800">{user?.name}</div>
                    <div className="text-gray-500 text-[10px] uppercase tracking-wider">{user?.role}</div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
