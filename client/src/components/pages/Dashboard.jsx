import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaHistory, FaUserCircle, FaCreditCard, 
    FaFilePdf, FaTrash, FaDownload, FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
    cancelMySubscription,
    deleteMyFileHistory,
    getFileDownloadUrl,
    getMyFileHistory,
    getMyProfile,
    getMySubscription,
} from '../../service/api';
import './Dashboard.css';

const Dashboard = () => {
    const { logout, user, loading: authLoading, updateUser } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('recent');
    const [profile, setProfile] = useState(null);
    const [recentFiles, setRecentFiles] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/login');
            return;
        }

        const loadDashboardData = async () => {
            setLoading(true);
            setError('');
            try {
                const [profileRes, filesRes] = await Promise.all([
                    getMyProfile(),
                    getMyFileHistory(20),
                ]);

                setProfile(profileRes.data?.data || null);
                setRecentFiles(filesRes.data?.data || []);
                try {
                    const subRes = await getMySubscription();
                    setSubscription(subRes.data?.data?.subscription || null);
                } catch {
                    setSubscription(null);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [authLoading, user, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDelete = async (id) => {
        try {
            await deleteMyFileHistory(id);
            setRecentFiles((prev) => prev.filter((file) => file.id !== id));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete file.');
        }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString();
    const formatSize = (bytes) => {
        if (!bytes || bytes <= 0) return '0 KB';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const totalFiles = profile?.total_files_processed ?? recentFiles.length;
    const spaceSaved = useMemo(() => {
        const savedBytes = recentFiles.reduce((acc, file) => {
            const original = Number(file.originalSize || 0);
            const processed = Number(file.processedSize || 0);
            const delta = original - processed;
            return delta > 0 ? acc + delta : acc;
        }, 0);
        return formatSize(savedBytes);
    }, [recentFiles]);

    const planType = profile?.plan_type || user?.plan_type || 'free';
    const planStatus = planType === 'premium' ? 'Premium' : 'Free';
    const subscriptionEnd = subscription?.end_date
        ? new Date(subscription.end_date).toLocaleDateString()
        : 'N/A';

    const handleCancelSubscription = async () => {
        try {
            const res = await cancelMySubscription();
            setSubscription(null);
            setProfile((prev) => ({
                ...(prev || {}),
                plan_type: 'free',
                subscription_status: 'cancelled',
            }));
            updateUser({ ...(user || {}), plan_type: 'free' });
            setError('');
            alert(res.data?.message || 'Subscription cancelled successfully.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cancel subscription.');
        }
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar Navigation */}
            <aside className="dashboard-sidebar">
                <div className="user-profile-section">
                    <FaUserCircle className="profile-large-icon" />
                    <h3>{profile?.full_name || user?.full_name || 'User'}</h3>
                    <span className="badge-free">{planType} Plan</span>
                </div>
                
                <nav className="dashboard-nav">
                    <button
                        className={`nav-item ${activeSection === 'recent' ? 'active' : ''}`}
                        onClick={() => setActiveSection('recent')}
                    >
                        <FaHistory /> Recent Files
                    </button>
                    <button
                        className={`nav-item ${activeSection === 'billing' ? 'active' : ''}`}
                        onClick={() => setActiveSection('billing')}
                    >
                        <FaCreditCard /> Billing & Plans
                    </button>
                    <button className="nav-item sign-out-btn" onClick={handleLogout}><FaSignOutAlt /> Log Out</button>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <h1>My Dashboard</h1>
                    <p>Manage your processed documents and account settings</p>
                </header>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-label">Total Files</span>
                        <span className="stat-value">{totalFiles}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Space Saved</span>
                        <span className="stat-value">{spaceSaved}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Plan Status</span>
                        <span className="stat-value text-blue">{planStatus}</span>
                    </div>
                </div>

                {activeSection === 'recent' && (
                    <section className="activity-section">
                        <h3><FaHistory /> Recent Activity</h3>
                        {loading && <p>Loading dashboard...</p>}
                        {error && <p className="error-message">{error}</p>}
                        <div className="table-responsive">
                            <table className="activity-table">
                                <thead>
                                    <tr>
                                        <th>File Name</th>
                                        <th>Tool Used</th>
                                        <th>Date</th>
                                        <th>Size</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!loading && recentFiles.length === 0 && (
                                        <tr>
                                            <td colSpan="5">No recent files yet. Use any PDF tool to see activity here.</td>
                                        </tr>
                                    )}
                                    {recentFiles.map((file) => (
                                        <tr key={file.id}>
                                            <td className="file-cell"><FaFilePdf className="pdf-mini-icon" /> {file.fileName}</td>
                                            <td>{file.toolLabel}</td>
                                            <td>{formatDate(file.createdAt)}</td>
                                            <td>{formatSize(file.processedSize)}</td>
                                            <td className="action-btns">
                                                <a
                                                    href={getFileDownloadUrl(file.downloadUrl)}
                                                    className="icon-btn download"
                                                    title="Download"
                                                    download
                                                >
                                                    <FaDownload />
                                                </a>
                                                <button
                                                    className="icon-btn delete"
                                                    title="Delete"
                                                    onClick={() => handleDelete(file.id)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeSection === 'billing' && (
                    <section className="activity-section">
                        <h3><FaCreditCard /> Billing & Plans</h3>
                        {error && <p className="error-message">{error}</p>}
                        <div className="billing-card">
                            <p><strong>Current Plan:</strong> {planStatus}</p>
                            <p><strong>Subscription Status:</strong> {profile?.subscription_status || 'N/A'}</p>
                            <p><strong>Valid Till:</strong> {subscriptionEnd}</p>
                            <div className="billing-actions">
                                <button className="billing-btn primary" onClick={() => navigate('/pricing')}>
                                    Change / Upgrade Plan
                                </button>
                                {planType === 'premium' && (
                                    <button className="billing-btn danger" onClick={handleCancelSubscription}>
                                        Cancel Subscription
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
