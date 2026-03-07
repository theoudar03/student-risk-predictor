import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssessmentInbox = () => {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssessment, setSelectedAssessment] = useState(null);

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            const res = await axios.get('/api/portal/mentor/assessments');
            setAssessments(res.data);
        } catch (e) {
            console.error("Failed to fetch assessments", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-8">
            <h2 className="mb-6 font-bold text-2xl text-gray-800">Assessment Inbox</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-0 overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="py-4 pl-6 pr-4 font-bold text-gray-700">Student</th>
                                <th className="py-4 px-4 font-bold text-gray-700">Risk Level</th>
                                <th className="py-4 px-4 font-bold text-gray-700 text-center">Stress (1-10)</th>
                                <th className="py-4 px-4 font-bold text-gray-700 text-center">Motivation (1-10)</th>
                                <th className="py-4 px-4 font-bold text-gray-700">Date Submitted</th>
                                <th className="py-4 px-6 font-bold text-gray-700 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {assessments.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-12 text-gray-500">No assessments received yet.</td></tr>
                            ) : assessments.map(a => (
                                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 pl-6 pr-4 font-bold text-gray-800">{a.studentName}</td>
                                    <td className="py-4 px-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            a.studentRiskLevel === 'High' ? 'bg-red-100 text-red-800' : 
                                            a.studentRiskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {a.studentRiskLevel}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center font-medium text-gray-700">{a.stressLevel}</td>
                                    <td className="py-4 px-4 text-center font-medium text-gray-700">{a.motivation}</td>
                                    <td className="py-4 px-4 text-sm text-gray-600">{new Date(a.timestamp).toLocaleDateString()}</td>
                                    <td className="py-4 px-6 text-right">
                                        <button 
                                            className="px-3 py-1.5 text-xs font-medium border border-blue-600 text-blue-600 bg-white rounded hover:bg-blue-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none shadow-sm"
                                            onClick={() => setSelectedAssessment(a)}
                                        >
                                            View Detail
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assessment Detail Modal - Tailwind CSS Implementation */}
            {selectedAssessment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 w-full h-full">
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col max-h-full">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 rounded-t-2xl bg-white">
                            <h3 className="text-lg font-bold text-gray-900 m-0">
                                Assessment Details
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => setSelectedAssessment(null)}
                                className="text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center transition-colors outline-none" 
                            >
                                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 text-sm bg-white">
                            <h5 className="font-bold text-lg text-gray-800 m-0 mb-1">{selectedAssessment.studentName}</h5>
                            <p className="text-gray-500 text-xs m-0 mb-4 pb-4 border-b border-gray-100">Submitted on {new Date(selectedAssessment.timestamp).toLocaleString()}</p>
                            
                            <div className="mb-4 flex justify-between items-center py-2 border-b border-gray-50">
                                <strong className="text-gray-700 font-bold">Stress Level:</strong> 
                                <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${selectedAssessment.stressLevel > 7 ? 'bg-red-100 text-red-700' : selectedAssessment.stressLevel > 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{selectedAssessment.stressLevel}/10</span>
                            </div>
                            <div className="mb-4 flex justify-between items-center py-2 border-b border-gray-50">
                                <strong className="text-gray-700 font-bold">Learning Difficulty:</strong> 
                                <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${selectedAssessment.learningDifficulty > 7 ? 'bg-red-100 text-red-700' : selectedAssessment.learningDifficulty > 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{selectedAssessment.learningDifficulty}/10</span></div>
                            <div className="mb-4 flex justify-between items-center py-2 border-b border-gray-50">
                                <strong className="text-gray-700 font-bold">Motivation:</strong> 
                                <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${selectedAssessment.motivation < 4 ? 'bg-red-100 text-red-700' : selectedAssessment.motivation < 7 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{selectedAssessment.motivation}/10</span>
                            </div>
                            <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <strong className="text-gray-700 font-bold uppercase tracking-wider text-[10px] block mb-2">Notes:</strong>
                                <p className="mb-0 text-gray-600 leading-relaxed italic">{selectedAssessment.notes || "No additional notes provided."}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end p-5 border-t border-gray-100 rounded-b-2xl bg-gray-50 gap-3">
                            <button 
                                type="button" 
                                onClick={() => setSelectedAssessment(null)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors outline-none shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssessmentInbox;
