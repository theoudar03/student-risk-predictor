import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Badge, Button, Modal } from 'react-bootstrap';
import { FaClipboardList, FaCheckCircle } from 'react-icons/fa';

const AssessmentInbox = () => {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssessment, setSelectedAssessment] = useState(null);

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            const res = await axios.get('/api/portal/mentor/assessments');
            setAssessments(res.data);
        } catch (e) {
            console.error("Failed to fetch assessments", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <h2 className="mb-4 fw-bold text-dark">Assessment Inbox</h2>
            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4">Student</th>
                                <th>Risk Level</th>
                                <th>Stress (1-10)</th>
                                <th>Motivation (1-10)</th>
                                <th>Date Submitted</th>
                                <th className="text-end pe-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessments.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-5 text-muted">No assessments received yet.</td></tr>
                            ) : assessments.map(a => (
                                <tr key={a.id}>
                                    <td className="ps-4 fw-bold">{a.studentName}</td>
                                    <td><Badge bg={a.studentRiskLevel === 'High' ? 'danger' : a.studentRiskLevel === 'Medium' ? 'warning' : 'success'}>{a.studentRiskLevel}</Badge></td>
                                    <td>{a.stressLevel}</td>
                                    <td>{a.motivation}</td>
                                    <td>{new Date(a.timestamp).toLocaleDateString()}</td>
                                    <td className="text-end pe-4">
                                        <Button size="sm" variant="outline-primary" onClick={() => setSelectedAssessment(a)}>View Detail</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Assessment Detail Modal */}
            <Modal show={!!selectedAssessment} onHide={() => setSelectedAssessment(null)}>
                <Modal.Header closeButton>
                    <Modal.Title>Assessment Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedAssessment && (
                        <div>
                            <h5 className="fw-bold">{selectedAssessment.studentName}</h5>
                            <p className="text-muted small">Submitted on {new Date(selectedAssessment.timestamp).toLocaleString()}</p>
                            <hr />
                            <div className="mb-3">
                                <strong>Stress Level:</strong> {selectedAssessment.stressLevel}/10
                            </div>
                            <div className="mb-3">
                                <strong>Learning Difficulty:</strong> {selectedAssessment.learningDifficulty}/10
                            </div>
                            <div className="mb-3">
                                <strong>Motivation:</strong> {selectedAssessment.motivation}/10
                            </div>
                            <div className="mb-3 bg-light p-3 rounded">
                                <strong>Notes:</strong>
                                <p className="mb-0 mt-1">{selectedAssessment.notes || "No additional notes provided."}</p>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setSelectedAssessment(null)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AssessmentInbox;
