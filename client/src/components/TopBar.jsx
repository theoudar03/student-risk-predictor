import React, { useState, useEffect } from 'react';
import { Dropdown, Badge, Button } from 'react-bootstrap';
import { FaBell, FaExclamationTriangle, FaCheckCircle, FaBars } from 'react-icons/fa';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TopBar = ({ user, onToggleSidebar }) => {
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [attendanceReminder, setAttendanceReminder] = useState(false);

    useEffect(() => {
        fetchAlerts();
        checkAttendance();
        const interval = setInterval(() => {
            fetchAlerts();
            checkAttendance();
        }, 30000);

        // Listen for instant updates from Attendance page
        window.addEventListener('attendanceUpdated', checkAttendance);

        return () => {
            clearInterval(interval);
            window.removeEventListener('attendanceUpdated', checkAttendance);
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
            // ✅ Fix: Fetch ONLY Active alerts from DB source
            const res = await axios.get('/api/students/data/alerts?status=Active');
            if (Array.isArray(res.data)) {
                // Double check status client-side just in case
                const active = res.data.filter(a => a.status === 'Active');
                console.log("Bell Alerts Rendered:", active); // 🔍 Mandatory Debug Log
                setAlerts(active);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Unified Unread Count Logic
    useEffect(() => {
        const count = alerts.length + (attendanceReminder ? 1 : 0);
        setUnreadCount(count);
    }, [alerts, attendanceReminder]);

    return (
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="d-flex align-items-center">
                {/* Mobile Menu Button */}
                <Button variant="link" className="d-md-none me-2 p-0 text-dark" onClick={onToggleSidebar}>
                    <FaBars size={24} />
                </Button>

                <div>
                    <h4 className="fw-bold mb-0 text-dark">Welcome, {user?.name || 'Mentor'}</h4>
                    <small className="text-muted">{user?.department || 'Department'} Dashboard</small>
                </div>
            </div>
            
            <div className="d-flex align-items-center gap-3">
                {user?.role === 'mentor' && (
                    <Dropdown align="end">
                        <Dropdown.Toggle as="div" className="position-relative cursor-pointer p-2 rounded-circle hover-bg-light" style={{ cursor: 'pointer', transition: '0.2s' }}>
                            <FaBell size={22} className="text-secondary" />
                            {unreadCount > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm" style={{ fontSize: '0.6rem', border: '2px solid white' }}>
                                    {unreadCount}
                                    <span className="visually-hidden">unread messages</span>
                                </span>
                            )}
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="shadow-lg border-0 p-0" style={{ width: 320, maxHeight: 400, overflowY: 'auto' }}>
                            <div className="p-3 border-bottom bg-light">
                                <h6 className="fw-bold mb-0">Notifications</h6>
                                <small className="text-muted">{unreadCount} Notifications</small>
                            </div>
                            
                            {/* Attendance Reminder */}
                            {attendanceReminder && (
                                <Dropdown.Item as={Link} to="/mentor/attendance" className="p-3 border-bottom bg-light-danger" style={{ whiteSpace: 'normal', backgroundColor: '#fff5f5' }}>
                                    <div className="d-flex align-items-start gap-2">
                                        <div className="mt-1 text-warning">
                                            <FaExclamationTriangle />
                                        </div>
                                        <div>
                                            <p className="mb-1 fw-bold small text-dark">Action Required: Attendance</p>
                                            <p className="mb-1 small text-muted lh-sm">You haven't marked attendance for today yet.</p>
                                            <small className="text-primary fw-bold" style={{ fontSize: '0.7rem' }}>Mark Now</small>
                                        </div>
                                    </div>
                                </Dropdown.Item>
                            )}

                            {alerts.length === 0 && !attendanceReminder ? (
                                <div className="p-4 text-center text-muted">
                                    <FaCheckCircle className="mb-2 text-success" size={24} />
                                    <p className="mb-0 small">No active risk alerts.</p>
                                </div>
                            ) : (
                                alerts.map(alert => (
                                    <Dropdown.Item key={alert._id} as={Link} to={`/mentor/students/${alert.studentId || ''}`} className="p-3 border-bottom" style={{ whiteSpace: 'normal' }}>
                                        <div className="d-flex align-items-start gap-2">
                                            <div className="mt-1 text-danger">
                                                <FaExclamationTriangle />
                                            </div>
                                            <div>
                                                <p className="mb-1 fw-bold small text-dark">{alert.studentName}</p>
                                                <p className="mb-1 small text-muted lh-sm">{alert.message}</p>
                                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                    {new Date(alert.date).toLocaleDateString()}
                                                </small>
                                            </div>
                                        </div>
                                    </Dropdown.Item>
                                ))
                            )}
                            <div className="p-2 text-center bg-light border-top">
                                <Link to="/mentor/alerts" className="text-decoration-none small fw-bold">View All Alerts</Link>
                            </div>
                        </Dropdown.Menu>
                    </Dropdown>
                )}
                
                <div className="d-none d-md-block text-end">
                    <div className="fw-bold small">{user?.name}</div>
                    <div className="text-muted small" style={{fontSize: 10}}>{user?.role}</div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
