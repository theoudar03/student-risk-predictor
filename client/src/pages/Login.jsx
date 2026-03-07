import React, { useState, useEffect } from 'react';
import { FaUserGraduate, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

const Login = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isTakingLong, setIsTakingLong] = useState(false);

    useEffect(() => {
        let timer;
        if (loading) {
            timer = setTimeout(() => {
                setIsTakingLong(true);
            }, 2000);
        } else {
            setIsTakingLong(false);
        }
        return () => clearTimeout(timer);
    }, [loading]);

    const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setIsTakingLong(false);
        setError('');

        try {
            const response = await axios.post('/api/auth/login', credentials);
            const data = response.data;
            
            if (data.success) {
                onLogin(data);
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800">
            <div className="w-full max-w-md p-4">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-6 border border-white/20">
                    <div className="text-center mb-8">
                        <div className="bg-white rounded-full inline-flex items-center justify-center mb-4 text-blue-600 shadow-sm w-20 h-20 text-3xl">
                            <FaUserGraduate />
                        </div>
                        <h2 className="font-bold text-2xl text-gray-800 m-0 mb-2">Welcome Back</h2>
                        <p className="text-gray-500 text-sm m-0">Sign in to access student analytics</p>
                    </div>

                    {error && <div className="p-3 mb-6 bg-red-100 text-red-700 rounded-lg text-sm text-center border border-red-200">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-5">
                            <div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                                <span className="flex items-center px-4 text-gray-400 bg-gray-50 border-r border-gray-200">
                                    <FaUser />
                                </span>
                                <input 
                                    type="text" 
                                    name="username" 
                                    placeholder="Username" 
                                    className="w-full py-3 px-3 outline-none border-none text-gray-800 bg-gray-50 text-sm" 
                                    value={credentials.username}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                             <div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                                <span className="flex items-center px-4 text-gray-400 bg-gray-50 border-r border-gray-200">
                                    <FaLock />
                                </span>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    placeholder="Password" 
                                    className="w-full py-3 px-3 outline-none border-none text-gray-800 bg-gray-50 text-sm" 
                                    value={credentials.password}
                                    onChange={handleChange}
                                    required 
                                />
                                <span 
                                    className="flex items-center px-4 text-gray-400 bg-gray-50 border-l border-gray-200 cursor-pointer hover:text-gray-600 transition-colors" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-6 text-sm">
                            <label className="flex items-center text-gray-600 cursor-pointer">
                                <input type="checkbox" className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                Remember me
                            </label>
                            <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium">Forgot Password?</a>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed" 
                            disabled={loading}
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                        
                        {isTakingLong && (
                            <div className="text-center mt-4 text-sm text-gray-500 animate-fade-in flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Waking up secure server... this may take a moment.
                            </div>
                        )}
                    </form>
                </div>
                <div className="text-center text-white/80 text-sm">
                    <span className="block mb-1">Demo Credentials:</span>
                    <span className="font-bold">Username & Password: M24101</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
