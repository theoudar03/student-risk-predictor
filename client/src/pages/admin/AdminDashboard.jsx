import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, ProgressBar } from 'react-bootstrap';
import { FaUserGraduate, FaChalkboardTeacher, FaExclamationTriangle, FaChartLine } from 'react-icons/fa';
import axios from 'axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [recalcResult, setRecalcResult] = useState(null);

    const handleRecalculate = async () => {
        if(!window.confirm("Recalculate risk for ALL students? This operation updates the entire database.")) return;
        
        setIsCalculating(true);
        setRecalcResult(null);
        setProgress(0);

        // Simulate progress while waiting
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + 5, 90));
        }, 300);

        try {
            const res = await axios.post('/api/admin/risk-recalc');
            clearInterval(interval);
            setProgress(100);
            setRecalcResult({ success: true, message: res.data.message });
            
            // Refresh after brief delay
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch(e) {
            clearInterval(interval);
            setProgress(0);
            setIsCalculating(false);
            setRecalcResult({ 
                success: false, 
                message: "Recalculation failed: " + (e.response?.data?.error || e.message) 
            });
        }
    };

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
                <div className="mb-3">
                    {!isCalculating ? (
                        <Button 
                           variant="danger" 
                           size="sm"
                           onClick={handleRecalculate}
                           disabled={isCalculating}
                       >
                           ⚡ Recalculate Risk Scores
                       </Button>
                    ) : (
                        <div className="mt-3">
                            <div className="d-flex justify-content-between mb-1">
                                <span className="small fw-bold text-primary">Recalculating AI Models...</span>
                                <span className="small fw-bold">{progress}%</span>
                            </div>
                            <ProgressBar animated now={progress} variant="danger" className="mb-2" style={{height: '10px'}} />
                            <p className="small text-muted mb-0">Processing student behavioral data and updating risk profiles...</p>
                        </div>
                    )}
                    
                    {recalcResult && (
                        <div className={`mt-3 alert alert-${recalcResult.success ? 'success' : 'danger'} py-2 small`}>
                            <strong>{recalcResult.success ? 'Success!' : 'Error:'}</strong> {recalcResult.message}
                            {recalcResult.success && <div className="mt-1">Page will refresh in 3 seconds...</div>}
                        </div>
                    )}
                </div>
                <hr />
                <p className="mb-0 small">System Status: Operational | 2026</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
