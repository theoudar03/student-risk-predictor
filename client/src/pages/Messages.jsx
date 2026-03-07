import React, { useState, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import axios from 'axios';

const Messages = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get('/api/messages');
            setRequests(res.data);
        } catch (e) { 
            console.error(e); 
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await axios.patch(`/api/messages/${id}/status`, { status: newStatus });
            fetchRequests();
        } catch (e) {
            console.error("Failed to update status", e);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'Accepted') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Accepted</span>;
        if (status === 'Declined') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Declined</span>;
        if (status === 'Viewed') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Viewed</span>;
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
    };

    return (
        <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-2xl text-gray-800 m-0">Meeting Requests</h2>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-0 overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="py-4 pl-6 pr-4 font-bold text-gray-700">Request From</th>
                                <th className="py-4 px-4 font-bold text-gray-700">Role</th>
                                <th className="py-4 px-4 font-bold text-gray-700">Agenda</th>
                                <th className="py-4 px-4 font-bold text-gray-700">Requested For</th>
                                <th className="py-4 px-4 font-bold text-gray-700">Status</th>
                                <th className="py-4 px-6 text-right font-bold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-12 text-gray-500">No meeting requests found.</td></tr>
                            ) : requests.map(req => (
                                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 pl-6 pr-4 font-bold text-gray-800">
                                        <div className="flex items-center">
                                            <div className="bg-gray-100 rounded-full p-2 mr-3 text-gray-500"><FaUser size={14} /></div>
                                            {req.senderName}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 opacity-90">{req.senderRole}</span>
                                    </td>
                                    <td className="py-4 px-4 max-w-[300px]">
                                        <div className="text-gray-900 font-bold truncate">{req.agenda}</div>
                                        {req.preferredTime && <div className="text-xs text-gray-500 mt-1">Time: {req.preferredTime}</div>}
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-600">{new Date(req.preferredDate).toLocaleDateString()}</td>
                                    <td className="py-4 px-4">{getStatusBadge(req.status)}</td>
                                    <td className="py-4 px-6 text-right">
                                        {(req.status === 'Pending' || req.status === 'Viewed') && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors shadow-sm focus:ring-2 focus:ring-green-500 focus:ring-offset-1 outline-none" 
                                                    onClick={() => updateStatus(req.id, 'Accepted')}
                                                >
                                                    Accept
                                                </button>
                                                <button 
                                                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-1 outline-none" 
                                                    onClick={() => updateStatus(req.id, 'Declined')}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}
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

export default Messages;
