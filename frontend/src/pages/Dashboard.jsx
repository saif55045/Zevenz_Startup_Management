import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/dashboardApi';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedFounder, setSelectedFounder] = useState(null);
    const [founderDetails, setFounderDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await dashboardAPI.getStats();
            setStats(res.data);
        } catch (err) {
            console.error('Failed to load dashboard stats');
        } finally {
            setLoading(false);
        }
    };

    const fetchFounderDetails = async (founderId) => {
        setLoadingDetails(true);
        try {
            const res = await dashboardAPI.getContributions(founderId);
            setFounderDetails(res.data);
            setSelectedFounder(founderId);
        } catch (err) {
            console.error('Failed to load founder details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const closeModal = () => {
        setSelectedFounder(null);
        setFounderDetails(null);
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <Layout title="Dashboard">
            <div className="dashboard">
                {/* Stats Grid */}
                <div className="dashboard-stats">
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">Status</span>
                            <div className="stat-icon purple">◈</div>
                        </div>
                        <div className={`badge badge-${user?.status?.toLowerCase()} badge-lg`}>
                            {user?.status}
                        </div>
                        <p className="stat-subtext" style={{ marginTop: '12px' }}>Current access level</p>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">Consistency</span>
                            <div className="stat-icon green">◉</div>
                        </div>
                        <div className="stat-value success">{user?.consistencyScore || 100}%</div>
                        <p className="stat-subtext">Present days ratio</p>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">Dead Tasks</span>
                            <div className="stat-icon yellow">⚡</div>
                        </div>
                        <div className="stat-value muted">{stats?.deadTasks || 0}</div>
                        <p className="stat-subtext">Tasks need attention</p>
                    </div>
                </div>

                {/* Attendance Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Attendance Overview</h3>
                        <p className="chart-subtitle">Your activity over the last 30 days</p>
                    </div>
                    {loading ? (
                        <div className="chart-loading">Loading...</div>
                    ) : (() => {
                        const presentDays = stats?.attendance?.filter(d => d.present).length || 0;
                        const totalDays = stats?.attendance?.length || 30;
                        const absentDays = totalDays - presentDays;
                        const presentPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
                        return (
                            <div className="pie-chart-container">
                                <div
                                    className="pie-chart"
                                    style={{
                                        background: `conic-gradient(
                                            var(--color-success) 0deg ${presentPct * 3.6}deg,
                                            var(--color-bg-elevated) ${presentPct * 3.6}deg 360deg
                                        )`
                                    }}
                                >
                                    <div className="pie-chart-inner">
                                        <span className="pie-value">{presentPct}%</span>
                                        <span className="pie-label">Present</span>
                                    </div>
                                </div>
                                <div className="pie-legend">
                                    <div className="pie-legend-item">
                                        <span className="legend-dot present"></span>
                                        <span>Present: {presentDays} days</span>
                                    </div>
                                    <div className="pie-legend-item">
                                        <span className="legend-dot absent"></span>
                                        <span>Absent: {absentDays} days</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Contribution Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Team Contributions</h3>
                        <p className="chart-subtitle">Click on a founder to see details</p>
                    </div>
                    {loading ? (
                        <div className="chart-loading">Loading...</div>
                    ) : (() => {
                        const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#f472b6'];
                        const total = stats?.contributions?.reduce((sum, f) => sum + f.activities + f.tasksDone, 0) || 1;
                        let currentDeg = 0;
                        const segments = stats?.contributions?.map((founder, idx) => {
                            const value = founder.activities + founder.tasksDone;
                            const pct = (value / total) * 100;
                            const deg = pct * 3.6;
                            const segment = { ...founder, color: colors[idx % colors.length], startDeg: currentDeg, endDeg: currentDeg + deg, pct: Math.round(pct), value };
                            currentDeg += deg;
                            return segment;
                        }) || [];

                        const gradient = segments.length > 0
                            ? segments.map(s => `${s.color} ${s.startDeg}deg ${s.endDeg}deg`).join(', ')
                            : 'var(--color-bg-elevated) 0deg 360deg';

                        return (
                            <div className="pie-chart-container">
                                <div
                                    className="pie-chart contribution-pie"
                                    style={{ background: `conic-gradient(${gradient})` }}
                                >
                                    <div className="pie-chart-inner">
                                        <span className="pie-value">{total}</span>
                                        <span className="pie-label">Total</span>
                                    </div>
                                </div>
                                <div className="pie-legend clickable">
                                    {segments.map((s) => (
                                        <div
                                            key={s._id}
                                            className="pie-legend-item clickable"
                                            onClick={() => fetchFounderDetails(s._id)}
                                        >
                                            <span className="legend-dot" style={{ backgroundColor: s.color }}></span>
                                            <span>{s.name}: {s.value} ({s.pct}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Founder Details Modal */}
                {selectedFounder && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal contribution-modal" onClick={e => e.stopPropagation()}>
                            {loadingDetails ? (
                                <div className="chart-loading">Loading...</div>
                            ) : founderDetails && (
                                <>
                                    <div className="modal-header">
                                        <div className="contribution-avatar lg">{getInitials(founderDetails.founder.name)}</div>
                                        <div>
                                            <h3>{founderDetails.founder.name}</h3>
                                            <span className={`badge badge-${founderDetails.founder.status.toLowerCase()}`}>
                                                {founderDetails.founder.status}
                                            </span>
                                        </div>
                                        <button className="modal-close" onClick={closeModal}>×</button>
                                    </div>

                                    <div className="modal-section">
                                        <h4>Recent Activities ({founderDetails.recentActivities.length})</h4>
                                        {founderDetails.recentActivities.length === 0 ? (
                                            <p className="empty-text">No activities yet</p>
                                        ) : (
                                            <ul className="activity-list">
                                                {founderDetails.recentActivities.map(a => (
                                                    <li key={a._id}>
                                                        <span className="activity-date">{formatDate(a.date)}</span>
                                                        <span className="activity-content">{a.content}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="modal-section">
                                        <h4>Completed Tasks ({founderDetails.completedTasks.length})</h4>
                                        {founderDetails.completedTasks.length === 0 ? (
                                            <p className="empty-text">No tasks completed yet</p>
                                        ) : (
                                            <ul className="task-list">
                                                {founderDetails.completedTasks.map((t, idx) => (
                                                    <li key={idx}>
                                                        <span className="task-title">{t.taskTitle}</span>
                                                        <span className="task-plan">from {t.planTitle}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Dashboard;


