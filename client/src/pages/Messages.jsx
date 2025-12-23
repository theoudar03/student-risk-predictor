import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Button, Modal, Badge, Nav } from 'react-bootstrap';
import { FaInbox, FaPaperPlane, FaSearch, FaUser } from 'react-icons/fa';
import axios from 'axios';

const Messages = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get('/api/messages');
            setRequests(res.data);
        } catch (e) { 
            console.error(e); 
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await axios.patch(`/api/messages/${id}/status`, { status: newStatus });
            fetchRequests();
        } catch (e) {
            console.error("Failed to update status", e);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'Accepted') return <Badge bg="success">Accepted</Badge>;
        if (status === 'Declined') return <Badge bg="danger">Declined</Badge>;
        if (status === 'Viewed') return <Badge bg="info">Viewed</Badge>;
        return <Badge bg="warning" text="dark">Pending</Badge>;
    };

    return (
        <div className="fade-in">
             <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold fs-3">Meeting Requests</h2>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4">Request From</th>
                                <th>Role</th>
                                <th>Agenda</th>
                                <th>Requested For</th>
                                <th>Status</th>
                                <th className="text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-5 text-muted">No meeting requests found.</td></tr>
                            ) : requests.map(req => (
                                <tr key={req.id}>
                                    <td className="ps-4 fw-bold">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-light rounded-circle p-2 me-2"><FaUser size={12} /></div>
                                            {req.senderName}
                                        </div>
                                    </td>
                                    <td><Badge bg="secondary" className="opacity-75">{req.senderRole}</Badge></td>
                                    <td>
                                        <div className="text-dark fw-bold">{req.agenda}</div>
                                        {req.preferredTime && <small className="text-muted">Time: {req.preferredTime}</small>}
                                    </td>
                                    <td className="small">{new Date(req.preferredDate).toLocaleDateString()}</td>
                                    <td>{getStatusBadge(req.status)}</td>
                                    <td className="text-end pe-4">
                                        {req.status === 'Pending' && (
                                            <div className="d-flex justify-content-end gap-2">
                                                <Button size="sm" variant="success" onClick={() => updateStatus(req.id, 'Accepted')}>Accept</Button>
                                                <Button size="sm" variant="outline-danger" onClick={() => updateStatus(req.id, 'Declined')}>Decline</Button>
                                            </div>
                                        )}
                                        {req.status === 'Viewed' && (
                                            <div className="d-flex justify-content-end gap-2">
                                                <Button size="sm" variant="success" onClick={() => updateStatus(req.id, 'Accepted')}>Accept</Button>
                                                <Button size="sm" variant="outline-danger" onClick={() => updateStatus(req.id, 'Declined')}>Decline</Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Messages;
