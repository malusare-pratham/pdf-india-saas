import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaFilePdf, FaUserCircle, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="flag-stripe"></div>
            <div className="container nav-container">
                {/* Logo */}
                <Link title="PDF India Home" to="/" className="nav-logo">
                    <FaFilePdf className="logo-icon" />
                    <span>PDF <span className="logo-accent">India</span></span>
                </Link>

                {/* Mobile Menu Icon */}
                <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <FaTimes /> : <FaBars />}
                </div>

                {/* Nav Links */}
                <ul className={isOpen ? "nav-menu active" : "nav-menu"}>
                    <li className="nav-item">
                        <Link to="/all-tools" className="nav-link">All Tools</Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/govt-resize" className="nav-link">Govt Forms</Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/pricing" className="nav-link">Pricing</Link>
                    </li>
                    {!user ? (
                        <>
                            <li className="nav-item">
                                <Link to="/login" className="nav-btn-login">
                                    <FaUserCircle /> Login
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/register" className="nav-btn-signup">Get Started</Link>
                            </li>
                        </>
                    ) : (
                        <>
                            {user.role === 'admin' && (
                                <li className="nav-item">
                                    <Link to="/admin/dashboard" className="nav-link">Admin</Link>
                                </li>
                            )}
                            <li className="nav-item">
                                <Link to="/dashboard" className="nav-btn-login">
                                    <FaUserCircle /> Dashboard
                                </Link>
                            </li>
                            <li className="nav-item">
                                <button type="button" className="nav-btn-signup" onClick={handleLogout}>
                                    <FaSignOutAlt /> Logout
                                </button>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
