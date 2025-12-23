import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Badge } from 'react-bootstrap';
import { FaHistory, FaPlus, FaCheck } from 'react-icons/fa';
import axios from 'axios';

const InterventionPanel = ({ studentId, riskScore, riskLevel, onUpdate }) => {
    const [interventions, setInterventions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        actionTaken: 'Counseling',
        notes: '',
        followUpDate: ''
    });

    useEffect(() => {
        if (studentId) fetchInterventions();
    }, [studentId]);

    const fetchInterventions = async () => {
        try {
            const res = await axios.get(`/api/interventions/${studentId}`);
            setInterventions(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/interventions`, {
                studentId,
                riskScoreAtTime: riskScore,
                riskLevel,
                ...formData
            });
            setShowForm(false);
            setFormData({ actionTaken: 'Counseling', notes: '', followUpDate: '' });
            fetchInterventions();
            if (onUpdate) onUpdate();
        } catch (error) {
            alert('Failed to save intervention');
        }
    };

    const handleOutcome = async (id, outcome) => {
        try {
            await axios.patch(`/api/interventions/${id}/outcome`, {
                outcome,
                resolveAlert: outcome === 'Effective'
            });
            fetchInterventions();
        } catch (error) {
            alert('Failed to update outcome');
        }
    };

    return (
        <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold"><FaHistory className="me-2" /> Intervention History</h5>
                <Button size="sm" variant="primary" onClick={() => setShowForm(!showForm)}>
                    <FaPlus /> New Action
                </Button>
            </Card.Header>
            <Card.Body>
                {showForm && (
                    <Form onSubmit={handleSubmit} className="mb-4 p-3 bg-light rounded border">
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold">Action Type</Form.Label>
                            <Form.Select 
                                value={formData.actionTaken}
                                onChange={e => setFormData({...formData, actionTaken: e.target.value})}
                            >
                                <option>Counseling</option>
                                <option>Parent Meeting</option>
                                <option>Academic Remedial</option>
                                <option>Peer Support</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold">Notes</Form.Label>
                            <Form.Control 
                                as="textarea" rows={2} 
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Follow-up Date</Form.Label>
                            <Form.Control 
                                type="date"
                                value={formData.followUpDate}
                                onChange={e => setFormData({...formData, followUpDate: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Button type="submit" size="sm" variant="success">Save Intervention</Button>
                    </Form>
                )}

                <div className="intervention-list">
                    {interventions.length === 0 ? (
                        <p className="text-muted text-center small my-4">No interventions recorded yet.</p>
                    ) : (
                        interventions.map(item => (
                            <div key={item.id} className="d-flex mb-3 border-start border-3 ps-3" style={{borderColor: item.outcome === 'Effective' ? '#198754' : '#ffc107'}}>
                                <div className="w-100">
                                    <div className="d-flex justify-content-between">
                                        <small className="fw-bold text-dark">{item.actionTaken}</small>
                                        <small className="text-muted">{new Date(item.timestamp).toLocaleDateString()}</small>
                                    </div>
                                    <p className="mb-1 small text-secondary">{item.notes}</p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Badge bg={item.outcome === 'Pending' ? 'warning' : 'success'} className="fw-normal">
                                            {item.outcome}
                                        </Badge>
                                        
                                        {item.outcome === 'Pending' && (
                                            <div className="btn-group btn-group-sm">
                                                <Button 
                                                    variant="outline-success" 
                                                    style={{fontSize: '0.7rem', padding: '2px 5px'}}
                                                    onClick={() => handleOutcome(item.id, 'Effective')}
                                                >
                                                    Mark Effective
                                                </Button>
                                                <Button 
                                                    variant="outline-secondary" 
                                                    style={{fontSize: '0.7rem', padding: '2px 5px'}}
                                                    onClick={() => handleOutcome(item.id, 'No Charge')}
                                                >
                                                    No Change
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default InterventionPanel;
