import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { FaUserGraduate, FaChalkboardTeacher, FaExclamationTriangle, FaChartLine } from 'react-icons/fa';
import axios from 'axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/admin/stats');
                setStats(res.data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchStats();
    }, []);

    if (!stats) return <div className="p-5">Loading Admin Dashboard...</div>;

    return (
        <div className="fade-in">
            <h2 className="mb-4 fw-bold">System Administration</h2>
            <Row className="g-4 mb-4">
                <Col md={3}>
                    <Card className="shadow-sm border-0 text-white bg-primary">
                        <Card.Body className="text-center">
                            <FaUserGraduate size={32} className="mb-2 opacity-75"/>
                            <h3 className="fw-bold">{stats.totalStudents}</h3>
                            <div className="small">Total Students</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 text-white bg-success">
                        <Card.Body className="text-center">
                            <FaChalkboardTeacher size={32} className="mb-2 opacity-75"/>
                            <h3 className="fw-bold">{stats.totalMentors}</h3>
                            <div className="small">Total Mentors</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 text-white bg-danger">
                        <Card.Body className="text-center">
                            <FaExclamationTriangle size={32} className="mb-2 opacity-75"/>
                            <h3 className="fw-bold">{stats.highRiskCount}</h3>
                            <div className="small">High Risk Students</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 text-white bg-warning">
                        <Card.Body className="text-center">
                            <FaChartLine size={32} className="mb-2 opacity-75"/>
                            <h3 className="fw-bold">{stats.activeAlerts}</h3>
                            <div className="small">Active Alerts</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            <div className="alert alert-info border-0 shadow-sm">
                <h5 className="alert-heading fw-bold">Administrative Control</h5>
                <p>
                    Use the sidebar to manage Students and Mentors. You have full access to add, remove, and modify records. 
                    Ensure all data privacy regulations are followed when handling student information.
                </p>
                <hr />
                <p className="mb-0 small">System Status: Operational | v1.2.0</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
