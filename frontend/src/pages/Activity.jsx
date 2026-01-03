import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { activityAPI } from '../services/activityApi';
import './Activity.css';

const Activity = () => {
    const { user, isActive } = useAuth();
    const [content, setContent] = useState('');
    const [todayActivity, setTodayActivity] = useState(null);
    const [myActivities, setMyActivities] = useState([]);
    const [allActivities, setAllActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('team');

    // Date filter state
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    // Fetch team activities when date filter changes
    useEffect(() => {
        if (activeTab === 'team') {
            fetchTeamActivities();
        }
    }, [filterDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [todayRes, myRes, allRes] = await Promise.all([
                activityAPI.getToday(),
                activityAPI.getMine(),
                activityAPI.getAll(filterDate || null)
            ]);
            setTodayActivity(todayRes.data);
            setMyActivities(myRes.data);
            setAllActivities(allRes.data);
            if (todayRes.data) {
                setContent(todayRes.data.content);
            }
        } catch (err) {
            setError('Failed to load activities');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamActivities = async () => {
        try {
            const allRes = await activityAPI.getAll(filterDate || null);
            setAllActivities(allRes.data);
        } catch (err) {
            console.error('Failed to fetch team activities');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await activityAPI.create(content);
            setSuccess('Activity saved successfully!');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save activity');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (dateStr === today) return 'Today';
        if (dateStr === yesterday) return 'Yesterday';

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    };

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const handleClearFilter = () => {
        setFilterDate('');
    };

    const activities = activeTab === 'team' ? allActivities : myActivities;

    return (
        <Layout title="Daily Activity">
            <div className="activity-page">
                {/* Activity Form */}
                {isActive ? (
                    <div className="activity-form-card">
                        <div className="activity-form-header">
                            <h3>What did you work on today?</h3>
                            <p>Share your daily progress with the team</p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <form onSubmit={handleSubmit}>
                            <textarea
                                className="activity-textarea"
                                placeholder="Describe your work for today..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={4}
                            />
                            <div className="activity-form-footer">
                                <span className="activity-hint">
                                    {todayActivity ? 'Updating today\'s activity' : 'Posting marks you present'}
                                </span>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting || !content.trim()}
                                >
                                    {submitting ? 'Saving...' : todayActivity ? 'Update' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="activity-restricted">
                        <div className="restricted-icon">⚠</div>
                        <h3>You are marked OUT</h3>
                        <p>You cannot post activities while your status is OUT. Request reactivation to regain access.</p>
                    </div>
                )}

                {/* Activity History with Tabs */}
                <div className="activity-history">
                    <div className="history-header">
                        <h3 className="history-title">Activity History</h3>
                        <div className="history-tabs">
                            <button
                                className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
                                onClick={() => setActiveTab('team')}
                            >
                                Team
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
                                onClick={() => setActiveTab('mine')}
                            >
                                Mine
                            </button>
                        </div>
                    </div>

                    {/* Date Filter for Team Tab */}
                    {activeTab === 'team' && (
                        <div className="date-filter">
                            <div className="date-filter-group">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    max={getTodayDate()}
                                    className="date-input"
                                />
                                {filterDate && (
                                    <button
                                        className="clear-filter-btn"
                                        onClick={handleClearFilter}
                                        title="Clear filter"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            {filterDate && (
                                <span className="filter-label">
                                    Showing activities for {formatDate(filterDate)}
                                </span>
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div className="history-loading">Loading...</div>
                    ) : activities.length === 0 ? (
                        <div className="history-empty">
                            <p>{filterDate ? `No activities found for ${formatDate(filterDate)}` : 'No activities yet. Start by posting your first update!'}</p>
                        </div>
                    ) : (
                        <div className="history-list">
                            {activities.map((activity) => (
                                <div key={activity._id} className="history-item">
                                    <div className="history-item-header">
                                        {activeTab === 'team' && (
                                            <div className="history-user">
                                                <div className="history-avatar">{getInitials(activity.user?.name)}</div>
                                                <span className="history-name">{activity.user?.name}</span>
                                            </div>
                                        )}
                                        <div className="history-date">{formatDate(activity.date)}</div>
                                    </div>
                                    <div className="history-content">{activity.content}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Activity;
