import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Badge, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

const AdminMentors = () => {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editEmail, setEditEmail] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    // Departments
    const departments = ["CSE", "ECE", "EEE", "IT", "AIDS"];

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', department: 'CSE', password: 'password123'
    });

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            const res = await axios.get(`/api/admin/mentors`);
            setMentors(res.data);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleEdit = (mentor) => {
        setEditEmail(mentor.email);
        setFormData({
            name: mentor.name,
            email: mentor.email,
            phone: mentor.phone,
            department: mentor.department,
            password: '' // Not editable here
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if(editEmail) {
                 await axios.put(`/api/admin/mentors/${editEmail}`, formData);
            } else {
                 await axios.post(`/api/admin/mentors`, formData);
            }
            setShowModal(false);
            setEditEmail(null);
            fetchMentors();
        } catch (error) { alert('Error updating/adding mentor'); }
    };
    
    const handleDelete = async (email) => {
        if(!window.confirm("Remove this mentor? Accounts related to this email will be deleted.")) return;
        try {
            await axios.delete(`/api/admin/mentors/${email}`);
            fetchMentors();
        } catch(e) { alert("Failed to delete"); }
    };

    const filtered = mentors.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.department.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold fs-3">Manage Mentors</h2>
                <Button variant="primary" onClick={() => setShowModal(true)}><FaPlus className="me-2" /> Add Mentor</Button>
            </div>

            <div className="glass-card mb-4 p-3">
                 <InputGroup style={{ maxWidth: 400 }}>
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                    <Form.Control placeholder="Search mentors..." value={search} onChange={e => setSearch(e.target.value)} />
                </InputGroup>
            </div>

            <Table hover responsive className="bg-white shadow-sm rounded">
                <thead className="bg-light">
                    <tr>
                        <th className="ps-3">Name</th>
                        <th>Department</th>
                        <th>Contact</th>
                        <th className="text-end pe-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(m => (
                        <tr key={m.id || m.email}>
                            <td className="ps-3 fw-bold">{m.name}</td>
                            <td><Badge bg="info" text="white">{m.department}</Badge></td>
                            <td>
                                <div className="small">{m.email}</div>
                                <div className="small text-muted">{m.phone}</div>
                            </td>
                            <td className="text-end pe-3">
                                <Button size="sm" variant="outline-primary" className="me-2" onClick={() => handleEdit(m)}><FaEdit /></Button>
                                <Button size="sm" variant="outline-danger" onClick={() => handleDelete(m.email)}><FaTrash /></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Add/Edit Mentor Modal */}
            <Modal show={showModal} onHide={() => { setShowModal(false); setEditEmail(null); setFormData({ name: '', email: '', phone: '', department: 'Computer Science', password: 'password123' }); }} size="lg">
                <Modal.Header closeButton><Modal.Title>{editEmail ? 'Edit Mentor' : 'Add New Mentor'}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row className="mb-3">
                            <Col md={6}><Form.Control placeholder="Full Name" name="name" value={formData.name} required onChange={handleInputChange} className="mb-3" /></Col>
                            <Col md={6}><Form.Control placeholder="Email" name="email" type="email" value={formData.email} disabled={!!editEmail} required onChange={handleInputChange} className="mb-3" /></Col>
                            <Col md={6}><Form.Control placeholder="Phone" name="phone" value={formData.phone} required onChange={handleInputChange} /></Col>
                            <Col md={6}>
                                <Form.Select name="department" onChange={handleInputChange} value={formData.department}>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </Form.Select>
                            </Col>
                        </Row>
                        {!editEmail && (
                        <Row>
                            <Col md={12}>
                                <Form.Label className="small">Default Password</Form.Label>
                                <Form.Control name="password" value={formData.password} onChange={handleInputChange} />
                            </Col>
                        </Row>
                        )}
                        <div className="text-end mt-4">
                            <Button variant="primary" type="submit">{editEmail ? 'Update Mentor' : 'Create Account'}</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AdminMentors;
