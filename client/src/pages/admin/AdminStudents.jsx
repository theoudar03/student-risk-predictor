import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaPlus, FaTrash, FaEdit, FaRedo } from 'react-icons/fa';

const AdminStudents = () => {
    const [students, setStudents] = useState([]);
    const [mentors, setMentors] = useState([]); // Add this
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [globalProcessing, setGlobalProcessing] = useState(false);

    // Departments for selection (Alphabetical Order)
    const departments = ["AI&DS", "AIML", "CIVIL", "CSBS", "CSE", "ECE", "EEE", "ICE", "IT", "MBA", "MECH"];

    const [formData, setFormData] = useState({
        name: '', studentId: '', email: '', course: '', mentorId: '', 
        attendancePercentage: 75, cgpa: 7.5, feeDelayDays: 0, classParticipationScore: 5
    });

    const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });

    useEffect(() => {
        fetchStudents();
        fetchMentors();
        
        // Auto-refresh for async risk updates
        // We keep this, but it will respect current sort order
        const interval = setInterval(() => {
             // Only if not editing modal
             if (!showModal && !globalProcessing) fetchStudents();
        }, 5000);
        return () => clearInterval(interval);
    }, [sortConfig]); // Refetch when sort changes

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
            // Use Admin-specific endpoint with Backend Sorting
            const res = await axios.get(`/api/admin/students`, {
                params: {
                    sortBy: sortConfig.key,
                    sortOrder: sortConfig.direction
                }
            });
            setStudents(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
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

    const courseMentors = mentors.filter(m => m.department === formData.course);
    
    // Client-side Filter Only (Search)
    // Sorting is now 100% Backend
    const filteredStudents = students.filter(s => {
        const term = search.toLowerCase();
        return (
            (s.name || "").toLowerCase().includes(term) ||
            (s.studentId || "").toLowerCase().includes(term) ||
            (s.course || "").toLowerCase().includes(term)
        );
    });

    const handleRecalculateAll = async () => {
        if (!window.confirm("This will trigger risk recalculation for ALL students. Continue?")) return;
        
        setGlobalProcessing(true);
        try {
            // New Admin Endpoint
            const res = await axios.post('/api/admin/risk-recalculate');
            const { processed, durationMs } = res.data;
            alert(`✅ Batch Recalculation Complete!\n\nProcessed: ${processed} students\nTime: ${durationMs}ms`);
            
            // Force immediate refresh to show results
            fetchStudents(); 
        } catch (e) {
            console.error("Batch Failed:", e);
            alert("❌ Batch Recalculation Failed. Please try again.");
        } finally {
            setGlobalProcessing(false);
        }
    };

    const getRiskBadge = (s) => {
        const level = s.riskLevel || 'Low'; 
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                level === 'High' ? 'bg-red-100 text-red-800' : 
                level === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-green-100 text-green-800'
            }`}>
                {level}
            </span>
        );
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <span className="text-gray-300 ml-1 text-[10px]">↕</span>;
        return <span className="ml-1 text-blue-600 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="pb-8 animate-fade-in text-gray-800 relative">
            {globalProcessing && (
                <div className="fixed inset-0 w-full h-full flex justify-center items-center bg-white/80 backdrop-blur-sm z-[9999]">
                    <div className="text-center p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
                        <svg className="animate-spin text-blue-600 w-12 h-12 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <h5 className="font-bold text-xl text-gray-800 m-0 mb-2">Recalculating Risk Scores...</h5>
                        <p className="text-gray-500 m-0 text-sm">Please wait while we process all students.</p>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="font-bold text-2xl m-0">Manage Students</h2>
                <div className="flex gap-3 flex-wrap">
                    <button 
                        className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" 
                        onClick={handleRecalculateAll} 
                        disabled={globalProcessing}
                    >
                        <FaRedo className={`mr-2 ${globalProcessing ? 'animate-spin' : ''}`} /> 
                        {globalProcessing ? 'Processing...' : 'Recalculate All'}
                    </button>
                    <button 
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" 
                        onClick={() => setShowModal(true)} 
                        disabled={globalProcessing}
                    >
                        <FaPlus className="mr-2" /> Register Student
                    </button>
                </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center">
                 <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden w-full sm:flex-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <span className="flex items-center px-3 text-gray-400 bg-gray-50 border-r border-gray-200"><FaSearch /></span>
                    <input 
                        type="text" 
                        className="w-full px-3 py-2 outline-none border-none text-sm bg-white" 
                        placeholder="Search students..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                 <div className="text-gray-500 text-sm flex items-center whitespace-nowrap lg:ml-auto">
                    <span className="italic">Click table headers to sort</span>
                 </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-[700px] m-0">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="py-4 pl-6 pr-4 font-bold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center">Name / ID <SortIcon column="name" /></div>
                                </th>
                                <th className="py-4 px-4 font-bold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSort('course')}>
                                    <div className="flex items-center">Department <SortIcon column="course" /></div>
                                </th>
                                <th className="py-4 px-4 font-bold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSort('riskScore')}>
                                    <div className="flex items-center">Risk Level <SortIcon column="riskScore" /></div>
                                </th>
                                <th className="py-4 px-6 font-bold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStudents.length === 0 ? (
                                <tr><td colSpan="4" className="text-center p-12 text-gray-500">No students found.</td></tr>
                            ) : filteredStudents.map(s => (
                                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 pl-6 pr-4">
                                        <div className="font-bold text-gray-800">{s.name}</div>
                                        <div className="text-xs text-gray-500">{s.studentId}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold">{s.course}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {getRiskBadge(s)} <span className="text-gray-500 ml-2 text-xs">({s.riskScore ?? 0}%)</span>
                                    </td>
                                    <td className="py-3 px-6 text-right">
                                        <button 
                                            className="px-2.5 py-1.5 text-xs text-blue-600 border border-blue-600 rounded mr-2 hover:bg-blue-50 transition-colors focus:ring-2 focus:ring-blue-500 outline-none" 
                                            onClick={() => handleEdit(s)}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            className="px-2.5 py-1.5 text-xs text-red-600 border border-red-500 rounded hover:bg-red-50 transition-colors focus:ring-2 focus:ring-red-500 outline-none" 
                                            onClick={() => handleDelete(s._id)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Student Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 w-full h-full">
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 rounded-t-2xl">
                            <h3 className="text-lg font-bold text-gray-900 m-0">
                                {editId ? 'Edit Student' : 'Register New Student'}
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => { setShowModal(false); setEditId(null); setFormData({ name: '', studentId: '', email: '', course: '', mentorId: '', attendancePercentage: 75, cgpa: 7.5, feeDelayDays: 0, classParticipationScore: 5 }); }}
                                className="text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center transition-colors outline-none" 
                            >
                                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <input type="text" placeholder="Full Name" name="name" value={formData.name} required onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 transition-shadow" />
                                    </div>
                                    <div>
                                        <input type="text" placeholder="Student ID" name="studentId" value={formData.studentId} disabled={!!editId} required onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <input type="email" placeholder="Email" name="email" value={formData.email} required onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 transition-shadow" />
                                    </div>
                                    <div>
                                        <select name="course" onChange={handleInputChange} value={formData.course} required className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 transition-shadow appearance-none">
                                            <option value="">Select Course</option>
                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Assign Mentor (Required)</label>
                                    <select 
                                        name="mentorId" 
                                        value={formData.mentorId} 
                                        onChange={handleInputChange} 
                                        required 
                                        disabled={!formData.course}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 transition-shadow appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="">{formData.course ? "Select Mentor" : "Select Course First"}</option>
                                        {courseMentors.length > 0 ? (
                                            courseMentors.map(m => (
                                                <option key={m.mentorId} value={m.mentorId}>{m.name} ({m.mentorId})</option>
                                            ))
                                        ) : (
                                            formData.course && <option disabled>No mentors available for {formData.course}</option>
                                        )}
                                    </select>
                                </div>
                                
                                <h6 className="font-bold text-gray-800 text-sm mb-3 pb-2 border-b border-gray-100">Initial Metrics</h6>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                     <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Attendance %</label>
                                        <input type="number" name="attendancePercentage" value={formData.attendancePercentage} required onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 transition-shadow" />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">CGPA</label>
                                        <input type="number" step="0.1" name="cgpa" value={formData.cgpa} required onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 transition-shadow" />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Fee Delay Days</label>
                                        <input type="number" name="feeDelayDays" value={formData.feeDelayDays} onChange={handleInputChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 transition-shadow" />
                                     </div>
                                </div>
                                <div className="text-right mt-8 pt-4 border-t border-gray-100">
                                    <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        {editId ? 'Update Changes' : 'Register Student'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStudents;
