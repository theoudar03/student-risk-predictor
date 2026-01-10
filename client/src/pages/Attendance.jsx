import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Badge, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaSave, FaDownload, FaLock } from 'react-icons/fa';

const Attendance = () => {
    // FIX: Use Local Date instead of UTC
    const getLocalDate = () => {
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [currentDate, setCurrentDate] = useState(getLocalDate());
    const [attendanceState, setAttendanceState] = useState({}); // { studentId: 'Present' | 'Absent' }
    const [isFrozen, setIsFrozen] = useState(false); // Read-only mode
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [noRecords, setNoRecords] = useState(false);

    useEffect(() => {
        if (new Date(currentDate) < new Date('2026-01-01')) {
            setMsg({ type: 'warning', text: 'Attendance system valid only from Jan 1, 2026.' });
            setNoRecords(true);
            setStudents([]);
            return;
        }
        loadData();
    }, [currentDate]);

    const loadData = async () => {
        setLoading(true);
        setMsg(null);
        setNoRecords(false);
        try {
            // 1. Check if attendance exists for this date
            const checkRes = await axios.get(`/api/attendance/check/${currentDate}`);
            const isSubmitted = checkRes.data.submitted;

            if (isSubmitted) {
                // 2. Load History Mode
                setIsFrozen(true);
                const recordRes = await axios.get(`/api/attendance/${currentDate}`);
                const history = recordRes.data;
                
                // Map history to UI state
                const mappedState = {};
                const studentList = history.map(r => {
                    mappedState[r.studentId] = r.status;
                    // FIX: Use stored studentRollId if available, fallback to legacy checks if needed
                    return { 
                        _id: r.studentId, 
                        name: r.studentName, 
                        studentId: r.studentRollId || "N/A" // Use the saved readable ID
                    }; 
                });

                setStudents(studentList);
                setAttendanceState(mappedState);
                setMsg({ type: 'info', text: 'Viewing historical record. Data is frozen.' });
            } else {
                // 3. Marking Mode (only allowed for Today)
                const today = getLocalDate(); // Consistent Local Date
                if (currentDate === today) {
                    setIsFrozen(false);
                    const studentRes = await axios.get(`/api/students`); // Already filtered by Dep
                    setStudents(studentRes.data);
                    
                    // Default to Present
                    const initial = {};
                    studentRes.data.forEach(s => initial[s._id] = 'Present');
                    setAttendanceState(initial);
                } else {
                    // 4. Future/Past with no record
                    setNoRecords(true);
                    setStudents([]);
                }
            }
        } catch (err) {
            console.error(err);
            setMsg({ type: 'danger', text: 'Failed to load data.' });
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (id) => {
        if (isFrozen) return;
        setAttendanceState(prev => ({
            ...prev,
            [id]: prev[id] === 'Present' ? 'Absent' : 'Present'
        }));
    };
    
    const saveAttendance = async () => {
        if (!window.confirm("Are you sure? Once saved, attendance cannot be changed for today.")) return;
        
        try {
            const payload = {
                date: currentDate,
                records: students.map(s => ({
                    studentId: s._id,     // System ID (ObjectId)
                    studentRollId: s.studentId, // Readable ID (e.g., S2024...)
                    name: s.name,
                    status: attendanceState[s._id]
                }))
            };

            await axios.post('/api/attendance', payload);
            setMsg({ type: 'success', text: 'Attendance submitted successfully!' });
            setIsFrozen(true); // Immediate Freeze
            
            // Trigger instant update in TopBar
            window.dispatchEvent(new Event('attendanceUpdated'));

        } catch (err) {
            console.error(err);
            setMsg({ type: 'danger', text: 'Failed to save attendance.' });
        }
    };

    // Download Handler
    const downloadAttendance = async () => {
        try {
            const response = await axios.get(`/api/export/attendance?date=${currentDate}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Attendance_${currentDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("No spreadsheet available for this date");
        }
    };

    const filtered = students.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));

    const stats = {
        present: Object.values(attendanceState).filter(v => v === 'Present').length,
        absent: Object.values(attendanceState).filter(v => v === 'Absent').length,
        total: students.length
    };

    return (
        <div className="fade-in">
             <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <h2 className="fw-bold fs-3 mb-0">Attendance Registry</h2>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    <Form.Control 
                        type="date" 
                        value={currentDate} 
                        min="2026-01-01"
                        onChange={(e) => setCurrentDate(e.target.value)} 
                        style={{width: 'auto', minWidth: 140}} 
                    />
                    <Button variant="outline-success" onClick={downloadAttendance} disabled={!isFrozen && !noRecords} size="sm">
                        <FaDownload className="me-2" /> Export
                    </Button>
                    {!isFrozen && !noRecords && (
                        <Button variant="primary" onClick={saveAttendance} size="sm">
                            <FaSave className="me-2" /> Save Records
                        </Button>
                    )}
                </div>
            </div>

            {msg && <Alert variant={msg.type} className="shadow-sm">{msg.text}</Alert>}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : noRecords ? (
                <div className="text-center py-5 glass-card text-muted">
                    <FaCalendarAlt size={40} className="mb-3 opacity-50"/>
                    <h5>No Attendance Records Available</h5>
                    <p>Attendance was not marked for {currentDate}.</p>
                </div>
            ) : (
                <>
                <div className="glass-card mb-4">
                     <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                        <h6 className="fw-bold m-0 text-uppercase text-muted">
                            {isFrozen ? <><FaLock className="me-2"/> Finalized Record</> : "Marking Attendance"} : {new Date(currentDate).toLocaleDateString()}
                        </h6>
                        <div style={{width: '100%', maxWidth: 300}}>
                            <Form.Control placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                     </div>

                     <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                     <Table responsive hover className="align-middle mb-0">
                         <thead className="table-light sticky-top">
                             <tr>
                                 <th>Student Name</th>
                                 <th>ID</th>
                                 <th className="text-center">Status</th>
                                 <th className="text-end">Action</th>
                             </tr>
                         </thead>
                         <tbody>
                             {filtered.map(s => (
                                 <tr key={s._id}>
                                     <td className="fw-bold">{s.name}</td>
                                     <td className="text-muted small">{s.studentId}</td>
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
                                            disabled={isFrozen}
                                            onClick={() => toggleStatus(s._id)}
                                         >
                                             {isFrozen ? "Locked" : `Mark ${attendanceState[s._id] === 'Present' ? 'Absent' : 'Present'}`}
                                         </Button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </Table>
                     </div>
                </div>
                
                <Row className="g-3">
                    <Col xs={12} md={4}>
                        <div className="glass-card text-center">
                            <h6 className="text-muted mb-2">Total Present</h6>
                            <h3 className="text-success fw-bold">{stats.present}</h3>
                        </div>
                    </Col>
                     <Col xs={12} md={4}>
                        <div className="glass-card text-center">
                            <h6 className="text-muted mb-2">Total Absent</h6>
                            <h3 className="text-danger fw-bold">{stats.absent}</h3>
                        </div>
                    </Col>
                     <Col xs={12} md={4}>
                        <div className="glass-card text-center">
                            <h6 className="text-muted mb-2">Daily Rate</h6>
                            <h3 className="text-primary fw-bold">
                                {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                            </h3>
                        </div>
                    </Col>
                </Row>
                </>
            )}
        </div>
    );
};

export default Attendance;
