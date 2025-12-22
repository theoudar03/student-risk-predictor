import React, { useState } from 'react';
import { Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { FaSave, FaCog, FaDatabase } from 'react-icons/fa';

const Settings = () => {
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        highRiskThreshold: 70,
        mediumRiskThreshold: 35,
        attendanceWeight: 40,
        cgpaWeight: 30,
        emailNotifications: true,
        autoAlerts: true
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setSettings({ ...settings, [e.target.name]: value });
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="fade-in">
            <h2 className="mb-4 fw-bold">System Configuration</h2>

            {saved && <Alert variant="success">Settings saved successfully!</Alert>}

            <Row>
                <Col md={8}>
                    <div className="glass-card mb-4">
                        <h5 className="fw-bold mb-4 d-flex align-items-center">
                            <FaCog className="me-2 text-primary" /> Risk Model Parameters
                        </h5>
                        <Form onSubmit={handleSave}>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Form.Label>High Risk Threshold (Score)</Form.Label>
                                    <Form.Control type="number" name="highRiskThreshold" value={settings.highRiskThreshold} onChange={handleChange} />
                                    <Form.Text className="text-muted">Scores above this trigger critical alerts.</Form.Text>
                                </Col>
                                <Col md={6}>
                                    <Form.Label>Medium Risk Threshold (Score)</Form.Label>
                                    <Form.Control type="number" name="mediumRiskThreshold" value={settings.mediumRiskThreshold} onChange={handleChange} />
                                </Col>
                            </Row>
                            <hr className="my-4" />
                            <h6 className="fw-bold mb-3">Feature Weights (Impact on AI)</h6>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Form.Label>Attendance Impact (%)</Form.Label>
                                    <Form.Range name="attendanceWeight" value={settings.attendanceWeight} onChange={handleChange} />
                                    <div className="text-end small">{settings.attendanceWeight}%</div>
                                </Col>
                                <Col md={6}>
                                    <Form.Label>Academic Impact (%)</Form.Label>
                                    <Form.Range name="cgpaWeight" value={settings.cgpaWeight} onChange={handleChange} />
                                    <div className="text-end small">{settings.cgpaWeight}%</div>
                                </Col>
                            </Row>
                            <Button type="submit" variant="primary"><FaSave className="me-2" /> Save Changes</Button>
                        </Form>
                    </div>
                </Col>

                <Col md={4}>
                    <div className="glass-card mb-4">
                        <h5 className="fw-bold mb-3">Notifications</h5>
                        <Form.Check 
                            type="switch"
                            id="email-switch"
                            label="Email Notifications"
                            name="emailNotifications"
                            checked={settings.emailNotifications}
                            onChange={handleChange}
                            className="mb-3"
                        />
                        <Form.Check 
                            type="switch"
                            id="alert-switch"
                            label="Auto-Generate Alerts"
                            name="autoAlerts"
                            checked={settings.autoAlerts}
                            onChange={handleChange}
                            className="mb-3"
                        />
                    </div>
                    
                    <div className="glass-card bg-danger-subtle text-danger border-danger">
                         <h5 className="fw-bold mb-3"><FaDatabase className="me-2" /> Data Management</h5>
                         <p className="small">Resetting the system will delete all student records and retrain the model.</p>
                         <Button variant="outline-danger" size="sm" onClick={() => alert('This feature is disabled in demo mode.')}>Reset Database</Button>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default Settings;
