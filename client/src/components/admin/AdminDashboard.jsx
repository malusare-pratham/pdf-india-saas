import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUsers,
    FaFileInvoiceDollar,
    FaChartLine,
    FaUserEdit,
    FaTrash,
    FaSearch,
    FaFilePdf,
    FaSync,
} from 'react-icons/fa';
import {
    deleteAdminUser,
    getAdminHealth,
    getAdminReportSummary,
    getAdminStats,
    getAdminTransactions,
    getAdminUsers,
    updateAdminUser,
} from '../../service/api';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const TABS = {
    overview: 'overview',
    users: 'users',
    transactions: 'transactions',
    reports: 'reports',
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState(TABS.overview);
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [stats, setStats] = useState(null);
    const [health, setHealth] = useState(null);
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [report, setReport] = useState(null);
    const [userPage, setUserPage] = useState(1);
    const [userPages, setUserPages] = useState(1);
    const [txPage, setTxPage] = useState(1);
    const [txPages, setTxPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const toCurrency = (value = 0) => `INR ${Number(value).toLocaleString()}`;
    const toPlan = (planType) => (planType === 'premium' ? 'Pro' : 'Free');
    const toStatus = (status) => {
        if (status === 'active') return 'Active';
        if (status === 'cancelled') return 'Cancelled';
        if (status === 'success') return 'Active';
        return 'Inactive';
    };

    const handleAuthError = (err) => {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
            navigate('/login');
            return true;
        }
        return false;
    };

    const loadBaseData = async () => {
        const [statsRes, healthRes] = await Promise.all([getAdminStats(), getAdminHealth()]);
        setStats(statsRes.data?.stats || null);
        setHealth(healthRes.data || null);
    };

    const loadUsers = async (page = 1, q = '') => {
        const res = await getAdminUsers(page, 10, q);
        setUsers(res.data?.data || []);
        setUserPage(res.data?.page || page);
        setUserPages(res.data?.pages || 1);
    };

    const loadTransactions = async (page = 1, q = '') => {
        const res = await getAdminTransactions(page, 10, q);
        setTransactions(res.data?.data || []);
        setTxPage(res.data?.page || page);
        setTxPages(res.data?.pages || 1);
    };

    const loadReports = async () => {
        const res = await getAdminReportSummary();
        setReport(res.data?.data || null);
    };

    const loadCurrentTab = async (targetTab = activeTab, page = 1, q = query) => {
        setLoading(true);
        setError('');
        try {
            await loadBaseData();

            if (targetTab === TABS.users) {
                await loadUsers(page, q);
            } else if (targetTab === TABS.transactions) {
                await loadTransactions(page, q);
            } else if (targetTab === TABS.reports) {
                await loadReports();
            }
        } catch (err) {
            if (handleAuthError(err)) return;
            setError(err.response?.data?.message || 'Failed to load admin dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        loadCurrentTab(activeTab, 1, '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, activeTab]);

    const onSearch = async (e) => {
        e.preventDefault();
        const q = search.trim();
        setQuery(q);
        if (activeTab === TABS.users) {
            await loadCurrentTab(TABS.users, 1, q);
        }
        if (activeTab === TABS.transactions) {
            await loadCurrentTab(TABS.transactions, 1, q);
        }
    };

    const handleTogglePlan = async (targetUser) => {
        const nextPlan = targetUser.plan_type === 'premium' ? 'free' : 'premium';
        try {
            await updateAdminUser(targetUser._id, {
                plan_type: nextPlan,
                subscription_status: nextPlan === 'premium' ? 'active' : 'expired',
            });
            await loadCurrentTab(TABS.users, userPage, query);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update plan.');
        }
    };

    const handleToggleRole = async (targetUser) => {
        const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
        try {
            await updateAdminUser(targetUser._id, { role: nextRole });
            await loadCurrentTab(TABS.users, userPage, query);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update role.');
        }
    };

    const handleDeleteUser = async (targetUser) => {
        if (String(targetUser._id) === String(user?._id)) {
            setError('You cannot delete your own admin account.');
            return;
        }
        const ok = window.confirm(`Delete user ${targetUser.email}?`);
        if (!ok) return;
        try {
            await deleteAdminUser(targetUser._id);
            await loadCurrentTab(TABS.users, userPage, query);
        } catch (err) {
            const raw = typeof err.response?.data === 'string' ? err.response.data : '';
            const parsed =
                err.response?.data?.message ||
                err.response?.data?.error ||
                (raw.includes('Cannot DELETE') ? 'Delete API route not loaded on server. Please restart backend.' : '');
            setError(parsed || err.message || 'Failed to delete user.');
        }
    };

    const overviewTools = useMemo(() => stats?.toolUsageBreakdown || [], [stats]);

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <h2>PDF<span>India</span></h2>
                    <p>Admin Panel</p>
                </div>
                <nav className="admin-nav">
                    <button className={`nav-item ${activeTab === TABS.overview ? 'active' : ''}`} onClick={() => setActiveTab(TABS.overview)}><FaChartLine /> Overview</button>
                    <button className={`nav-item ${activeTab === TABS.users ? 'active' : ''}`} onClick={() => setActiveTab(TABS.users)}><FaUsers /> Users</button>
                    <button className={`nav-item ${activeTab === TABS.transactions ? 'active' : ''}`} onClick={() => setActiveTab(TABS.transactions)}><FaFileInvoiceDollar /> Transactions</button>
                    <button className={`nav-item ${activeTab === TABS.reports ? 'active' : ''}`} onClick={() => setActiveTab(TABS.reports)}><FaFilePdf /> Reports</button>
                </nav>
            </aside>

            <main className="admin-main">
                <header className="admin-top-bar">
                    {(activeTab === TABS.users || activeTab === TABS.transactions) ? (
                        <form className="search-box" onSubmit={onSearch}>
                            <FaSearch />
                            <input
                                type="text"
                                placeholder={activeTab === TABS.users ? 'Search users by name/email...' : 'Search transactions...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>
                    ) : <div />}
                    <div className="admin-profile">
                        <span>{health ? `System: ${health.status}` : 'Admin'}</span>
                        <div className="avatar">{(user?.full_name || 'AD').slice(0, 2).toUpperCase()}</div>
                    </div>
                </header>

                <div className="admin-content">
                    {error && <p className="admin-error">{error}</p>}
                    {loading && <p>Loading admin data...</p>}

                    <div className="admin-stats-grid">
                        <div className="stat-box blue">
                            <div className="stat-info">
                                <h3>{stats?.totalUsers ?? 0}</h3>
                                <p>Total Users</p>
                            </div>
                            <FaUsers className="stat-icon" />
                        </div>
                        <div className="stat-box green">
                            <div className="stat-info">
                                <h3>{toCurrency(stats?.totalRevenue ?? 0)}</h3>
                                <p>Revenue</p>
                            </div>
                            <FaFileInvoiceDollar className="stat-icon" />
                        </div>
                        <div className="stat-box orange">
                            <div className="stat-info">
                                <h3>{stats?.totalFilesProcessed ?? 0}</h3>
                                <p>PDFs Processed</p>
                            </div>
                            <FaFilePdf className="stat-icon" />
                        </div>
                    </div>

                    {activeTab === TABS.overview && (
                        <div className="admin-table-section">
                            <div className="table-header">
                                <h3>Overview</h3>
                                <button className="btn-export" onClick={() => loadCurrentTab(TABS.overview, 1, '')}><FaSync /> Refresh</button>
                            </div>
                            <div className="admin-overview-cards">
                                <div className="overview-card">
                                    <span>System Status</span>
                                    <strong>{health?.status || 'Unknown'}</strong>
                                </div>
                                <div className="overview-card">
                                    <span>Storage Used</span>
                                    <strong>{health?.storageUsedMB || 0} MB</strong>
                                </div>
                                <div className="overview-card">
                                    <span>Server Time</span>
                                    <strong>{health?.serverTime ? new Date(health.serverTime).toLocaleString() : '-'}</strong>
                                </div>
                            </div>
                            <h4 className="section-subtitle">Top Tools</h4>
                            <div className="tool-chip-wrap">
                                {overviewTools.length === 0 && <span className="tool-chip muted">No tool usage yet</span>}
                                {overviewTools.map((tool) => (
                                    <span key={tool._id} className="tool-chip">
                                        {tool._id} <b>{tool.count}</b>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === TABS.users && (
                        <div className="admin-table-section">
                            <div className="table-header">
                                <h3>User Management</h3>
                                <button className="btn-export" onClick={() => loadCurrentTab(TABS.users, userPage, query)}><FaSync /> Refresh</button>
                            </div>
                            <div className="table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Plan</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length === 0 && !loading && (
                                            <tr><td colSpan="5">No users found.</td></tr>
                                        )}
                                        {users.map((row) => (
                                            <tr key={row._id}>
                                                <td><strong>{row.full_name}</strong></td>
                                                <td>{row.email}</td>
                                                <td><span className={`plan-badge ${toPlan(row.plan_type).toLowerCase()}`}>{toPlan(row.plan_type)}</span></td>
                                                <td><span className={`status-dot ${toStatus(row.subscription_status).toLowerCase()}`}>{toStatus(row.subscription_status)}</span></td>
                                                <td className="action-cell">
                                                    <button className="edit-btn" title="Toggle Plan" onClick={() => handleTogglePlan(row)}><FaFileInvoiceDollar /></button>
                                                    <button className="edit-btn" title="Toggle Role" onClick={() => handleToggleRole(row)}><FaUserEdit /></button>
                                                    <button
                                                        className="delete-btn"
                                                        title={String(row._id) === String(user?._id) ? 'Cannot delete own account' : 'Delete User'}
                                                        onClick={() => handleDeleteUser(row)}
                                                        disabled={String(row._id) === String(user?._id)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="admin-pagination">
                                <button type="button" onClick={() => loadCurrentTab(TABS.users, Math.max(userPage - 1, 1), query)} disabled={userPage <= 1 || loading}>Prev</button>
                                <span>Page {userPage} / {userPages}</span>
                                <button type="button" onClick={() => loadCurrentTab(TABS.users, Math.min(userPage + 1, userPages), query)} disabled={userPage >= userPages || loading}>Next</button>
                            </div>
                        </div>
                    )}

                    {activeTab === TABS.transactions && (
                        <div className="admin-table-section">
                            <div className="table-header">
                                <h3>Transactions</h3>
                                <button className="btn-export" onClick={() => loadCurrentTab(TABS.transactions, txPage, query)}><FaSync /> Refresh</button>
                            </div>
                            <div className="table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>User</th>
                                            <th>Txn ID</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.length === 0 && !loading && (
                                            <tr><td colSpan="5">No transactions found.</td></tr>
                                        )}
                                        {transactions.map((tx) => (
                                            <tr key={tx._id}>
                                                <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                                                <td>{tx.user_id?.email || '-'}</td>
                                                <td>{tx.transaction_id}</td>
                                                <td>{toCurrency(tx.amount)}</td>
                                                <td><span className={`status-dot ${toStatus(tx.payment_status).toLowerCase()}`}>{toStatus(tx.payment_status)}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="admin-pagination">
                                <button type="button" onClick={() => loadCurrentTab(TABS.transactions, Math.max(txPage - 1, 1), query)} disabled={txPage <= 1 || loading}>Prev</button>
                                <span>Page {txPage} / {txPages}</span>
                                <button type="button" onClick={() => loadCurrentTab(TABS.transactions, Math.min(txPage + 1, txPages), query)} disabled={txPage >= txPages || loading}>Next</button>
                            </div>
                        </div>
                    )}

                    {activeTab === TABS.reports && (
                        <div className="admin-table-section">
                            <div className="table-header">
                                <h3>Reports (Last {report?.rangeDays || 30} Days)</h3>
                                <button className="btn-export" onClick={() => loadCurrentTab(TABS.reports, 1, '')}><FaSync /> Refresh</button>
                            </div>
                            <div className="admin-overview-cards">
                                <div className="overview-card">
                                    <span>Files Processed</span>
                                    <strong>{report?.filesProcessedLast30Days || 0}</strong>
                                </div>
                                <div className="overview-card">
                                    <span>Revenue</span>
                                    <strong>{toCurrency(report?.revenueLast30Days || 0)}</strong>
                                </div>
                                <div className="overview-card">
                                    <span>Report Window</span>
                                    <strong>{report?.rangeDays || 30} Days</strong>
                                </div>
                            </div>
                            <h4 className="section-subtitle">Top Tools</h4>
                            <div className="tool-chip-wrap">
                                {report?.topTools?.length ? report.topTools.map((t) => (
                                    <span key={t._id} className="tool-chip">
                                        {t._id} <b>{t.count}</b>
                                    </span>
                                )) : <span className="tool-chip muted">No report data</span>}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
