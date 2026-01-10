import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, InputGroup, Form } from 'react-bootstrap';
import { FaSearch, FaDownload } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Students = () => {
    // 1. Initial Logic
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterRisk, setFilterRisk] = useState('All');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {

            const res = await axios.get(`/api/students`);
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
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <h2 className="fw-bold fs-3 mb-0">My Students</h2>
                <div className="d-flex gap-2">
                    <Button variant="outline-dark" onClick={exportCSV} disabled={students.length === 0} size="sm"><FaDownload className="me-2" /> Export Report</Button>
                </div>
            </div>

            <div className="glass-card mb-4" style={{padding: 15}}>
                <div className="d-flex flex-wrap gap-3">
                    <InputGroup style={{ width: '100%', maxWidth: 350, flex: '1 1 250px' }}>
                        <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-secondary" /></InputGroup.Text>
                        <Form.Control type="text" placeholder="Search by name..." className="border-start-0 ps-0 shadow-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </InputGroup>
                    <Form.Select style={{width: '100%', maxWidth: 200, flex: '1 1 150px'}} value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
                        <option value="All">All Risks</option>
                        <option value="High">High Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="Low">Low Risk</option>
                    </Form.Select>
                </div>
            </div>

            <div className="glass-card p-0">
                <div className="table-responsive">
                    <Table hover className="mb-0 text-nowrap" style={{ minWidth: 800 }}>
                    <thead style={{background: '#f8f9fa'}}>
                        <tr>
                            <th className="ps-4 sticky-col">Student</th>
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
                                <td colSpan="7" className="text-center p-5 text-muted">No students found assigned to your department.</td>
                            </tr>
                        ) : filtered.map(s => (
                            <tr key={s._id}>
                                <td className="ps-4 sticky-col">
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
                                <td><Link to={`/mentor/students/${s._id}`} className="btn btn-sm btn-outline-primary">View</Link></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                </div>
            </div>
        </div>
    );
};

export default Students;
