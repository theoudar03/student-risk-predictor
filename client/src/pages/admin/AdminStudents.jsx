import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Badge, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

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

    useEffect(() => {
        fetchStudents();
        fetchMentors();
    }, []);

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
            // Admin sees all students, reuse the main endpoint which allows admins
            const res = await axios.get(`/api/students`);
            setStudents(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
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

    const [sortType, setSortType] = useState('name');

    // ... existing derived vars ...
    const courseMentors = mentors.filter(m => m.department === formData.course);
    
    // Filter & Sort Logic
    const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    
    const sorted = [...filtered].sort((a, b) => {
        if (sortType === 'name') return a.name.localeCompare(b.name);
        if (sortType === 'course') return (a.course || "").localeCompare(b.course || "");
        if (sortType === 'risk') return (b.riskScore || 0) - (a.riskScore || 0); // High to Low
        return 0;
    });

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold fs-3">Manage Students</h2>
                <Button variant="primary" onClick={() => setShowModal(true)}><FaPlus className="me-2" /> Register Student</Button>
            </div>

            <div className="glass-card mb-4 p-3 d-flex gap-3">
                 <InputGroup>
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                    <Form.Control placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
                </InputGroup>
                <Form.Select style={{ maxWidth: '200px' }} value={sortType} onChange={e => setSortType(e.target.value)}>
                    <option value="name">Sort by Name (A-Z)</option>
                    <option value="course">Sort by Course</option>
                    <option value="risk">Sort by Risk (High-Low)</option>
                </Form.Select>
            </div>

            <Table hover responsive className="bg-white shadow-sm rounded">
                <thead className="bg-light">
                    <tr>
                        <th className="ps-3">Name / ID</th>
                        <th>Department (Course)</th>
                        <th>Risk Level</th>
                        <th className="text-end pe-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map(s => (
                        <tr key={s._id}>
                            <td className="ps-3">
                                <div className="fw-bold">{s.name}</div>
                                <small className="text-muted">{s.studentId}</small>
                            </td>
                            <td><Badge bg="light" text="dark" className="border">{s.course}</Badge></td>
                            <td><Badge bg={s.riskLevel === 'High' ? 'danger' : s.riskLevel === 'Medium' ? 'warning' : 'success'}>{s.riskLevel}</Badge></td>
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
