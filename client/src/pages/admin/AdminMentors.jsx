import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

const AdminMentors = () => {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editEmail, setEditEmail] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    // Departments
    const departments = ["AI&DS", "AIML", "CIVIL", "CSBS", "CSE", "ECE", "EEE", "ICE", "IT", "MBA", "MECH"];

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', department: '', password: 'password123', mentorId: ''
    });

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            const res = await axios.get(`/api/admin/mentors`);
            setMentors(res.data);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleEdit = (mentor) => {
        setEditEmail(mentor.email);
        setFormData({
            name: mentor.name,
            email: mentor.email,
            phone: mentor.phone,
            department: mentor.department,
            mentorId: mentor.mentorId, // Populate existing ID
            password: '' // Not editable here
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if(editEmail) {
                 await axios.put(`/api/admin/mentors/${editEmail}`, formData);
            } else {
                 await axios.post(`/api/admin/mentors`, formData);
            }
            setShowModal(false);
            setEditEmail(null);
            fetchMentors();
        } catch (error) { alert('Error updating/adding mentor'); }
    };
    
    const handleDelete = async (email) => {
        if(!window.confirm("Remove this mentor? Accounts related to this email will be deleted.")) return;
        try {
            await axios.delete(`/api/admin/mentors/${email}`);
            fetchMentors();
        } catch(e) { 
            if (e.response && e.response.data && e.response.data.error === "MIN_MENTOR_REQUIRED") {
                alert("At least one mentor should be in a course");
            } else {
                alert("Failed to delete mentor");
            }
        }
    };

    const [sortType, setSortType] = useState('name');

    // Filter & Sort
    const filtered = mentors.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.department.toLowerCase().includes(search.toLowerCase()));
    
    const sorted = [...filtered].sort((a, b) => {
        if (sortType === 'name') return a.name.localeCompare(b.name);
        if (sortType === 'department') return a.department.localeCompare(b.department);
        return 0;
    });

    return (
        <div className="pb-8 animate-fade-in text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-2xl m-0">Manage Mentors</h2>
                <button 
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  onClick={() => setShowModal(true)}
                >
                  <FaPlus className="mr-2" /> Add Mentor
                </button>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center">
                 <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden w-full sm:flex-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <span className="flex items-center px-3 text-gray-400 bg-gray-50 border-r border-gray-200"><FaSearch /></span>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 outline-none border-none text-sm bg-white"
                      placeholder="Search mentors..." 
                      value={search} 
                      onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <select 
                  className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  value={sortType} 
                  onChange={e => setSortType(e.target.value)}
                >
                    <option value="name">Sort by Name (A-Z)</option>
                    <option value="department">Sort by Department</option>
                </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-[700px] m-0">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="py-4 pl-6 pr-4 font-bold text-gray-700">Name</th>
                                <th className="py-4 px-4 font-bold text-gray-700">Department</th>
                                <th className="py-4 px-4 font-bold text-gray-700">Contact</th>
                                <th className="py-4 px-6 font-bold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sorted.length === 0 ? (
                                <tr><td colSpan="4" className="text-center p-12 text-gray-500">No mentors found.</td></tr>
                            ) : sorted.map(m => (
                                <tr key={m.id || m.email} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 pl-6 pr-4 font-bold text-gray-800">{m.name}</td>
                                    <td className="py-4 px-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-bold text-xs shadow-sm">
                                            {m.department}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-sm text-gray-800 mb-0.5">{m.email}</div>
                                        <div className="text-xs text-gray-500">{m.phone}</div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button 
                                            className="px-2.5 py-1.5 text-xs border border-blue-600 text-blue-600 rounded mr-2 hover:bg-blue-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none"
                                            onClick={() => handleEdit(m)}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            className="px-2.5 py-1.5 text-xs text-red-600 border border-red-500 rounded hover:bg-red-50 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-1 outline-none"
                                            onClick={() => handleDelete(m.email)}
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

            {/* Add/Edit Mentor Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 w-full h-full">
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl flex flex-col max-h-full">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 rounded-t-2xl">
                            <h3 className="text-lg font-bold text-gray-900 m-0">
                                {editEmail ? 'Edit Mentor' : 'Add New Mentor'}
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => { setShowModal(false); setEditEmail(null); setFormData({ name: '', email: '', phone: '', department: '', password: 'password123', mentorId: '' }); }}
                                className="text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center transition-colors outline-none" 
                            >
                                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <input type="text" placeholder="Full Name" name="name" value={formData.name} required onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500 transition-shadow" />
                                    </div>
                                    <div>
                                        <input type="text" placeholder="Mentor ID" name="mentorId" value={formData.mentorId} disabled={!!editEmail} required onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500 transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <input type="email" placeholder="Email" name="email" value={formData.email} disabled={!!editEmail} required onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500 transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <input type="text" placeholder="Phone" name="phone" value={formData.phone} required onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500 transition-shadow" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <select name="department" onChange={handleInputChange} value={formData.department} required className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500 transition-shadow">
                                            <option value="">Select Department</option>
                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {!editEmail && (
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Default Password</label>
                                    <input type="text" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500 transition-shadow" />
                                </div>
                                )}
                                <div className="text-right mt-6">
                                    <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm">
                                        {editEmail ? 'Update Mentor' : 'Create Account'}
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

export default AdminMentors;
