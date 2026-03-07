import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaDownload } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Students = () => {
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

    const filtered = students.filter(s => {
        const name = s.name || '';
        const matchSearch = name.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filterRisk === 'All' || s.riskLevel === filterRisk;
        return matchSearch && matchFilter;
    });

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Data...</div>;
    if (error) return (
      <div className="p-12 text-center text-red-600">
        Error: {error} <br/> 
        <button className="mt-4 px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors" onClick={fetchStudents}>Retry</button>
      </div>
    );

    return (
        <div className="animate-fade-in opacity-100">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="font-bold text-2xl text-gray-800 m-0">My Students</h2>
                <div className="flex gap-2">
                    <button 
                      className={`flex items-center px-3 py-1.5 border border-gray-800 text-gray-800 rounded text-sm transition-colors ${students.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                      onClick={exportCSV} 
                      disabled={students.length === 0}
                    >
                        <FaDownload className="mr-2" /> Export Report
                    </button>
                </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 mb-6 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex bg-white border border-gray-300 rounded-md overflow-hidden flex-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <span className="flex items-center px-3 text-gray-500 bg-white">
                            <FaSearch />
                        </span>
                        <input 
                          type="text" 
                          placeholder="Search by name..." 
                          className="w-full py-2 pr-3 outline-none border-none text-sm bg-white" 
                          value={search} 
                          onChange={(e) => setSearch(e.target.value)} 
                        />
                    </div>
                    <select 
                      className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-48" 
                      value={filterRisk} 
                      onChange={(e) => setFilterRisk(e.target.value)}
                    >
                        <option value="All">All Risks</option>
                        <option value="High">High Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="Low">Low Risk</option>
                    </select>
                </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-0 overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="py-4 pl-6 pr-4 font-semibold text-gray-600 uppercase tracking-wider text-xs sticky left-0 bg-gray-50 z-10">Student</th>
                                <th className="py-4 px-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Course</th>
                                <th className="py-4 px-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Contact</th>
                                <th className="py-4 px-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Performance</th>
                                <th className="py-4 px-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Risk Analysis</th>
                                <th className="py-4 px-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Status</th>
                                <th className="py-4 px-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Profile</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center p-10 text-gray-500">No students found assigned to your department.</td>
                                </tr>
                            ) : filtered.map(s => (
                                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 pl-6 pr-4 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-50">
                                        <div className="font-bold text-gray-800">{s.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{s.studentId}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="inline-block px-2 text-xs py-1 bg-gray-100 text-gray-800 border border-gray-200 rounded">{s.course || '-'}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-xs text-gray-600">{s.email}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{s.feeDelayDays > 0 ? `${s.feeDelayDays}d Fee Delay` : 'Fees Paid'}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-xs text-gray-600">Attendance: <strong className="text-gray-800">{s.attendancePercentage}%</strong></div>
                                        <div className="text-xs text-gray-600 mt-0.5">CGPA: <strong className="text-gray-800">{s.cgpa}</strong></div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center text-sm">
                                           <div className={`w-2 h-2 rounded-full mr-2 ${s.riskScore > 70 ? 'bg-red-600' : s.riskScore > 35 ? 'bg-orange-500' : 'bg-green-500'}`} />
                                           <span className="font-bold text-gray-800">{s.riskScore}/100</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5 max-w-[150px] truncate">
                                            {s.riskFactors?.[0] || 'None'}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                            (s.riskLevel || 'Low').toLowerCase() === 'high' ? 'bg-pink-100 text-pink-600 border-pink-200' :
                                            (s.riskLevel || 'Low').toLowerCase() === 'medium' ? 'bg-amber-100 text-orange-500 border-amber-200' :
                                            'bg-green-100 text-green-600 border-green-200'
                                        }`}>
                                            {s.riskLevel || 'Low'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <Link to={`/mentor/students/${s._id}`} className="inline-block px-3 py-1 text-xs border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Students;
