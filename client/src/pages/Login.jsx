import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
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
            // Using relative path, assuming baseURL is set in App.jsx
            const response = await axios.post('/api/auth/login', credentials);
            const data = response.data;
            
            if (data.success) {
                // Pass full data including token and user
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
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #4361EE 0%, #3046B1 100%)' }}>
            <Container style={{ maxWidth: 450 }}>
                <div className="glass-card border-0 shadow-lg p-5">
                    <div className="text-center mb-5">
                        <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 text-primary shadow-sm" style={{ width: 80, height: 80, fontSize: 32 }}>
                            <FaUserGraduate />
                        </div>
                        <h2 className="fw-bold mb-1">Welcome Back</h2>
                        <p className="text-secondary opacity-75">Sign in to access student analytics</p>
                    </div>

                    {error && <Alert variant="danger" className="text-center small py-2">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-4">
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0"><FaUser className="text-muted" /></span>
                                <Form.Control 
                                    type="text" 
                                    name="username" 
                                    placeholder="Username" 
                                    className="bg-light border-start-0 py-3" 
                                    value={credentials.username}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-4">
                             <div className="input-group">
                                <span className="input-group-text bg-light border-end-0"><FaLock className="text-muted" /></span>
                                <Form.Control 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    placeholder="Password" 
                                    className="bg-light border-start-0 border-end-0 py-3" 
                                    value={credentials.password}
                                    onChange={handleChange}
                                    required 
                                />
                                <span 
                                    className="input-group-text bg-light border-start-0" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    style={{ cursor: 'pointer' }}
                                >
                                    {showPassword ? <FaEyeSlash className="text-muted" /> : <FaEye className="text-muted" />}
                                </span>
                            </div>
                        </Form.Group>

                        <div className="d-flex justify-content-between mb-4 small">
                            <Form.Check type="checkbox" label="Remember me" />
                            <a href="#" className="text-decoration-none">Forgot Password?</a>
                        </div>

                        <Button variant="primary" type="submit" className="w-100 py-3 fw-bold shadow-sm" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </Button>
                        
                        {isTakingLong && (
                            <div className="text-center mt-3 small text-muted fade-in">
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Waking up secure server... this may take a moment.
                            </div>
                        )}
                    </Form>
                    


                </div>
                <div className="text-center mt-3 text-white">
                    <small style={{ opacity: 0.8 }}>Demo Credentials:</small><br/>
                    <small className="fw-bold">Username & Password: M24101</small>
                </div>
            </Container>
        </div>
    );
};

export default Login;
