import React from 'react';
import { Link } from 'react-router-dom';
import { FaFilePdf, FaTwitter, FaLinkedin, FaGithub, FaHeart } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    {/* Brand Section */}
                    <div className="footer-brand">
                        <Link to="/" className="footer-logo">
                            <FaFilePdf className="logo-icon" />
                            <span>PDF <span className="logo-accent">India</span></span>
                        </Link>
                        <p className="footer-desc">
                            भारतातील सर्वात जलद आणि सुरक्षित PDF टूल्स. सरकारी फॉर्म्सपासून असाइनमेंटपर्यंत सर्व काही एकाच ठिकाणी.
                        </p>
                        <div className="social-links">
                            <a href="#"><FaTwitter /></a>
                            <a href="#"><FaLinkedin /></a>
                            <a href="#"><FaGithub /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-links">
                        <h3>Popular Tools</h3>
                        <ul>
                            <li><Link to="/merge-pdf">Merge PDF</Link></li>
                            <li><Link to="/split-pdf">Split PDF</Link></li>
                            <li><Link to="/compress-pdf">Compress PDF</Link></li>
                            <li><Link to="/govt-resize">Govt Form Resizer</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="footer-links">
                        <h3>Company</h3>
                        <ul>
                            <li><Link to="/">About Us</Link></li>
                            <li><Link to="/pricing">Pricing</Link></li>
                            <li><Link to="/login">Contact</Link></li>
                            <li><Link to="/">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="footer-links">
                        <h3>Support</h3>
                        <p>Any issues? Reach us at:</p>
                        <a href="mailto:support@pdfindia.com" className="support-email">support@pdfindia.com</a>
                        <div className="made-in-india">
                            <span>🇮🇳 Made in India</span>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} PDF India Smart Tools. All rights reserved.</p>
                    <p className="made-with">
                        Made with <FaHeart className="heart-icon" /> for Indian Students & Professionals
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
