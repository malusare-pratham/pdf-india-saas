import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    FaCompressArrowsAlt, FaRegFilePdf, FaObjectGroup, 
    FaCut, FaFileWord, FaShieldAlt, FaBolt 
} from 'react-icons/fa';
import './Home.css';

const Home = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [clickedToolId, setClickedToolId] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        if (location.pathname === '/all-tools') {
            const toolsSection = document.getElementById('tools-section');
            if (toolsSection) {
                toolsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [location.pathname]);

    const handleToolCardClick = (event, tool) => {
        event.preventDefault();
        if (isNavigating) return;
        setIsNavigating(true);
        setClickedToolId(tool.id);
        window.setTimeout(() => {
            navigate(tool.link);
        }, 180);
    };

    const tools = [
        {
            id: 1,
            title: "Merge PDF",
            desc: "Combine multiple PDF files into one single document easily.",
            icon: <FaObjectGroup />,
            link: "/merge-pdf",
            color: "#2563eb"
        },
        {
            id: 2,
            title: "Compress PDF",
            desc: "Reduce file size without losing quality for faster uploads.",
            icon: <FaCompressArrowsAlt />,
            link: "/compress-pdf",
            color: "#10b981"
        },
        {
            id: 3,
            title: "Split PDF",
            desc: "Extract specific pages or separate every page into individual PDFs.",
            icon: <FaCut />,
            link: "/split-pdf",
            color: "#f59e0b"
        },
        {
            id: 4,
            title: "Govt Form Resizer",
            desc: "Auto-resize photos and PDFs for UPSC, SSC, and Passport portals.",
            icon: <FaRegFilePdf />,
            link: "/govt-resize",
            color: "#ef4444"
        },
        {
            id: 5,
            title: "Word to PDF",
            desc: "Convert your DOCX files to high-quality PDF format instantly.",
            icon: <FaFileWord />,
            link: "/word-to-pdf",
            color: "#3b82f6"
        },
        {
            id: 6,
            title: "Student Mode",
            desc: "Assignment and academic document optimization tools.",
            icon: <FaShieldAlt />,
            link: "/student-mode",
            color: "#6366f1"
        }
    ];

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <div className="hero-content">
                        <h1>Smart PDF Tools for <span className="text-gradient">India</span></h1>
                        <p>Fast, Secure, and Reliable tools for all your document needs. From Government exam forms to professional office work.</p>
                        <div className="hero-btns">
                            <Link to="/all-tools" className="btn btn-primary btn-lg">Explore All Tools</Link>
                            <Link to="/register" className="btn btn-outline btn-lg">Create Free Account</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features/Tools Grid */}
            <section id="tools-section" className="tools-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Every PDF tool you need</h2>
                        <p>We bring all document utilities under one roof for your convenience.</p>
                    </div>

                    <div className="tool-grid">
                        {tools.map((tool) => (
                            <Link
                                to={tool.link}
                                key={tool.id}
                                className={`tool-card ${clickedToolId === tool.id ? 'tool-clicked' : ''}`}
                                onClick={(e) => handleToolCardClick(e, tool)}
                            >
                                <div className="tool-icon" style={{ color: tool.color }}>
                                    {tool.icon}
                                </div>
                                <h3>{tool.title}</h3>
                                <p>{tool.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="why-us">
                <div className="container">
                    <div className="why-grid">
                        <div className="why-item">
                            <FaBolt className="why-icon" />
                            <h4>Lightning Fast</h4>
                            <p>Processes your files in seconds using our high-speed cloud servers.</p>
                        </div>
                        <div className="why-item">
                            <FaShieldAlt className="why-icon" />
                            <h4>100% Secure</h4>
                            <p>Your files are encrypted and automatically deleted after processing.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
