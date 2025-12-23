import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form } from 'react-bootstrap';
import { FaUserGraduate, FaChalkboardTeacher, FaCalendarCheck, FaChartLine } from 'react-icons/fa';
import axios from 'axios';

const ParentDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showContactModal, setShowContactModal] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`/api/portal/parent/child-profile`);
                setProfile(res.data);
            } catch (err) {
                setError('Failed to load child profile.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="p-5 text-center">Loading...</div>;
    if (error) return <div className="p-5 text-center text-danger">{error}</div>;
    if (!profile) return <div className="p-5 text-center">No student profile found linked to your account.</div>;

    const getConcernColor = (level) => {
        if (level === 'Needs Attention') return 'danger';
        if (level === 'Monitor Closely') return 'warning';
        return 'success';
    };

    return (
        <Container fluid className="p-4">
            <h2 className="mb-4 text-dark fw-bold">Parent Portal</h2>
            <Row className="mb-4">
                {/* Child Snapshot */}
                <Col md={8}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="mb-0 d-flex align-items-center">
                                    <FaUserGraduate className="me-2 text-primary" /> 
                                    {profile.name}
                                </h4>
                                <Badge bg={getConcernColor(profile.concernLevel)} className="px-3 py-2">
                                    Status: {profile.concernLevel}
                                </Badge>
                            </div>

                            <Row className="g-4">
                                <Col md={4}>
                                    <div className="p-3 bg-light rounded text-center">
                                        <FaCalendarCheck size={24} className="mb-2 text-info" />
                                        <div className="text-muted small text-uppercase">Attendance</div>
                                        <h3 className="fw-bold">{profile.attendancePercentage}%</h3>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="p-3 bg-light rounded text-center">
                                        <FaChartLine size={24} className="mb-2 text-success" />
                                        <div className="text-muted small text-uppercase">CGPA</div>
                                        <h3 className="fw-bold">{profile.cgpa}</h3>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="p-3 bg-light rounded text-center">
                                        <FaChartLine size={24} className="mb-2 text-secondary" />
                                        <div className="text-muted small text-uppercase">Trend</div>
                                        <h5 className="fw-bold mt-2">{profile.performanceTrend}</h5>
                                    </div>
                                </Col>
                            </Row>
                            
                            <div className="mt-4 p-3 border rounded bg-white">
                                <h6 className="fw-bold">Academic Observation:</h6>
                                <p className="mb-0 text-muted">{profile.concernMessage}</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Communication Panel (Light Theme) */}
                <Col md={4}>
                    <Card className="shadow-sm border-0 h-100 bg-white">
                        <Card.Body>
                             <h5 className="mb-4 d-flex align-items-center text-dark"><FaChalkboardTeacher className="me-2 text-primary" /> Mentor Contact</h5>
                             
                             <div className="mb-4 p-3 bg-light rounded text-center border">
                                 <h6 className="opacity-75 text-muted text-uppercase small">Assigned Mentor</h6>
                                 <h4 className="fw-bold text-dark mb-1">{profile.mentorContact?.name}</h4>
                                 <p className="small text-muted mb-0">{profile.mentorContact?.email}</p>
                             </div>

                             <div className="d-grid gap-2">
                                 <Button variant="outline-primary" onClick={() => setShowContactModal(true)}>
                                    Send Message / Request Meeting
                                 </Button>
                             </div>
                             
                             <div className="mt-4 pt-3 border-top">
                                 <small className="text-muted">Last updated: {new Date().toLocaleDateString()}</small>
                             </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Meeting Request Modal */}
            <MeetingRequestModal 
                show={showContactModal} 
                onHide={() => setShowContactModal(false)}
                recipientId={profile.mentorContact?.id}
                recipientName={profile.mentorContact?.name || "Mentor"}
            />
        </Container>
    );
};

// Sub-component for Meeting Request Modal
const MeetingRequestModal = ({ show, onHide, recipientId, recipientName }) => {
    const [reqData, setReqData] = useState({ agenda: '', date: '', time: '' });
    const [status, setStatus] = useState(null);

    const send = async () => {
        try {
            await axios.post('/api/messages', {
                receiverId: recipientId,
                receiverName: recipientName,
                ...reqData
            });
            setStatus('success');
            setTimeout(() => { setStatus(null); onHide(); }, 1500);
        } catch (e) {
            setStatus('error');
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Request Meeting with {recipientName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {status === 'success' && <div className="alert alert-success">Request Sent!</div>}
                {status === 'error' && <div className="alert alert-danger">Failed to send request.</div>}
                
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Preferred Date</Form.Label>
                        <Form.Control type="date" 
                            onChange={e => setReqData({...reqData, date: e.target.value})}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Preferred Time (Optional)</Form.Label>
                        <Form.Control type="time" 
                            onChange={e => setReqData({...reqData, time: e.target.value})}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Reason / Agenda</Form.Label>
                        <Form.Control as="textarea" rows={4} placeholder="What would you like to discuss?"
                            onChange={e => setReqData({...reqData, agenda: e.target.value})}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button variant="primary" onClick={send} disabled={!reqData.date || !reqData.agenda}>Send Request</Button>
            </Modal.Footer>
        </Modal>
    );
};


export default ParentDashboard;
