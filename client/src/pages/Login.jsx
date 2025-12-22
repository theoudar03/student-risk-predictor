import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaUserGraduate, FaLock, FaEnvelope } from 'react-icons/fa';

const Login = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            const data = await response.json();
            
            if (data.success) {
                onLogin(data.user);
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Server error. Please try again.');
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
                                <span className="input-group-text bg-light border-end-0"><FaEnvelope className="text-muted" /></span>
                                <Form.Control 
                                    type="email" 
                                    name="email" 
                                    placeholder="Email Address" 
                                    className="bg-light border-start-0 py-3" 
                                    value={credentials.email}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-4">
                             <div className="input-group">
                                <span className="input-group-text bg-light border-end-0"><FaLock className="text-muted" /></span>
                                <Form.Control 
                                    type="password" 
                                    name="password" 
                                    placeholder="Password" 
                                    className="bg-light border-start-0 py-3" 
                                    value={credentials.password}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </Form.Group>

                        <div className="d-flex justify-content-between mb-4 small">
                            <Form.Check type="checkbox" label="Remember me" />
                            <a href="#" className="text-decoration-none">Forgot Password?</a>
                        </div>

                        <Button variant="primary" type="submit" className="w-100 py-3 fw-bold shadow-sm" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </Button>
                    </Form>
                    
                    <div className="text-center mt-4 pt-3 border-top">
                        <small className="text-muted">Don't have an account? <a href="#" className="fw-bold text-decoration-none">Contact Admin</a></small>
                    </div>
                    <div className="text-center mt-3">
                        <small className="text-muted fst-italic">Demo: sarah.jones@edu.com / pass</small>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default Login;
