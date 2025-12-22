import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Button, Badge } from 'react-bootstrap';
import { FaBell, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/students/data/alerts`);
            setAlerts(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const resolveAlert = async (id) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/students/data/alerts/${id}/resolve`);
            setAlerts(alerts.map(a => a._id === id ? res.data : a));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="fade-in">
            <h2 className="mb-4 fw-bold">Live Risk Alerts</h2>
            <div className="glass-card">
                {alerts.length === 0 ? (
                    <div className="text-center p-5 text-muted">
                        <FaBell style={{fontSize: 40, marginBottom: 20}} />
                        <p>No alerts generated yet.</p>
                    </div>
                ) : (
                    <Table responsive hover className="mb-0">
                        <thead>
                            <tr>
                                <th>Severity</th>
                                <th>Student</th>
                                <th>Details</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map(alert => (
                                <tr key={alert._id} style={{opacity: alert.status === 'Resolved' ? 0.5 : 1}}>
                                    <td>
                                        <Badge bg={alert.severity === 'High' ? 'danger' : 'warning'}>
                                            {alert.severity}
                                        </Badge>
                                    </td>
                                    <td className="fw-bold">{alert.studentName}</td>
                                    <td>{alert.message}</td>
                                    <td className="text-muted small">
                                        {new Date(alert.date).toLocaleDateString()}
                                    </td>
                                    <td>
                                        {alert.status !== 'Resolved' ? (
                                            <Button size="sm" variant="outline-success" onClick={() => resolveAlert(alert._id)}>
                                                <FaCheck className="me-1" /> Mark Resolved
                                            </Button>
                                        ) : (
                                            <Badge bg="secondary">Resolved</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </div>
        </div>
    );
};

export default Alerts;
