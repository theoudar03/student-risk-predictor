import React, { useState } from 'react';
import { FaSave, FaCog, FaDatabase } from 'react-icons/fa';

const Settings = () => {
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        highRiskThreshold: 70,
        mediumRiskThreshold: 35,
        attendanceWeight: 40,
        cgpaWeight: 30,
        emailNotifications: true,
        autoAlerts: true
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setSettings({ ...settings, [e.target.name]: value });
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="animate-fade-in">
            <h2 className="mb-6 font-bold text-2xl text-gray-800">System Configuration</h2>

            {saved && <div className="p-4 mb-6 bg-green-100 text-green-800 rounded-lg">Settings saved successfully!</div>}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 mb-6 p-6">
                        <h5 className="font-bold mb-6 flex items-center text-lg text-gray-800">
                            <FaCog className="mr-3 text-blue-600" /> Risk Model Parameters
                        </h5>
                        <form onSubmit={handleSave}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">High Risk Threshold (Score)</label>
                                    <input 
                                        type="number" 
                                        name="highRiskThreshold" 
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                        value={settings.highRiskThreshold} 
                                        onChange={handleChange} 
                                    />
                                    <p className="text-gray-500 text-xs mt-2">Scores above this trigger critical alerts.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Medium Risk Threshold (Score)</label>
                                    <input 
                                        type="number" 
                                        name="mediumRiskThreshold" 
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                        value={settings.mediumRiskThreshold} 
                                        onChange={handleChange} 
                                    />
                                </div>
                            </div>
                            <hr className="my-6 border-gray-200" />
                            <h6 className="font-bold mb-4 text-gray-800">Feature Weights (Impact on AI)</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Attendance Impact (%)</label>
                                    <input 
                                        type="range" 
                                        name="attendanceWeight" 
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        value={settings.attendanceWeight} 
                                        onChange={handleChange} 
                                    />
                                    <div className="text-right text-sm text-gray-600 mt-2 font-medium">{settings.attendanceWeight}%</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Academic Impact (%)</label>
                                    <input 
                                        type="range" 
                                        name="cgpaWeight" 
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        value={settings.cgpaWeight} 
                                        onChange={handleChange} 
                                    />
                                    <div className="text-right text-sm text-gray-600 mt-2 font-medium">{settings.cgpaWeight}%</div>
                                </div>
                            </div>
                            <button type="submit" className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                <FaSave className="mr-2" /> Save Changes
                            </button>
                        </form>
                    </div>
                </div>

                <div className="md:col-span-4">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 mb-6 p-6">
                        <h5 className="font-bold mb-6 text-lg text-gray-800">Notifications</h5>
                        <div className="flex items-center justify-between mb-4">
                            <label htmlFor="email-switch" className="text-sm font-medium text-gray-700 cursor-pointer">Email Notifications</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="email-switch" 
                                    name="emailNotifications"
                                    className="sr-only peer" 
                                    checked={settings.emailNotifications}
                                    onChange={handleChange}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="alert-switch" className="text-sm font-medium text-gray-700 cursor-pointer">Auto-Generate Alerts</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="alert-switch" 
                                    name="autoAlerts"
                                    className="sr-only peer" 
                                    checked={settings.autoAlerts}
                                    onChange={handleChange}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                    
                    <div className="bg-red-50 text-red-600 border border-red-200 backdrop-blur-md rounded-2xl shadow-sm mb-6 p-6">
                         <h5 className="font-bold mb-4 flex items-center text-lg"><FaDatabase className="mr-3" /> Data Management</h5>
                         <p className="text-sm text-red-700 mb-6 leading-relaxed">Resetting the system will delete all student records and retrain the model.</p>
                         <button 
                            className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1" 
                            onClick={() => alert('This feature is disabled in demo mode.')}
                         >
                            Reset Database
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
