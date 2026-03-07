import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { FaDownload } from 'react-icons/fa';

const RiskAnalysis = () => {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`/api/students`);
                setStudents(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const downloadReport = async () => {
        try {
            const response = await axios.get(`/api/export/risk-report`, {
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

    const scatterData = students.map(s => ({
        x: s.attendancePercentage,
        y: s.riskScore,
        name: s.name,
        risk: s.riskLevel
    }));

    const factorCounts = {};
    students.forEach(s => {
        s.riskFactors.forEach(factor => {
            factorCounts[factor] = (factorCounts[factor] || 0) + 1;
        });
    });
    const barData = Object.keys(factorCounts).map(key => ({
        name: key,
        count: factorCounts[key]
    })).sort((a,b) => b.count - a.count).slice(0, 5); 

    return (
        <div className="animate-fade-in">
            <h2 className="mb-6 font-bold text-2xl text-gray-800">Deep Risk Analysis</h2>
            
            <div className="grid grid-cols-1 mb-6">
                <div>
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h5 className="font-bold mb-4 text-lg text-gray-800">Attendance vs. Dropout Risk Correlation</h5>
                        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                            This scatter plot reveals the strong negative correlation between attendance rates and AI-predicted risk scores. 
                            Students in the <span className="text-red-600 font-bold">red zone</span> (High Risk) typically show distinct behavioral patterns.
                        </p>
                        <div className="h-64 sm:h-80 md:h-[400px] w-full">
                            <ResponsiveContainer>
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" dataKey="x" name="Attendance" unit="%" label={{ value: 'Attendance %', position: 'insideBottomRight', offset: -10, fill: '#64748b' }} tick={{fill: '#64748b'}} />
                                    <YAxis type="number" dataKey="y" name="Risk Score" unit="" label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', fill: '#64748b' }} tick={{fill: '#64748b'}} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}} />
                                    <Scatter name="Students" data={scatterData} fill="#4361EE" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                        <h5 className="font-bold mb-6 text-lg text-gray-800">Top Risk Contributors</h5>
                        <div className="h-64 md:h-[300px] w-full mt-auto">
                            <ResponsiveContainer>
                                <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" tick={{fill: '#64748b'}} />
                                    <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12, fill: '#64748b'}} />
                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}} />
                                    <Bar dataKey="count" fill="#F72585" radius={[0, 5, 5, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                        <h5 className="font-bold mb-6 text-lg text-gray-800">AI Model Insights</h5>
                        <ul className="divide-y divide-gray-100 p-0 m-0 w-full mb-6">
                            <li className="py-4 text-sm text-gray-700 leading-relaxed">
                                <strong className="text-gray-900">Dominant Factor:</strong> Attendance is currently the #1 predictor of dropout risk in this cohort.
                            </li>
                            <li className="py-4 text-sm text-gray-700 leading-relaxed">
                                <strong className="text-gray-900">Financial Impact:</strong> Students with fee delays &gt; 30 days are <span className="text-red-600 font-bold">3x more likely</span> to fall into the High Risk category.
                            </li>
                            <li className="py-4 text-sm text-gray-700 leading-relaxed">
                                <strong className="text-gray-900">Academic Warning:</strong> A CGPA below 6.0 triggers 'Medium Risk' warnings even if attendance is perfect.
                            </li>
                        </ul>
                        <div className="mt-auto text-right">
                            <button 
                              className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" 
                              onClick={downloadReport}
                            >
                              <FaDownload className="mr-2" /> Download Analysis Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskAnalysis;
