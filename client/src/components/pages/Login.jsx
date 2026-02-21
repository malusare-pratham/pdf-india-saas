import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login, error: authError, loading } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const ok = await login(formData.email, formData.password);
        if (ok) {
            const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
            if (currentUser?.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Log in to access your saved PDF documents</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-icon-wrapper">
                            <FaEnvelope className="input-icon" />
                            <input 
                                type="email" 
                                name="email"
                                placeholder="name@company.com" 
                                value={formData.email}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="label-row">
                            <label>Password</label>
                            <Link to="/login" id="forgot-link">Forgot?</Link>
                        </div>
                        <div className="input-icon-wrapper">
                            <FaLock className="input-icon" />
                            <input 
                                type="password" 
                                name="password"
                                placeholder="••••••••" 
                                value={formData.password}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                        Sign In <FaArrowRight />
                    </button>
                </form>
                {authError && <p className="error-message">{authError}</p>}

                <div className="auth-divider">
                    <span>or continue with</span>
                </div>

                <button className="btn btn-google">
                    <FaGoogle /> Google
                </button>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Create one for free</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
