import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Badge, Form, Row, Col } from 'react-bootstrap';
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaSave, FaSearch, FaDownload } from 'react-icons/fa';

const Attendance = () => {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    // Mock daily attendance state: { studentId: 'Present' | 'Absent' }
    const [attendanceState, setAttendanceState] = useState({});

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/students`);
            setStudents(res.data);
            // Initialize mock attendance based on their average
            const initial = {};
            res.data.forEach(s => {
                // Randomly assign present/absent weighted by their attendance %
                const isPresent = Math.random() * 100 < s.attendancePercentage;
                initial[s._id] = isPresent ? 'Present' : 'Absent';
            });
            setAttendanceState(initial);
        } catch (err) { console.error(err); }
    };

    const toggleStatus = (id) => {
        setAttendanceState(prev => ({
            ...prev,
            [id]: prev[id] === 'Present' ? 'Absent' : 'Present'
        }));
    };
    
    // Download Handler
    const downloadAttendance = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/export/attendance?date=${currentDate}`, {
                responseType: 'blob', // Important for file handling
            });
            
            // Create Blob URL
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Attendance_${currentDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to download attendance record");
        }
    };

    const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fade-in">
             <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold fs-3">Attendance Registry</h2>
                <div className="d-flex gap-3 align-items-center">
                    <Form.Control type="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} style={{width: 160}} />
                    <Button variant="success" onClick={downloadAttendance}><FaDownload className="me-2" /> Export Excel</Button>
                    <Button variant="primary"><FaSave className="me-2" /> Save Records</Button>
                </div>
            </div>

            <div className="glass-card mb-4">
                 <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold m-0 text-uppercase text-muted">Daily Log for {new Date(currentDate).toLocaleDateString()}</h6>
                    <div style={{width: 300}}>
                        <Form.Control placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                 </div>

                 <Table responsive hover className="align-middle mb-0">
                     <thead className="table-light">
                         <tr>
                             <th>Student Name</th>
                             <th>ID</th>
                             <th className="text-center">Overall Avg</th>
                             <th className="text-center">Today's Status</th>
                             <th className="text-end">Action</th>
                         </tr>
                     </thead>
                     <tbody>
                         {filtered.map(s => (
                             <tr key={s._id}>
                                 <td className="fw-bold">{s.name}</td>
                                 <td className="text-muted small">{s.studentId}</td>
                                 <td className="text-center">
                                     <Badge bg={s.attendancePercentage < 75 ? 'danger' : 'success'}>
                                         {s.attendancePercentage}%
                                     </Badge>
                                 </td>
                                 <td className="text-center">
                                     {attendanceState[s._id] === 'Present' ? (
                                         <Badge bg="success" className="px-3 py-2 fw-normal"><FaCheckCircle className="me-1" /> Present</Badge>
                                     ) : (
                                         <Badge bg="danger" className="px-3 py-2 fw-normal"><FaTimesCircle className="me-1" /> Absent</Badge>
                                     )}
                                 </td>
                                 <td className="text-end">
                                     <Button 
                                        variant={attendanceState[s._id] === 'Present' ? "outline-danger" : "outline-success"} 
                                        size="sm"
                                        onClick={() => toggleStatus(s._id)}
                                     >
                                         Mark {attendanceState[s._id] === 'Present' ? 'Absent' : 'Present'}
                                     </Button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </Table>
            </div>
            
            <Row>
                <Col md={4}>
                    <div className="glass-card text-center">
                        <h6 className="text-muted mb-2">Total Present</h6>
                        <h3 className="text-success fw-bold">
                            {Object.values(attendanceState).filter(v => v === 'Present').length}
                        </h3>
                    </div>
                </Col>
                 <Col md={4}>
                    <div className="glass-card text-center">
                        <h6 className="text-muted mb-2">Total Absent</h6>
                        <h3 className="text-danger fw-bold">
                            {Object.values(attendanceState).filter(v => v === 'Absent').length}
                        </h3>
                    </div>
                </Col>
                 <Col md={4}>
                    <div className="glass-card text-center">
                        <h6 className="text-muted mb-2">Daily Attendance Rate</h6>
                        <h3 className="text-primary fw-bold">
                            {filtered.length > 0 
                                ? Math.round((Object.values(attendanceState).filter(v => v === 'Present').length / filtered.length) * 100) 
                                : 0}%
                        </h3>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default Attendance;
