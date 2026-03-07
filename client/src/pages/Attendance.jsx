import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
    const [quickAbsentInput, setQuickAbsentInput] = useState('');

    const handleQuickAbsent = () => {
        if (!quickAbsentInput.trim() || isFrozen) return;

        const inputs = quickAbsentInput.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
        let updatedCount = 0;
        let notFound = [];
        let alreadyAbsent = [];

        setAttendanceState(prev => {
            const newState = { ...prev };
            inputs.forEach(inputVal => {
                const student = students.find(s => 
                    s.studentId && (s.studentId.toUpperCase() === inputVal.toUpperCase() || s.studentId.toUpperCase().endsWith(inputVal.toUpperCase()))
                );

                if (!student) {
                    notFound.push(inputVal);
                } else if (newState[student._id] === 'Absent') {
                    alreadyAbsent.push(inputVal);
                } else {
                    newState[student._id] = 'Absent';
                    updatedCount++;
                }
            });
            return newState;
        });

        if (notFound.length > 0) {
            setMsg({ type: 'danger', text: `ID(s) not found: ${notFound.join(', ')}` });
            setTimeout(() => setMsg(null), 5000);
        } else if (alreadyAbsent.length > 0 && updatedCount === 0) {
            setMsg({ type: 'warning', text: `Already marked absent: ${alreadyAbsent.join(', ')}` });
            setTimeout(() => setMsg(null), 4000);
        } else if (updatedCount > 0) {
            setMsg({ type: 'success', text: `Quick mark: ${updatedCount} student(s) absent.` });
            setQuickAbsentInput('');
            setTimeout(() => setMsg(null), 3000);
        }
    };

    const handleQuickAbsentKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleQuickAbsent();
        }
    };

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
                    return { 
                        _id: r.studentId, 
                        name: r.studentName, 
                        studentId: r.studentRollId || "N/A"
                    }; 
                }).sort((a, b) => a.name.localeCompare(b.name));

                setStudents(studentList);
                setAttendanceState(mappedState);
                setMsg({ type: 'info', text: 'Viewing historical record. Data is frozen.' });
            } else {
                // 3. Marking Mode (only allowed for Today)
                const today = getLocalDate(); 
                if (currentDate === today) {
                    setIsFrozen(false);
                    const studentRes = await axios.get(`/api/students`); 
                    const sortedStudents = studentRes.data.sort((a, b) => a.name.localeCompare(b.name));
                    setStudents(sortedStudents);
                    
                    // Default to Present
                    const initial = {};
                    sortedStudents.forEach(s => initial[s._id] = 'Present');
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
        <div className="animate-fade-in pb-8">
             <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="font-bold text-2xl text-gray-800 m-0">Attendance Registry</h2>
                <div className="flex flex-wrap gap-3 items-center">
                    <input 
                        type="date" 
                        value={currentDate} 
                        min="2026-01-01"
                        onChange={(e) => setCurrentDate(e.target.value)} 
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        style={{width: 'auto', minWidth: 140}} 
                    />
                    <button 
                        className={`inline-flex items-center px-4 py-2 border border-green-600 text-green-600 rounded-lg text-sm font-medium transition-colors ${(!isFrozen && !noRecords) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1'}`}
                        onClick={downloadAttendance} 
                        disabled={!isFrozen && !noRecords} 
                    >
                        <FaDownload className="mr-2" /> Export
                    </button>
                    {!isFrozen && !noRecords && (
                        <button 
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-nowrap"
                            onClick={saveAttendance} 
                        >
                            <FaSave className="mr-2" /> Save Records
                        </button>
                    )}
                </div>
            </div>

            {msg && (
                <div className={`p-4 mb-6 rounded-lg text-sm font-medium border shadow-sm ${
                    msg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
                    msg.type === 'danger' ? 'bg-red-50 text-red-800 border-red-200' :
                    msg.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                    'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                    {msg.text}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : noRecords ? (
                <div className="text-center py-16 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 text-gray-500">
                    <FaCalendarAlt size={48} className="mx-auto mb-4 opacity-30 text-gray-400"/>
                    <h5 className="font-bold text-lg text-gray-700 mb-2">No Attendance Records Available</h5>
                    <p className="text-sm m-0">Attendance was not marked for {currentDate}.</p>
                </div>
            ) : (
                <>
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden flex flex-col">
                     <div className="flex flex-wrap justify-between items-center gap-4 p-5 border-b border-gray-100 bg-white">
                        <h6 className="font-bold m-0 text-sm tracking-widest uppercase text-gray-500 flex items-center w-full md:w-auto">
                            {isFrozen ? <span className="flex items-center text-blue-600"><FaLock className="mr-2"/> Finalized Record</span> : <span className="text-gray-700">Marking Attendance</span>} 
                            <span className="mx-2">•</span> 
                            {new Date(currentDate).toLocaleDateString()}
                        </h6>
                        
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            {!isFrozen && (
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 shadow-sm bg-white">
                                    <input 
                                        type="text"
                                        placeholder="Quick Absent (e.g. 104 105)" 
                                        className="w-32 sm:w-48 md:w-48 px-3 py-2 text-sm outline-none border-none font-medium flex-1"
                                        value={quickAbsentInput} 
                                        onChange={(e) => setQuickAbsentInput(e.target.value)} 
                                        onKeyDown={handleQuickAbsentKeyDown}
                                    />
                                    <button 
                                        className="bg-red-50 text-red-600 px-3 py-2 text-sm font-bold border-l border-gray-300 hover:bg-red-100 transition-colors focus:outline-none"
                                        onClick={handleQuickAbsent}
                                        title="Enter student IDs separated by spaces or commas"
                                    >
                                        Mark Absent
                                    </button>
                                </div>
                            )}

                            <div className="w-full sm:w-auto min-w-[200px] flex-1">
                                <input 
                                    type="text"
                                    placeholder="Search student..." 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)} 
                                />
                            </div>
                        </div>
                     </div>

                     <div className="overflow-y-auto overflow-x-auto max-h-[60vh] w-full bg-white relative">
                        <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-[600px] m-0">
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                <tr>
                                    <th className="py-3 px-6 font-bold text-gray-700">Student Name</th>
                                    <th className="py-3 px-6 font-bold text-gray-700">ID</th>
                                    <th className="py-3 px-6 font-bold text-gray-700 text-center">Status</th>
                                    <th className="py-3 px-6 font-bold text-gray-700 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filtered.map(s => (
                                    <tr key={s._id} className={`transition-colors ${attendanceState[s._id] === 'Absent' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-gray-50 bg-white'}`}>
                                        <td className="py-3 px-6 font-bold text-gray-800">{s.name}</td>
                                        <td className="py-3 px-6 text-gray-500 text-xs">{s.studentId}</td>
                                        <td className="py-3 px-6 text-center">
                                            {attendanceState[s._id] === 'Present' ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded bg-green-100 text-green-800 font-medium text-xs border border-green-200 shadow-sm">
                                                    <FaCheckCircle className="mr-1.5" /> Present
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded bg-red-100 text-red-800 font-medium text-xs border border-red-200 shadow-sm">
                                                    <FaTimesCircle className="mr-1.5" /> Absent
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-6 text-right">
                                            <button 
                                                className={`px-4 py-1.5 rounded text-xs font-medium border outline-none transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 ${
                                                    isFrozen ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-70' :
                                                    attendanceState[s._id] === 'Present' ? 'bg-white text-red-600 border-red-500 hover:bg-red-50 focus:ring-red-500' : 'bg-white text-green-600 border-green-500 hover:bg-green-50 focus:ring-green-500'
                                                }`}
                                                disabled={isFrozen}
                                                onClick={() => toggleStatus(s._id)}
                                            >
                                                {isFrozen ? "Locked" : `Mark ${attendanceState[s._id] === 'Present' ? 'Absent' : 'Present'}`}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                        <h6 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-3">Total Present</h6>
                        <h3 className="text-green-500 font-bold text-3xl m-0">{stats.present}</h3>
                    </div>
                     <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                        <h6 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-3">Total Absent</h6>
                        <h3 className="text-red-500 font-bold text-3xl m-0">{stats.absent}</h3>
                    </div>
                     <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                        <h6 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-3">Daily Rate</h6>
                        <h3 className="text-blue-600 font-bold text-3xl m-0">
                            {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                        </h3>
                    </div>
                </div>
                </>
            )}
        </div>
    );
};

export default Attendance;
