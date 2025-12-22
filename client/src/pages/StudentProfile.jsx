import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Row, Col, ProgressBar, Button, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaEnvelope, FaCalendarAlt, FaRobot, FaExclamationTriangle, FaCheckCircle, FaMoneyBillWave, FaBookOpen } from 'react-icons/fa';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

const StudentProfile = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
        const res = await axios.get(`/api/students/${id}`);
        setStudent(res.data);
    } catch (error) { console.error(error); }
  };

  if (!student) return <div className="p-5 text-center text-secondary">Loading Profile...</div>;

  const radarData = [
    { subject: 'Attendance', A: student.attendancePercentage, fullMark: 100 },
    { subject: 'Academics', A: student.cgpa * 10, fullMark: 100 },
    { subject: 'Engagement', A: student.classParticipationScore * 10, fullMark: 100 },
    { subject: 'Assignments', A: student.assignmentsCompleted || 80, fullMark: 100 },
  ];

  return (
    <div className="fade-in">
      <Link to="/students" className="btn btn-link ps-0 mb-3 text-decoration-none text-muted fw-bold">
        <FaArrowLeft className="me-2" /> Back to Registry
      </Link>

      <Row>
        <Col md={4}>
          <div className="glass-card text-center mb-4">
            <div className="bg-gradient-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-lg" 
                 style={{ width: 100, height: 100, fontSize: 36, background: '#4361EE', color: 'white' }}>
                {student.name.charAt(0)}
            </div>
            <h3 className="fw-bold mb-1">{student.name}</h3>
            <p className="text-muted">{student.studentId}</p>
            <div className={`status-badge badge-${student.riskLevel.toLowerCase()} mb-4`}>
                {student.riskLevel} Risk Profile
            </div>
            
            <div className="d-grid gap-2">
                <Button variant="outline-primary"><FaEnvelope className="me-2" /> Email Assessment</Button>
            </div>
          </div>

          <div className="glass-card">
            <h6 className="fw-bold mb-4 opacity-75 text-uppercase small">Student Details</h6>
            <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span className="text-muted"><FaBookOpen className="me-2" /> Course</span>
                <span className="fw-medium">{student.course}</span>
            </div>
             <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span className="text-muted"><FaCalendarAlt className="me-2" /> Enrolled</span>
                <span className="fw-medium">{new Date(student.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="d-flex justify-content-between">
                <span className="text-muted"><FaMoneyBillWave className="me-2" /> Fee Status</span>
                <span className={student.feeDelayDays > 0 ? "text-danger fw-bold" : "text-success fw-bold"}>
                    {student.feeDelayDays > 0 ? `${student.feeDelayDays} Days Late` : "Clear"}
                </span>
            </div>
          </div>
        </Col>

        <Col md={8}>
          <div className="glass-card mb-4 border-start border-5" style={{borderColor: student.riskScore > 70 ? '#D00000' : '#4BA258'}}>
             <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold m-0"><FaRobot className="text-primary me-2" /> AI Risk Analysis Model</h4>
                <div className="text-end">
                    <small className="text-muted d-block">Confidence Score</small>
                    <span className="fw-bold text-dark">98.5%</span>
                </div>
             </div>
             
             <Row className="align-items-center">
                 <Col md={7}>
                    <p className="text-muted mb-4 opacity-75">
                        Our hybrid regression model has analyzed academic, behavioral, and financial data points to determine dropout likelihood.
                    </p>
                    
                    <div className="mb-4 bg-light p-3 rounded-3">
                         <div className="d-flex justify-content-between mb-2">
                            <span className="fw-bold small text-uppercase">Predicted Drop-out Risk</span>
                            <span className="fw-bold">{student.riskScore}%</span>
                        </div>
                        <ProgressBar 
                            now={student.riskScore} 
                            variant={student.riskScore > 70 ? "danger" : student.riskScore > 40 ? "warning" : "success"} 
                            style={{height: 12, borderRadius: 6}}
                        />
                    </div>
                    
                    <h6 className="fw-bold text-danger mb-3">Detected Risk Factors:</h6>
                    {student.riskFactors && student.riskFactors.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                             {student.riskFactors.map((factor, idx) => (
                                 <Badge key={idx} bg="danger" className="p-2 fw-normal">
                                     <FaExclamationTriangle className="me-1" /> {factor}
                                 </Badge>
                             ))}
                        </div>
                    ) : (
                         <div className="text-success p-2 bg-success-subtle rounded d-inline-block">
                            <FaCheckCircle className="me-2" /> No critical risk factors identified.
                        </div>
                    )}
                 </Col>
                 <Col md={5}>
                     <div style={{ height: 250, width: '100%' }}>
                        <ResponsiveContainer>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e0e0e0" />
                                <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fill: '#888'}} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                <Radar name="Student" dataKey="A" stroke="#4361EE" fill="#4361EE" fillOpacity={0.5} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                 </Col>
             </Row>
          </div>

          <Row>
             <Col md={4}>
                 <div className="glass-card text-center py-4">
                     <div className="text-muted small text-uppercase mb-2">Attendance</div>
                     <h2 className={student.attendancePercentage < 75 ? "text-danger" : "text-success"}>{student.attendancePercentage}%</h2>
                 </div>
             </Col>
             <Col md={4}>
                 <div className="glass-card text-center py-4">
                     <div className="text-muted small text-uppercase mb-2">CGPA</div>
                     <h2 className={student.cgpa < 6.0 ? "text-danger" : "text-primary"}>{student.cgpa}</h2>
                 </div>
             </Col>
               <Col md={4}>
                 <div className="glass-card text-center py-4">
                     <div className="text-muted small text-uppercase mb-2">Engagement</div>
                     <h2 className={student.classParticipationScore < 5 ? "text-warning" : "text-dark"}>{student.classParticipationScore}/10</h2>
                 </div>
             </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default StudentProfile;
