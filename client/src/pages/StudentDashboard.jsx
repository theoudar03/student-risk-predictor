import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, Form, Alert, Badge } from 'react-bootstrap';
import { FaUserGraduate, FaChartLine, FaClipboardList, FaLightbulb, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const StudentDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [survey, setSurvey] = useState({ stressLevel: 5, learningDifficulty: 5, motivation: 5, notes: '' });
    const [surveyStatus, setSurveyStatus] = useState(null);

    const [mentors, setMentors] = useState([]);

    useEffect(() => {
        fetchProfile();
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            const res = await axios.get('/api/portal/list-mentors');
            setMentors(res.data);
        } catch (e) {
            console.error("Failed to fetch mentors", e);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`/api/portal/student/profile`);
            setProfile(res.data);
        } catch (err) {
            setError('Failed to load profile. Please contact administrator.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSurveySubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/portal/student/survey`, survey);
            setSurveyStatus('success');
            setSurvey({ stressLevel: 5, learningDifficulty: 5, motivation: 5, notes: '', mentorId: '' }); // Reset Form
            setTimeout(() => setSurveyStatus(null), 5000);
        } catch (err) {
            setSurveyStatus('error');
            console.error(err);
        }
    };

    if (loading) return <div className="p-5 text-center">Loading your dashboard...</div>;
    if (error) return <Alert variant="danger" className="m-4">{error}</Alert>;
    if (!profile) return <div className="p-5 text-center">No student profile data available.</div>;

    return (
        <Container fluid className="p-4">
            <h2 className="mb-4 fw-bold text-dark">My Dashboard</h2>

            {/* Overview Section */}
            <Row className="mb-4">
                <Col md={8}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body>
                            <h5 className="mb-4 d-flex align-items-center"><FaUserGraduate className="me-2 text-primary" /> Academic Overview</h5>
                            <Row>
                                <Col md={6} className="mb-4">
                                    <div className="p-3 bg-light rounded">
                                        <small className="text-muted text-uppercase fw-bold">Attendance</small>
                                        <div className="d-flex align-items-end justify-content-between mb-2">
                                            <h3 className="mb-0 fw-bold">{profile.attendancePercentage}%</h3>
                                            <Badge bg={profile.attendancePercentage >= 75 ? 'success' : 'warning'}>
                                                {profile.attendancePercentage >= 75 ? 'On Track' : 'Attention'}
                                            </Badge>
                                        </div>
                                        <ProgressBar now={profile.attendancePercentage} variant={profile.attendancePercentage >= 75 ? 'success' : 'warning'} style={{height: 6}} />
                                    </div>
                                </Col>
                                <Col md={6} className="mb-4">
                                    <div className="p-3 bg-light rounded">
                                        <small className="text-muted text-uppercase fw-bold">CGPA</small>
                                        <div className="d-flex align-items-end justify-content-between mb-2">
                                            <h3 className="mb-0 fw-bold">{profile.cgpa}</h3>
                                            <small className="text-muted">Current</small>
                                        </div>
                                        <ProgressBar now={profile.cgpa * 10} variant="info" style={{height: 6}} />
                                    </div>
                                </Col>
                                <Col md={6} className="mb-4">
                                    <div className="p-3 bg-light rounded">
                                        <small className="text-muted text-uppercase fw-bold">Assignments</small>
                                        <div className="d-flex align-items-end justify-content-between mb-2">
                                            <h3 className="mb-0 fw-bold">{profile.assignmentsCompleted}%</h3>
                                            <small className="text-muted">Completion</small>
                                        </div>
                                        <ProgressBar now={profile.assignmentsCompleted} variant={profile.assignmentsCompleted > 80 ? 'primary' : 'warning'} style={{height: 6}} />
                                    </div>
                                </Col>
                                <Col md={6} className="mb-4">
                                    <div className="p-3 bg-light rounded">
                                        <small className="text-muted text-uppercase fw-bold">Participation</small>
                                        <div className="d-flex align-items-end justify-content-between mb-2">
                                            <h3 className="mb-0 fw-bold">{profile.classParticipationScore}/100</h3>
                                        </div>
                                         <ProgressBar now={profile.classParticipationScore} variant="secondary" style={{height: 6}} />
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Insights Panel */}
                <Col md={4}>
                    <Card className="shadow-sm border-0 h-100 bg-primary text-white">
                        <Card.Body>
                            <h5 className="mb-4 d-flex align-items-center"><FaLightbulb className="me-2 text-warning" /> Improvement Insights</h5>
                            
                            <div className="vstack gap-3">
                                {profile.recommendations && profile.recommendations.length > 0 ? (
                                    profile.recommendations.map((rec, idx) => (
                                        <div key={idx} className="p-3 bg-white bg-opacity-25 rounded border border-white border-opacity-25">
                                            <p className="mb-0 small">{rec}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-3">
                                        <FaCheckCircle size={32} className="mb-2 opacity-75" />
                                        <p className="mb-0 small">Great job! You are on the right track.</p>
                                    </div>
                                )}
                            </div>
                            
                            <h6 className="mt-4 mb-2 small fw-bold opacity-75">Key Observations:</h6>
                            <ul className="small ps-3 mb-0">
                                {profile.insights && profile.insights.map((insight, idx) => (
                                    <li key={idx} className="mb-1">{insight}</li>
                                ))}
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Self-Assessment Survey */}
            <Row>
                <Col md={12}>
                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <h5 className="mb-4 d-flex align-items-center"><FaClipboardList className="me-2 text-info" /> Weekly Self-Assessment</h5>
                            <p className="text-muted small mb-4">Help us understand how you're feeling. This data is private and helps improve your specific support plan.</p>
                            
                            {surveyStatus === 'success' && <Alert variant="success">Survey submitted successfully! Thank you.</Alert>}
                            {surveyStatus === 'error' && <Alert variant="danger">Failed to submit survey. Try again.</Alert>}

                            <Form onSubmit={handleSurveySubmit}>
                                <Row>
                                    <Col md={12} className="mb-3">
                                        <Form.Label className="small fw-bold">Select Mentor for Review</Form.Label>
                                        <Form.Select 
                                            onChange={e => setSurvey({...survey, mentorId: e.target.value})}
                                            required
                                        >
                                            <option value="">-- Choose a Mentor --</option>
                                            {mentors.map(m => (
                                                <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
                                            ))}
                                        </Form.Select>
                                        <Form.Text className="text-muted">Only this mentor will see your assessment.</Form.Text>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Label className="small fw-bold">Stress Level (1-10)</Form.Label>
                                        <div className="d-flex align-items-center gap-2">
                                            <Form.Range 
                                                min={1} max={10} 
                                                value={survey.stressLevel} 
                                                onChange={e => setSurvey({...survey, stressLevel: e.target.value})} 
                                            />
                                            <span className="fw-bold text-primary">{survey.stressLevel}</span>
                                        </div>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Label className="small fw-bold">Learning Difficulty (1-10)</Form.Label>
                                        <div className="d-flex align-items-center gap-2">
                                            <Form.Range 
                                                min={1} max={10} 
                                                value={survey.learningDifficulty} 
                                                onChange={e => setSurvey({...survey, learningDifficulty: e.target.value})} 
                                            />
                                            <span className="fw-bold text-primary">{survey.learningDifficulty}</span>
                                        </div>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Label className="small fw-bold">Motivation (1-10)</Form.Label>
                                        <div className="d-flex align-items-center gap-2">
                                            <Form.Range 
                                                min={1} max={10} 
                                                value={survey.motivation} 
                                                onChange={e => setSurvey({...survey, motivation: e.target.value})} 
                                            />
                                            <span className="fw-bold text-primary">{survey.motivation}</span>
                                        </div>
                                    </Col>
                                    <Col md={12} className="mb-3">
                                        <Form.Label className="small fw-bold">Additional Notes (Optional)</Form.Label>
                                        <Form.Control 
                                            as="textarea" 
                                            rows={2} 
                                            placeholder="Any specific challenges this week?" 
                                            value={survey.notes}
                                            onChange={e => setSurvey({...survey, notes: e.target.value})}
                                        />
                                    </Col>
                                </Row>
                                <div className="text-end">
                                    <Button type="submit" variant="primary">Submit Assessment</Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default StudentDashboard;
