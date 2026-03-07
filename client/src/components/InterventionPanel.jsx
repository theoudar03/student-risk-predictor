import React, { useState, useEffect } from 'react';
import { FaHistory, FaPlus, FaCheck } from 'react-icons/fa';
import axios from 'axios';

const InterventionPanel = ({ studentId, riskScore, riskLevel, onUpdate }) => {
    const [interventions, setInterventions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        actionTaken: 'Counseling',
        notes: '',
        followUpDate: ''
    });

    useEffect(() => {
        if (studentId) fetchInterventions();
    }, [studentId]);

    const fetchInterventions = async () => {
        try {
            const res = await axios.get(`/api/interventions/${studentId}`);
            setInterventions(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/interventions`, {
                studentId,
                riskScoreAtTime: riskScore,
                riskLevel,
                ...formData
            });
            setShowForm(false);
            setFormData({ actionTaken: 'Counseling', notes: '', followUpDate: '' });
            fetchInterventions();
            if (onUpdate) onUpdate();
        } catch (error) {
            alert('Failed to save intervention');
        }
    };

    const handleOutcome = async (id, outcome) => {
        try {
            await axios.patch(`/api/interventions/${id}/outcome`, {
                outcome,
                resolveAlert: outcome === 'Effective'
            });
            fetchInterventions();
        } catch (error) {
            alert('Failed to update outcome');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="bg-white px-5 py-4 border-b border-gray-100 flex justify-between items-center rounded-t-xl">
                <h5 className="m-0 font-bold text-gray-800 text-lg flex items-center">
                    <FaHistory className="mr-2 text-gray-500" /> Intervention History
                </h5>
                <button 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" 
                    onClick={() => setShowForm(!showForm)}
                >
                    <FaPlus size={12} /> New Action
                </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
                {showForm && (
                    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="mb-3">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Action Type</label>
                            <select 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                value={formData.actionTaken}
                                onChange={e => setFormData({...formData, actionTaken: e.target.value})}
                            >
                                <option>Counseling</option>
                                <option>Parent Meeting</option>
                                <option>Academic Remedial</option>
                                <option>Peer Support</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
                            <textarea 
                                rows={2} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Follow-up Date</label>
                            <input 
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                value={formData.followUpDate}
                                onChange={e => setFormData({...formData, followUpDate: e.target.value})}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                        >
                            Save Intervention
                        </button>
                    </form>
                )}

                <div className="flex flex-col gap-4">
                    {interventions.length === 0 ? (
                        <p className="text-gray-500 text-center text-sm my-6 italic">No interventions recorded yet.</p>
                    ) : (
                        interventions.map(item => (
                            <div 
                                key={item.id} 
                                className={`pl-4 py-2 border-l-4 ${item.outcome === 'Effective' ? 'border-green-500' : 'border-yellow-500'}`}
                            >
                                <div className="w-full">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-800 text-sm">{item.actionTaken}</span>
                                        <span className="text-gray-500 text-xs">{new Date(item.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="mb-2 text-sm text-gray-600 leading-relaxed">{item.notes}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                            item.outcome === 'Pending' 
                                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                                            : 'bg-green-100 text-green-800 border border-green-200'
                                        }`}>
                                            {item.outcome}
                                        </span>
                                        
                                        {item.outcome === 'Pending' && (
                                            <div className="flex gap-1">
                                                <button 
                                                    className="px-2 py-1 text-xs border border-green-500 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    onClick={() => handleOutcome(item.id, 'Effective')}
                                                >
                                                    Mark Effective
                                                </button>
                                                <button 
                                                    className="px-2 py-1 text-xs border border-gray-400 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                                    onClick={() => handleOutcome(item.id, 'No Charge')}
                                                >
                                                    No Change
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default InterventionPanel;
