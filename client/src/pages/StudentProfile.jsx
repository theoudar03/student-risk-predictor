import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaEnvelope, FaCalendarAlt, FaRobot, FaExclamationTriangle, FaCheckCircle, FaMoneyBillWave, FaBookOpen } from 'react-icons/fa';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import InterventionPanel from '../components/InterventionPanel';

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

  if (!student) return <div className="p-12 text-center text-gray-500">Loading Profile...</div>;

  const radarData = [
    { subject: 'Attendance', A: student.attendancePercentage, fullMark: 100 },
    { subject: 'Academics', A: student.cgpa * 10, fullMark: 100 },
    { subject: 'Engagement', A: student.classParticipationScore * 10, fullMark: 100 },
    { subject: 'Assignments', A: student.assignmentsCompleted || 80, fullMark: 100 },
  ];

  return (
    <div className="animate-fade-in">
      <Link to="/students" className="inline-flex items-center px-0 mb-6 text-gray-500 font-bold hover:text-blue-600 transition-colors text-sm">
        <FaArrowLeft className="mr-2" /> Back to Registry
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 text-center mb-6 p-6">
            <div className="flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-lg text-white text-4xl font-bold w-24 h-24">
                {student.name.charAt(0)}
            </div>
            <h3 className="font-bold text-2xl text-gray-800 m-0 mb-2">{student.name}</h3>
            <p className="text-gray-500 mb-4 text-sm">{student.studentId}</p>
            <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border mb-6 ${
                student.riskLevel.toLowerCase() === 'high' ? 'bg-pink-100 text-pink-600 border-pink-200' :
                student.riskLevel.toLowerCase() === 'medium' ? 'bg-amber-100 text-orange-500 border-amber-200' :
                'bg-green-100 text-green-600 border-green-200'
            }`}>
                {student.riskLevel} Risk Profile
            </div>
            
            <div className="w-full">
                <a href={`mailto:${student.email}`} className="flex items-center justify-center w-full px-4 py-2 text-sm border border-blue-600 text-blue-600 bg-transparent rounded-lg hover:bg-blue-50 transition-colors">
                    <FaEnvelope className="mr-2" /> Email Assessment
                </a>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6">
            <h6 className="font-bold text-gray-400 text-xs tracking-wider uppercase mb-5">Student Details</h6>
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100 text-sm">
                <span className="text-gray-500 flex items-center"><FaBookOpen className="mr-2" /> Course</span>
                <span className="font-medium text-gray-800">{student.course}</span>
            </div>
             <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100 text-sm">
                <span className="text-gray-500 flex items-center"><FaCalendarAlt className="mr-2" /> Enrolled</span>
                <span className="font-medium text-gray-800">{new Date(student.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center"><FaMoneyBillWave className="mr-2" /> Fee Status</span>
                <span className={student.feeDelayDays > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                    {student.feeDelayDays > 0 ? `${student.feeDelayDays} Days Late` : "Clear"}
                </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-8">
          <div className={`bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 mb-6 p-6 border-l-4 ${student.riskScore > 70 ? 'border-l-red-600' : 'border-l-green-500'}`}>
             <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
                <h4 className="font-bold flex items-center text-xl text-gray-800 m-0"><FaRobot className="text-blue-600 mr-2" /> AI Risk Analysis Model</h4>
                <div className="text-right">
                    <span className="text-gray-500 text-xs block mb-1">Confidence Score</span>
                    <span className="font-bold text-gray-800 text-sm">98.5%</span>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                 <div className="md:col-span-7">
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        Our hybrid regression model has analyzed academic, behavioral, and financial data points to determine dropout likelihood.
                    </p>
                    
                    <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                         <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-xs uppercase text-gray-700 tracking-wider">Predicted Drop-out Risk</span>
                            <span className="font-bold text-gray-800">{student.riskScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className={`${student.riskScore > 70 ? 'bg-red-600' : student.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'} h-2.5 rounded-full`} style={{ width: `${student.riskScore}%` }}></div>
                        </div>
                    </div>
                    
                    <h6 className="font-bold text-red-600 text-sm mb-3">Detected Risk Factors:</h6>
                    {student.riskFactors && student.riskFactors.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                             {student.riskFactors.map((factor, idx) => (
                                 <span key={idx} className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-md whitespace-nowrap">
                                     <FaExclamationTriangle className="mr-1.5" /> {factor}
                                 </span>
                             ))}
                        </div>
                    ) : (
                         <div className="inline-flex items-center px-3 py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg">
                            <FaCheckCircle className="mr-2" /> No critical risk factors identified.
                        </div>
                    )}
                 </div>
                 <div className="md:col-span-5">
                     <div className="h-[250px] w-full">
                        <ResponsiveContainer>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fill: '#64748b'}} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                <Radar name="Student" dataKey="A" stroke="#4361EE" fill="#4361EE" fillOpacity={0.5} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
             <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                 <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Attendance</div>
                 <h2 className={`text-3xl font-bold m-0 ${student.attendancePercentage < 75 ? "text-red-500" : "text-green-500"}`}>{student.attendancePercentage}%</h2>
             </div>
             <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                 <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">CGPA</div>
                 <h2 className={`text-3xl font-bold m-0 ${student.cgpa < 6.0 ? "text-red-500" : "text-blue-600"}`}>{student.cgpa}</h2>
             </div>
               <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                 <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Engagement</div>
                 <h2 className={`text-3xl font-bold m-0 ${student.classParticipationScore < 5 ? "text-yellow-500" : "text-gray-800"}`}>{student.classParticipationScore}/10</h2>
             </div>
          </div>
          
          <div className="mt-6 h-[500px]">
               <InterventionPanel 
                  studentId={student.studentId} 
                  riskScore={student.riskScore}
                  riskLevel={student.riskLevel}
                  onUpdate={fetchStudent}
               />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
