import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Row, Col, Button, Card, Form } from 'react-bootstrap';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { FaChartLine, FaDownload } from 'react-icons/fa';

const RiskAnalysis = () => {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/students');
                setStudents(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const downloadReport = async () => {
        try {
            const response = await axios.get('/api/export/risk-report', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Risk_Report.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
            alert('Failed to download report');
        }
    };

    // Prepare Data for Scatter Plot (Attendance vs Risk)
    const scatterData = students.map(s => ({
        x: s.attendancePercentage,
        y: s.riskScore,
        name: s.name,
        risk: s.riskLevel
    }));

    // Prepare Data for Factor Analysis
    const factorCounts = {};
    students.forEach(s => {
        s.riskFactors.forEach(factor => {
            factorCounts[factor] = (factorCounts[factor] || 0) + 1;
        });
    });
    const barData = Object.keys(factorCounts).map(key => ({
        name: key,
        count: factorCounts[key]
    })).sort((a,b) => b.count - a.count).slice(0, 5); // Top 5 factors

    return (
        <div className="fade-in">
            <h2 className="mb-4 fw-bold">Deep Risk Analysis</h2>
            
            <Row className="mb-4">
                <Col md={12}>
                    <div className="glass-card">
                        <h5 className="fw-bold mb-3">Attendance vs. Dropout Risk Correlation</h5>
                        <p className="text-muted mb-4">
                            This scatter plot reveals the strong negative correlation between attendance rates and AI-predicted risk scores. 
                            Students in the <span className="text-danger fw-bold">red zone</span> (High Risk) typically show distinct behavioral patterns.
                        </p>
                        <div style={{ height: 400 }}>
                            <ResponsiveContainer>
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" dataKey="x" name="Attendance" unit="%" label={{ value: 'Attendance %', position: 'insideBottomRight', offset: -10 }} />
                                    <YAxis type="number" dataKey="y" name="Risk Score" unit="" label={{ value: 'Risk Score', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Students" data={scatterData} fill="#4361EE" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <div className="glass-card h-100">
                        <h5 className="fw-bold mb-3">Top Risk Contributors</h5>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#F72585" radius={[0, 5, 5, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="glass-card h-100">
                        <h5 className="fw-bold mb-3">AI Model Insights</h5>
                        <ul className="list-group list-group-flush bg-transparent">
                            <li className="list-group-item bg-transparent">
                                <strong>Dominant Factor:</strong> Attendance is currently the #1 predictor of dropout risk in this cohort.
                            </li>
                            <li className="list-group-item bg-transparent">
                                <strong>Financial Impact:</strong> Students with fee delays &gt; 30 days are <span className="text-danger">3x more likely</span> to fall into the High Risk category.
                            </li>
                            <li className="list-group-item bg-transparent">
                                <strong>Academic Warning:</strong> A CGPA below 6.0 triggers 'Medium Risk' warnings even if attendance is perfect.
                            </li>
                        </ul>
                        <div className="mt-4 text-end">
                            <Button variant="outline-primary" size="sm" onClick={downloadReport}><FaDownload className="me-2" /> Download Analysis Report</Button>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default RiskAnalysis;
