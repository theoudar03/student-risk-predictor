import React, { useState, useEffect } from 'react';
import { FaUserGraduate, FaChalkboardTeacher, FaCalendarCheck, FaChartLine } from 'react-icons/fa';
import axios from 'axios';

const ParentDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showContactModal, setShowContactModal] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`/api/portal/parent/child-profile`);
                setProfile(res.data);
            } catch (err) {
                setError('Failed to load child profile.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading...</div>;
    if (error) return <div className="p-12 text-center text-red-600">{error}</div>;
    if (!profile) return <div className="p-12 text-center text-gray-500">No student profile found linked to your account.</div>;

    const getConcernColor = (level) => {
        if (level === 'Needs Attention') return 'bg-red-100 text-red-700 border border-red-200';
        if (level === 'Monitor Closely') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
        return 'bg-green-100 text-green-700 border border-green-200';
    };

    return (
        <div className="w-full pb-8">
            <h2 className="mb-6 text-gray-800 font-bold text-2xl">Parent Portal</h2>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                {/* Child Snapshot */}
                <div className="md:col-span-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col p-6">
                        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                            <h4 className="m-0 flex items-center font-bold text-xl text-gray-800">
                                <FaUserGraduate className="mr-3 text-blue-600" /> 
                                {profile.name}
                            </h4>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${getConcernColor(profile.concernLevel)}`}>
                                Status: {profile.concernLevel}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                <FaCalendarCheck size={28} className="mx-auto mb-3 text-sky-500" />
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Attendance</div>
                                <h3 className="font-bold text-2xl text-gray-800 m-0">{profile.attendancePercentage}%</h3>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                <FaChartLine size={28} className="mx-auto mb-3 text-green-500" />
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">CGPA</div>
                                <h3 className="font-bold text-2xl text-gray-800 m-0">{profile.cgpa}</h3>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                <FaChartLine size={28} className="mx-auto mb-3 text-gray-500" />
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Trend</div>
                                <h5 className="font-bold text-lg text-gray-800 m-0 mt-3">{profile.performanceTrend}</h5>
                            </div>
                        </div>
                        
                        <div className="mt-4 p-5 border border-gray-200 rounded-xl bg-white shadow-sm flex-1">
                            <h6 className="font-bold text-sm text-gray-800 mb-2">Academic Observation:</h6>
                            <p className="m-0 text-gray-600 text-sm leading-relaxed">{profile.concernMessage}</p>
                        </div>
                    </div>
                </div>

                {/* Communication Panel (Light Theme) */}
                <div className="md:col-span-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col p-6">
                        <h5 className="mb-6 flex items-center text-gray-800 font-bold text-lg"><FaChalkboardTeacher className="mr-3 text-blue-600" /> Mentor Contact</h5>
                        
                        <div className="mb-6 p-5 bg-gray-50 rounded-xl text-center border border-gray-100">
                            <h6 className="opacity-75 text-gray-500 uppercase text-xs font-bold tracking-wider mb-3">Assigned Mentor</h6>
                            <h4 className="font-bold text-gray-800 mb-2 text-xl">{profile.mentorContact?.name}</h4>
                            <p className="text-sm text-gray-500 m-0">{profile.mentorContact?.email}</p>
                        </div>

                        <div className="w-full">
                            <button 
                                className="w-full px-4 py-3 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-sm shadow-sm"
                                onClick={() => setShowContactModal(true)}
                            >
                            Send Message / Request Meeting
                            </button>
                        </div>
                        
                        <div className="mt-auto pt-5 border-t border-gray-100 text-center">
                            <small className="text-gray-400 text-xs block">Last updated: {new Date().toLocaleDateString()}</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Meeting Request Modal */}
            <MeetingRequestModal 
                show={showContactModal} 
                onHide={() => setShowContactModal(false)}
                recipientId={profile.mentorContact?.id}
                recipientName={profile.mentorContact?.name || "Mentor"}
            />
        </div>
    );
};

// Sub-component for Meeting Request Modal
const MeetingRequestModal = ({ show, onHide, recipientId, recipientName }) => {
    const [reqData, setReqData] = useState({ agenda: '', date: '', time: '' });
    const [status, setStatus] = useState(null);

    // reset logic
    useEffect(() => {
      if(!show) {
        setReqData({ agenda: '', date: '', time: '' });
        setStatus(null);
      }
    }, [show]);

    if (!show) return null;

    const send = async () => {
        try {
            await axios.post('/api/messages', {
                receiverId: recipientId,
                receiverName: recipientName,
                ...reqData
            });
            setStatus('success');
            setTimeout(() => { setStatus(null); onHide(); }, 1500);
        } catch (e) {
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 w-full h-full">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-full">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 rounded-t-2xl bg-white">
                    <h3 className="text-lg font-bold text-gray-900 m-0">
                        Request Meeting with {recipientName}
                    </h3>
                    <button 
                        type="button" 
                        onClick={onHide}
                        className="text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center transition-colors outline-none" 
                    >
                        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {status === 'success' && <div className="p-4 mb-4 text-green-800 bg-green-100 rounded-lg border border-green-200">Request Sent!</div>}
                    {status === 'error' && <div className="p-4 mb-4 text-red-800 bg-red-100 rounded-lg border border-red-200">Failed to send request.</div>}
                    
                    <form>
                        <div className="mb-5">
                            <label className="block mb-2 text-sm font-bold text-gray-700">Preferred Date</label>
                            <input 
                                type="date" 
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors"
                                onChange={e => setReqData({...reqData, date: e.target.value})}
                                value={reqData.date}
                            />
                        </div>
                        <div className="mb-5">
                            <label className="block mb-2 text-sm font-bold text-gray-700">Preferred Time (Optional)</label>
                            <input 
                                type="time" 
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors"
                                onChange={e => setReqData({...reqData, time: e.target.value})}
                                value={reqData.time}
                            />
                        </div>
                        <div className="mb-2">
                            <label className="block mb-2 text-sm font-bold text-gray-700">Reason / Agenda</label>
                            <textarea 
                                rows={4} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors" 
                                placeholder="What would you like to discuss?"
                                onChange={e => setReqData({...reqData, agenda: e.target.value})}
                                value={reqData.agenda}
                            />
                        </div>
                    </form>
                </div>
                <div className="flex items-center justify-end p-5 border-t border-gray-100 rounded-b-2xl bg-gray-50 gap-3">
                    <button 
                        type="button" 
                        onClick={onHide}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 outline-none transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={send} 
                        disabled={!reqData.date || !reqData.agenda}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:outline-none focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed outline-none transition-colors shadow-sm"
                    >
                        Send Request
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;
