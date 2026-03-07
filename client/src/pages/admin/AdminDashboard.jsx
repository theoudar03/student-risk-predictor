import React, { useState, useEffect } from 'react';
import { FaUserGraduate, FaChalkboardTeacher, FaExclamationTriangle, FaChartLine } from 'react-icons/fa';
import axios from 'axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [recalcResult, setRecalcResult] = useState(null);

    const handleRecalculate = async () => {
        if(!window.confirm("Recalculate risk for ALL students? This operation updates the entire database.")) return;
        
        setIsCalculating(true);
        setRecalcResult(null);
        setProgress(0);

        // Simulate progress while waiting
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + 5, 90));
        }, 300);

        try {
            const res = await axios.post('/api/admin/risk-recalc');
            clearInterval(interval);
            setProgress(100);
            setRecalcResult({ success: true, message: res.data.message });
            
            // Refresh after brief delay
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch(e) {
            clearInterval(interval);
            setProgress(0);
            setIsCalculating(false);
            setRecalcResult({ 
                success: false, 
                message: "Recalculation failed: " + (e.response?.data?.error || e.message) 
            });
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/admin/stats');
                setStats(res.data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchStats();
    }, []);

    if (!stats) return <div className="p-12 text-center text-gray-500">Loading Admin Dashboard...</div>;

    return (
        <div className="animate-fade-in pb-8">
            <h2 className="mb-6 font-bold text-2xl text-gray-800">System Administration</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                    <div className="rounded-2xl shadow-sm border-0 text-white bg-blue-600 h-full p-6 text-center flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                        <FaUserGraduate size={36} className="mb-3 text-blue-200"/>
                        <h3 className="font-bold text-4xl m-0 tracking-tight">{stats.totalStudents}</h3>
                        <div className="text-sm font-medium text-blue-100 mt-1 uppercase tracking-wider">Total Students</div>
                    </div>
                </div>
                <div>
                    <div className="rounded-2xl shadow-sm border-0 text-white bg-emerald-500 h-full p-6 text-center flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                        <FaChalkboardTeacher size={36} className="mb-3 text-emerald-200"/>
                        <h3 className="font-bold text-4xl m-0 tracking-tight">{stats.totalMentors}</h3>
                        <div className="text-sm font-medium text-emerald-100 mt-1 uppercase tracking-wider">Total Mentors</div>
                    </div>
                </div>
                <div>
                    <div className="rounded-2xl shadow-sm border-0 text-white bg-rose-500 h-full p-6 text-center flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                        <FaExclamationTriangle size={36} className="mb-3 text-rose-200"/>
                        <h3 className="font-bold text-4xl m-0 tracking-tight">{stats.highRiskCount}</h3>
                        <div className="text-sm font-medium text-rose-100 mt-1 uppercase tracking-wider">High Risk Students</div>
                    </div>
                </div>
                <div>
                    <div className="rounded-2xl shadow-sm border-0 text-white bg-amber-500 h-full p-6 text-center flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                        <FaChartLine size={36} className="mb-3 text-amber-200"/>
                        <h3 className="font-bold text-4xl m-0 tracking-tight">{stats.activeAlerts}</h3>
                        <div className="text-sm font-medium text-amber-100 mt-1 uppercase tracking-wider">Active Alerts</div>
                    </div>
                </div>
            </div>
            
            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6 shadow-sm">
                <h5 className="font-bold text-lg text-sky-900 mb-3 flex items-center">Administrative Control</h5>
                <p className="text-sky-800 text-sm mb-6 leading-relaxed">
                    Use the sidebar to manage Students and Mentors. You have full access to add, remove, and modify records. 
                    Ensure all data privacy regulations are followed when handling student information.
                </p>
                <div className="mb-6">
                    {!isCalculating ? (
                        <button 
                           className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg text-sm hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50"
                           onClick={handleRecalculate}
                           disabled={isCalculating}
                       >
                           Recalculate Risk Scores
                       </button>
                    ) : (
                        <div className="mt-4 bg-white/50 p-4 rounded-xl border border-sky-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Recalculating AI Models...</span>
                                <span className="text-xs font-bold text-gray-700">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
                                <div className="bg-red-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mb-0 m-0">Processing student behavioral data and updating risk profiles...</p>
                        </div>
                    )}
                    
                    {recalcResult && (
                        <div className={`mt-4 p-4 rounded-xl text-sm border font-medium ${recalcResult.success ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                            <strong className="mr-1">{recalcResult.success ? 'Success!' : 'Error:'}</strong> {recalcResult.message}
                            {recalcResult.success && <div className="mt-2 text-xs opacity-75">Page will refresh in 3 seconds...</div>}
                        </div>
                    )}
                </div>
                <hr className="border-sky-200/50 my-6" />
                <p className="m-0 text-xs text-sky-600 font-medium">System Status: Operational <span className="mx-2">•</span> 2026</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
