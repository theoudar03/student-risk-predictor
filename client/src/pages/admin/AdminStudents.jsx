import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Badge, InputGroup, Row, Col, Spinner } from 'react-bootstrap';
import { FaSearch, FaPlus, FaTrash, FaEdit, FaRedo } from 'react-icons/fa';

const AdminStudents = () => {
    const [students, setStudents] = useState([]);
    const [mentors, setMentors] = useState([]); // Add this
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);

    // Departments for selection (Alphabetical Order)
    const departments = ["AI&DS", "AIML", "CIVIL", "CSBS", "CSE", "ECE", "EEE", "ICE", "IT", "MBA", "MECH"];

    const [formData, setFormData] = useState({
        name: '', studentId: '', email: '', course: '', mentorId: '', 
        attendancePercentage: 75, cgpa: 7.5, feeDelayDays: 0, classParticipationScore: 5
    });

    const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });

    useEffect(() => {
        fetchStudents();
        fetchMentors();
        
        // Auto-refresh for async risk updates
        // We keep this, but it will respect current sort order
        const interval = setInterval(() => {
             // Only if not editing modal
             if (!showModal && !globalProcessing) fetchStudents();
        }, 5000);
        return () => clearInterval(interval);
    }, [sortConfig]); // Refetch when sort changes

    const fetchMentors = async () => {
        try {
            const res = await axios.get(`/api/admin/mentors`);
            setMentors(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchStudents = async () => {
        try {
            // Use Admin-specific endpoint with Backend Sorting
            const res = await axios.get(`/api/admin/students`, {
                params: {
                    sortBy: sortConfig.key,
                    sortOrder: sortConfig.direction
                }
            });
            setStudents(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleEdit = (student) => {
        setEditId(student._id);
        setFormData({
            name: student.name,
            studentId: student.studentId,
            email: student.email,
            course: student.course || '',
            attendancePercentage: student.attendancePercentage,
            cgpa: student.cgpa,
            feeDelayDays: student.feeDelayDays || 0,
            classParticipationScore: student.classParticipationScore || 5
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if(editId) {
                // Edit Mode
                await axios.put(`/api/admin/students/${editId}`, formData);
            } else {
                // Add Mode
                const res = await axios.post(`/api/admin/students`, formData);
                const newId = res.data.studentId;
                alert(`✅ Student Registered Successfully!\n\n🎓 Student Login:\nUsername: ${newId}\nPassword: ${newId}\n\n👨‍👩‍👧 Parent Login:\nUsername: p_${newId}\nPassword: p_${newId}`);
            }
            setShowModal(false);
            setEditId(null);
            fetchStudents();
        } catch (error) { alert('Error saving student'); }
    };
    
    const handleDelete = async (id) => {
        if(!window.confirm("Are you sure you want to remove this student? This action cannot be undone.")) return;
        try {
            await axios.delete(`/api/admin/students/${id}`);
            fetchStudents();
        } catch(e) { alert("Failed to delete"); }
    };

    const courseMentors = mentors.filter(m => m.department === formData.course);
    
    // Client-side Filter Only (Search)
    // Sorting is now 100% Backend
    const filteredStudents = students.filter(s => {
        const term = search.toLowerCase();
        return (
            (s.name || "").toLowerCase().includes(term) ||
            (s.studentId || "").toLowerCase().includes(term) ||
            (s.course || "").toLowerCase().includes(term)
        );
    });

    const [globalProcessing, setGlobalProcessing] = useState(false);

    const handleRecalculateAll = async () => {
        if (!window.confirm("This will trigger risk recalculation for ALL students. Continue?")) return;
        
        setGlobalProcessing(true);
        try {
            // New Admin Endpoint
            const res = await axios.post('/api/admin/risk-recalculate');
            const { processed, durationMs } = res.data;
            alert(`✅ Batch Recalculation Complete!\n\nProcessed: ${processed} students\nTime: ${durationMs}ms`);
            
            // Force immediate refresh to show results
            fetchStudents(); 
        } catch (e) {
            console.error("Batch Failed:", e);
            alert("❌ Batch Recalculation Failed. Please try again.");
        } finally {
            setGlobalProcessing(false);
        }
    };

    const getRiskBadge = (s) => {
        const level = s.riskLevel || 'Low'; 
        return <Badge bg={level === 'High' ? 'danger' : level === 'Medium' ? 'warning' : 'success'}>{level}</Badge>;
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <span className="text-muted ms-1" style={{fontSize: '0.8em'}}>↕</span>;
        return <span className="ms-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div>
            {globalProcessing && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999 }}>
                    <div className="text-center p-4 bg-white shadow rounded">
                        <Spinner animation="border" variant="primary" className="mb-3" />
                        <h5 className="fw-bold">Recalculating Risk Scores...</h5>
                        <p className="text-muted mb-0">Please wait while we process all students.</p>
                    </div>
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold fs-3">Manage Students</h2>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={handleRecalculateAll} disabled={globalProcessing}>
                        <FaRedo className={`me-2 ${globalProcessing ? 'fa-spin' : ''}`} /> 
                        {globalProcessing ? 'Processing...' : 'Recalculate All'}
                    </Button>
                    <Button variant="primary" onClick={() => setShowModal(true)} disabled={globalProcessing}>
                        <FaPlus className="me-2" /> Register Student
                    </Button>
                </div>
            </div>

            <div className="glass-card mb-4 p-3 d-flex gap-3">
                 <InputGroup>
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                    <Form.Control placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
                </InputGroup>
                
                 {/* Replaced legacy SELECT dropdown with explicit instructions or just rely on table headers */}
                 <div className="text-muted d-flex align-items-center text-nowrap">
                    <small>Click table headers to sort</small>
                 </div>
            </div>

            <Table hover responsive className="bg-white shadow-sm rounded">
                <thead className="bg-light">
                    <tr>
                        <th className="ps-3 pointer" onClick={() => handleSort('name')}>
                            Name / ID <SortIcon column="name" />
                        </th>
                        <th className="pointer" onClick={() => handleSort('course')}>
                            Department <SortIcon column="course" />
                        </th>
                        <th className="pointer" onClick={() => handleSort('riskScore')}>
                            Risk Level <SortIcon column="riskScore" />
                        </th>
                        <th className="text-end pe-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredStudents.map(s => (
                        <tr key={s._id}>
                            <td className="ps-3">
                                <div className="fw-bold">{s.name}</div>
                                <small className="text-muted">{s.studentId}</small>
                            </td>
                            <td><Badge bg="light" text="dark" className="border">{s.course}</Badge></td>
                            <td>{getRiskBadge(s)} <small className="text-muted ms-1">({s.riskScore ?? 0}%)</small></td>
                            <td className="text-end pe-3">
                                <Button size="sm" variant="outline-primary" className="me-2" onClick={() => handleEdit(s)}><FaEdit /></Button>
                                <Button size="sm" variant="outline-danger" onClick={() => handleDelete(s._id)}><FaTrash /></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Add/Edit Student Modal */}
            <Modal show={showModal} onHide={() => { setShowModal(false); setEditId(null); setFormData({ name: '', studentId: '', email: '', course: '', mentorId: '', attendancePercentage: 75, cgpa: 7.5, feeDelayDays: 0, classParticipationScore: 5 }); }} size="lg">
                <Modal.Header closeButton><Modal.Title>{editId ? 'Edit Student' : 'Register New Student'}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row className="mb-3">
                            <Col md={6}><Form.Control placeholder="Full Name" name="name" value={formData.name} required onChange={handleInputChange} className="mb-3" /></Col>
                            <Col md={6}><Form.Control placeholder="Student ID" name="studentId" value={formData.studentId} disabled={!!editId} required onChange={handleInputChange} className="mb-3" /></Col>
                            <Col md={6}><Form.Control placeholder="Email" name="email" value={formData.email} required onChange={handleInputChange} /></Col>
                            <Col md={6}>
                                <Form.Select name="course" onChange={handleInputChange} value={formData.course} required>
                                    <option value="">Select Course</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </Form.Select>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small text-muted">Assign Mentor (Required)</Form.Label>
                                    <Form.Select 
                                        name="mentorId" 
                                        value={formData.mentorId} 
                                        onChange={handleInputChange} 
                                        required 
                                        disabled={!formData.course}
                                    >
                                        <option value="">{formData.course ? "Select Mentor" : "Select Course First"}</option>
                                        {courseMentors.length > 0 ? (
                                            courseMentors.map(m => (
                                                <option key={m.mentorId} value={m.mentorId}>{m.name} ({m.mentorId})</option>
                                            ))
                                        ) : (
                                            formData.course && <option disabled>No mentors available for {formData.course}</option>
                                        )}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <h6 className="mt-3">Initial Metrics</h6>
                        <Row>
                             <Col md={6} className="mb-2"><Form.Label className="small">Attendance %</Form.Label><Form.Control type="number" name="attendancePercentage" value={formData.attendancePercentage} required onChange={handleInputChange} /></Col>
                             <Col md={6} className="mb-2"><Form.Label className="small">CGPA</Form.Label><Form.Control type="number" step="0.1" name="cgpa" value={formData.cgpa} required onChange={handleInputChange} /></Col>
                             <Col md={6} className="mb-2"><Form.Label className="small">Fee Delay Days</Form.Label><Form.Control type="number" name="feeDelayDays" value={formData.feeDelayDays} onChange={handleInputChange} /></Col>
                        </Row>
                        <div className="text-end mt-4">
                            <Button variant="primary" type="submit">{editId ? 'Update Changes' : 'Register Student'}</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AdminStudents;
