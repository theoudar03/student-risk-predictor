import React, { useState, useEffect } from 'react';
import { FaUserGraduate, FaChartLine, FaClipboardList, FaLightbulb, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const StudentDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [survey, setSurvey] = useState({ stressLevel: 5, learningDifficulty: 5, motivation: 5, notes: '', mentorId: '' });
    const [surveyStatus, setSurveyStatus] = useState(null);
    const [canTakeAssessment, setCanTakeAssessment] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(null);

    const [mentors, setMentors] = useState([]);

    useEffect(() => {
        fetchProfile();
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            const res = await axios.get('/api/portal/list-mentors');
            setMentors(res.data);
        } catch (e) {
            console.error("Failed to fetch mentors", e);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`/api/portal/student/profile`);
            setProfile(res.data);
        } catch (err) {
            setError('Failed to load profile. Please contact administrator.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.lastAssessmentDate) {
            const lastDate = new Date(profile.lastAssessmentDate);
            const nextDate = new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
            
            const calculateTime = () => {
                const now = new Date();
                const diff = nextDate - now;
                
                if (diff <= 0) {
                    setCanTakeAssessment(true);
                    setTimeRemaining(null);
                } else {
                    setCanTakeAssessment(false);
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                    const minutes = Math.floor((diff / 1000 / 60) % 60);
                    const seconds = Math.floor((diff / 1000) % 60);
                    setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
                }
            };
            
            calculateTime();
            const interval = setInterval(calculateTime, 1000);
            return () => clearInterval(interval);
        } else {
            setCanTakeAssessment(true);
            setTimeRemaining(null);
        }
    }, [profile]);

    const handleSurveySubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/portal/student/survey`, survey);
            setSurveyStatus('success');
            setSurvey({ stressLevel: 5, learningDifficulty: 5, motivation: 5, notes: '', mentorId: '' }); // Reset Form
            
            // Re-fetch profile to lock the self-assessment
            fetchProfile();

            setTimeout(() => setSurveyStatus(null), 5000);
        } catch (err) {
            setSurveyStatus('error');
            console.error(err);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading your dashboard...</div>;
    if (error) return <div className="m-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    if (!profile) return <div className="p-12 text-center text-gray-500">No student profile data available.</div>;

    return (
        <div className="w-full pb-8">
            <h2 className="mb-6 font-bold text-2xl text-gray-800">My Dashboard</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full overflow-hidden flex flex-col p-6">
                        <h5 className="mb-6 font-bold text-lg text-gray-800 flex items-center">
                            <FaUserGraduate className="mr-3 text-blue-600" /> Academic Overview
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Attendance</div>
                                <div className="flex items-end justify-between mb-4">
                                    <h3 className="text-3xl font-bold m-0 text-gray-800">{profile.attendancePercentage}%</h3>
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${profile.attendancePercentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {profile.attendancePercentage >= 75 ? 'On Track' : 'Attention'}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className={`${profile.attendancePercentage >= 75 ? 'bg-green-500' : 'bg-yellow-500'} h-1.5 rounded-full`} style={{ width: `${profile.attendancePercentage}%` }}></div>
                                </div>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">CGPA</div>
                                <div className="flex items-end justify-between mb-4">
                                    <h3 className="text-3xl font-bold m-0 text-gray-800">{profile.cgpa}</h3>
                                    <span className="text-gray-400 text-xs">Current</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${profile.cgpa * 10}%` }}></div>
                                </div>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Assignments</div>
                                <div className="flex items-end justify-between mb-4">
                                    <h3 className="text-3xl font-bold m-0 text-gray-800">{profile.assignmentsCompleted}%</h3>
                                    <span className="text-gray-400 text-xs">Completion</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className={`${profile.assignmentsCompleted > 80 ? 'bg-blue-600' : 'bg-yellow-500'} h-1.5 rounded-full`} style={{ width: `${profile.assignmentsCompleted}%` }}></div>
                                </div>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Participation</div>
                                <div className="flex items-end justify-between mb-4">
                                    <h3 className="text-3xl font-bold m-0 text-gray-800">{profile.classParticipationScore}/100</h3>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: `${profile.classParticipationScore}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-blue-600 text-white rounded-2xl shadow-sm h-full flex flex-col p-6">
                        <h5 className="mb-6 font-bold text-lg flex items-center">
                            <FaLightbulb className="mr-3 text-yellow-300" /> Improvement Insights
                        </h5>
                        
                        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                            {profile.recommendations && profile.recommendations.length > 0 ? (
                                profile.recommendations.map((rec, idx) => (
                                    <div key={idx} className="p-4 bg-white/20 rounded-xl border border-white/30 backdrop-blur-sm">
                                        <p className="m-0 text-sm leading-relaxed">{rec}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-6 flex flex-col items-center justify-center h-full opacity-80">
                                    <FaCheckCircle size={40} className="mb-4 text-white/50" />
                                    <p className="m-0 text-sm">Great job! You are on the right track.</p>
                                </div>
                            )}
                        </div>
                        
                        <h6 className="mt-8 mb-3 text-xs font-bold uppercase tracking-wider text-white/70">Key Observations:</h6>
                        <ul className="text-sm pl-5 m-0 space-y-2 text-blue-100">
                            {profile.insights && profile.insights.map((insight, idx) => (
                                <li key={idx} className="leading-snug">{insight}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h5 className="mb-3 font-bold text-lg text-gray-800 flex items-center">
                        <FaClipboardList className="mr-3 text-sky-500" /> Weekly Self-Assessment
                    </h5>
                    <p className="text-gray-500 text-sm mb-6 max-w-2xl">Help us understand how you're feeling. This data is private and helps improve your specific support plan.</p>
                    
                    {surveyStatus === 'success' && <div className="p-4 mb-6 bg-green-100 text-green-800 rounded-lg">Survey submitted successfully! Thank you.</div>}
                    {surveyStatus === 'error' && <div className="p-4 mb-6 bg-red-100 text-red-800 rounded-lg">Failed to submit survey. Try again.</div>}

                    {!canTakeAssessment ? (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-8 text-center max-w-4xl">
                            <FaCheckCircle className="mx-auto text-blue-400 text-5xl mb-4" />
                            <h4 className="text-xl font-bold text-gray-800 mb-2">You're all caught up!</h4>
                            <p className="text-sm text-gray-500 mb-6">You've already submitted your weekly self-assessment.</p>
                            <div className="bg-white rounded-lg p-4 inline-block border border-gray-200 shadow-sm mx-auto w-full sm:w-auto sm:min-w-[300px]">
                                <p className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">Next Assessment Available In</p>
                                <div className="text-xl font-bold text-blue-600 font-mono tracking-wider bg-gray-50 py-2 rounded border border-gray-100">{timeRemaining}</div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSurveySubmit} className="max-w-4xl border border-gray-100 bg-gray-50/50 p-6 rounded-xl">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
                                <div className="md:col-span-12 mb-2">
                                    <label className="block font-bold text-gray-700 text-sm mb-2">Select Mentor for Review</label>
                                    <select 
                                        className="w-full md:max-w-md px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                        onChange={e => setSurvey({...survey, mentorId: e.target.value})}
                                        required
                                        value={survey.mentorId}
                                    >
                                        <option value="">-- Choose a Mentor --</option>
                                        {mentors.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-2">Only this mentor will see your assessment.</p>
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block font-bold text-gray-700 text-sm mb-2">Stress Level (1-10)</label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="range"
                                            min={1} max={10} 
                                            value={survey.stressLevel} 
                                            onChange={e => setSurvey({...survey, stressLevel: e.target.value})} 
                                            className="flex-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <span className="font-bold text-blue-600 text-lg w-6 text-center">{survey.stressLevel}</span>
                                    </div>
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block font-bold text-gray-700 text-sm mb-2">Learning Difficulty (1-10)</label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="range"
                                            min={1} max={10} 
                                            value={survey.learningDifficulty} 
                                            onChange={e => setSurvey({...survey, learningDifficulty: e.target.value})}
                                            className="flex-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                                        />
                                        <span className="font-bold text-blue-600 text-lg w-6 text-center">{survey.learningDifficulty}</span>
                                    </div>
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block font-bold text-gray-700 text-sm mb-2">Motivation (1-10)</label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="range"
                                            min={1} max={10} 
                                            value={survey.motivation} 
                                            onChange={e => setSurvey({...survey, motivation: e.target.value})} 
                                            className="flex-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <span className="font-bold text-blue-600 text-lg w-6 text-center">{survey.motivation}</span>
                                    </div>
                                </div>
                                <div className="md:col-span-12 mt-2">
                                    <label className="block font-bold text-gray-700 text-sm mb-2">Additional Notes (Optional)</label>
                                    <textarea 
                                        rows={3} 
                                        placeholder="Any specific challenges this week?" 
                                        value={survey.notes}
                                        onChange={e => setSurvey({...survey, notes: e.target.value})}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm resize-y"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="text-right mt-6">
                                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto">
                                    Submit Assessment
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
