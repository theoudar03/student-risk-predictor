import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaBell, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await axios.get(`/api/students/data/alerts`);
            setAlerts(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const resolveAlert = async (id) => {
        try {
            const res = await axios.post(`/api/students/data/alerts/${id}/resolve`);
            setAlerts(alerts.map(a => a._id === id ? res.data : a));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="animate-fade-in pb-8">
            <h2 className="mb-6 font-bold text-2xl text-gray-800">Live Risk Alerts</h2>
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {alerts.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <FaBell className="mx-auto mb-4 opacity-50 text-5xl" />
                        <p className="text-gray-500 m-0">No alerts generated yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-[700px] m-0">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="py-4 pl-6 pr-4 font-bold text-gray-700">Severity</th>
                                    <th className="py-4 px-4 font-bold text-gray-700">Student</th>
                                    <th className="py-4 px-4 font-bold text-gray-700">Details</th>
                                    <th className="py-4 px-4 font-bold text-gray-700">Date</th>
                                    <th className="py-4 px-6 font-bold text-gray-700 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {alerts.map(alert => (
                                    <tr key={alert._id} className={`transition-colors hover:bg-gray-50 ${alert.status === 'Resolved' ? 'opacity-50 bg-gray-50/50 hover:bg-gray-100/50' : 'bg-white'}`}>
                                        <td className="py-4 pl-6 pr-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${alert.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {alert.severity === 'High' && <FaExclamationTriangle className="mr-1.5" />}
                                                {alert.severity}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 font-bold text-gray-800">{alert.studentName}</td>
                                        <td className="py-4 px-4 text-gray-600 truncate max-w-[300px]">{alert.message}</td>
                                        <td className="py-4 px-4 text-gray-500 text-sm">
                                            {new Date(alert.date).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {alert.status !== 'Resolved' ? (
                                                <button 
                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-green-600 text-green-600 bg-white rounded hover:bg-green-50 transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-1 outline-none shadow-sm"
                                                    onClick={() => resolveAlert(alert._id)}
                                                >
                                                    <FaCheck className="mr-1.5" /> Mark Resolved
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
                                                    Resolved
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Alerts;
