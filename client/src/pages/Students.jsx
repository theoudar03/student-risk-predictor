import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Badge, InputGroup, ProgressBar, Alert, Row, Col } from 'react-bootstrap';
import { FaSearch, FaPlus, FaFilter, FaDownload, FaExclamationCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Students = () => {
    // 1. Initial Logic
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterRisk, setFilterRisk] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', studentId: '', email: '', course: 'Computer Science', 
        attendancePercentage: 75, cgpa: 7.5, feeDelayDays: 0, classParticipationScore: 5
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            console.log("Fetching students...");
            const res = await axios.get('http://localhost:5000/api/students');
            console.log("Got data:", res.data);
            if (Array.isArray(res.data)) {
                setStudents(res.data);
                setError(null);
            } else {
                setStudents([]);
                setError("Data format error");
            }
        } catch (err) {
            console.error("Fetch failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. Helper Functions
    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/students', formData);
            setShowModal(false);
            fetchStudents();
        } catch (error) { alert('Error adding student'); }
    };

    const exportCSV = () => {
        if (!students.length) return;
        const headers = ["ID,Name,Email,Course,Risk Score,Risk Level,Attendance,CGPA"];
        const rows = students.map(s => `${s.studentId},${s.name},${s.email || ''},${s.course || ''},${s.riskScore},${s.riskLevel},${s.attendancePercentage},${s.cgpa}`);
        const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_risk_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 3. Filter Logic
    const filtered = students.filter(s => {
        const name = s.name || '';
        const matchSearch = name.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filterRisk === 'All' || s.riskLevel === filterRisk;
        return matchSearch && matchFilter;
    });

    // 4. Render Logic
    if (loading) return <div className="p-5 text-center">Loading Data...</div>;
    if (error) return <div className="p-5 text-center text-danger">Error: {error} <br/> <button className="btn btn-outline-danger btn-sm mt-3" onClick={fetchStudents}>Retry</button></div>;

    return (
        <div style={{opacity: 1}}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold fs-3">Student Registry</h2>
                <div className="d-flex gap-2">
                    <Button variant="outline-dark" onClick={exportCSV} disabled={students.length === 0}><FaDownload className="me-2" /> Export</Button>
                    <Button variant="primary" onClick={() => setShowModal(true)}><FaPlus className="me-2" /> Add Student</Button>
                </div>
            </div>

            <div className="glass-card mb-4" style={{padding: 15}}>
                <div className="d-flex gap-3">
                    <InputGroup style={{ maxWidth: 350 }}>
                        <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-secondary" /></InputGroup.Text>
                        <Form.Control type="text" placeholder="Search by name..." className="border-start-0 ps-0 shadow-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </InputGroup>
                    <Form.Select style={{width: 150}} value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
                        <option value="All">All Risks</option>
                        <option value="High">High Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="Low">Low Risk</option>
                    </Form.Select>
                </div>
            </div>

            <div className="glass-card p-0 overflow-hidden">
                <Table hover responsive className="mb-0">
                    <thead style={{background: '#f8f9fa'}}>
                        <tr>
                            <th className="ps-4">Student</th>
                            <th>Course</th>
                            <th>Contact</th>
                            <th>Performance</th>
                            <th>Risk Analysis</th>
                            <th>Status</th>
                            <th>Profile</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center p-5 text-muted">No students found.</td>
                            </tr>
                        ) : filtered.map(s => (
                            <tr key={s._id}>
                                <td className="ps-4">
                                    <div className="fw-bold text-dark">{s.name}</div>
                                    <small className="text-muted">{s.studentId}</small>
                                </td>
                                <td><span className="badge bg-light text-dark border">{s.course || '-'}</span></td>
                                <td>
                                    <div className="small text-muted">{s.email}</div>
                                    <div className="small text-muted">{s.feeDelayDays > 0 ? `${s.feeDelayDays}d Fee Delay` : 'Fees Paid'}</div>
                                </td>
                                <td>
                                    <div className="small">Attendance: <strong>{s.attendancePercentage}%</strong></div>
                                    <div className="small">CGPA: <strong>{s.cgpa}</strong></div>
                                </td>
                                <td>
                                    <div className="d-flex align-items-center">
                                       <div style={{width: 8, height: 8, borderRadius: '50%', marginRight: 8, background: s.riskScore > 70 ? '#D00000' : s.riskScore > 35 ? '#FF9800' : '#4BA258'}} />
                                       <span className="fw-bold">{s.riskScore}/100</span>
                                    </div>
                                    <div className="small text-muted" style={{maxWidth: 150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                                        {s.riskFactors?.[0] || 'None'}
                                    </div>
                                </td>
                                <td><span className={`status-badge badge-${(s.riskLevel || 'low').toLowerCase()}`}>{s.riskLevel}</span></td>
                                <td><Link to={`/students/${s._id}`} className="btn btn-sm btn-outline-primary">View</Link></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

             {/* Add Student Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">New Student Enrollment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <h6 className="text-muted text-uppercase small fw-bold mb-3">Basic Info</h6>
                        <Row className="mb-3">
                            <Col md={6}><Form.Control placeholder="Full Name" name="name" required onChange={handleInputChange} className="mb-3" /></Col>
                            <Col md={6}><Form.Control placeholder="Student ID" name="studentId" required onChange={handleInputChange} className="mb-3" /></Col>
                            <Col md={12}><Form.Control placeholder="Email Address" name="email" type="email" required onChange={handleInputChange} /></Col>
                        </Row>
                        <h6 className="text-primary text-uppercase small fw-bold mb-3 mt-4">Performance Metrics (For AI)</h6>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Label className="small">Attendance %</Form.Label>
                                <Form.Control type="number" name="attendancePercentage" max="100" required onChange={handleInputChange} />
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Label className="small">CGPA (0-10)</Form.Label>
                                <Form.Control type="number" step="0.1" name="cgpa" max="10" required onChange={handleInputChange} />
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Label className="small">Fee Delay (Days)</Form.Label>
                                <Form.Control type="number" name="feeDelayDays" onChange={handleInputChange} />
                            </Col>
                             <Col md={6} className="mb-3">
                                <Form.Label className="small">Participation Score (1-10)</Form.Label>
                                <Form.Control type="number" max="10" name="classParticipationScore" onChange={handleInputChange} />
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Enroll & Analyze Risk</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Students;
