import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../services/attendanceApi';
import './Attendance.css';

const Attendance = () => {
    const { user } = useAuth();
    const [message, setMessage] = useState({ type: '', text: '' });
    const [stats, setStats] = useState(null);
    const [teamData, setTeamData] = useState({ attendance: {}, users: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personal');

    // Leave request state
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveDate, setLeaveDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');
    const [leaveReasonText, setLeaveReasonText] = useState('');
    const [submittingLeave, setSubmittingLeave] = useState(false);

    // Leaves list state
    const [teamLeaves, setTeamLeaves] = useState([]);

    // Manual attendance state
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualDate, setManualDate] = useState('');
    const [runningManual, setRunningManual] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, teamRes] = await Promise.all([
                attendanceAPI.getStats(),
                attendanceAPI.getTeam(30)
            ]);
            setStats(statsRes.data);
            setTeamData(teamRes.data);

            // Extract all leaves from team attendance data
            const leaves = [];
            Object.entries(teamRes.data.attendance).forEach(([date, records]) => {
                Object.entries(records).forEach(([userId, record]) => {
                    if (record.status === 'LEAVE') {
                        const foundUser = teamRes.data.users.find(u => u._id === userId);
                        leaves.push({
                            ...record,
                            userName: foundUser?.name || 'Unknown',
                            date
                        });
                    }
                });
            });
            // Sort by date descending
            leaves.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTeamLeaves(leaves);
        } catch (err) {
            console.error('Failed to load attendance');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PRESENT': return 'green';
            case 'ABSENT': return 'red';
            case 'LEAVE': return 'yellow';
            default: return 'gray';
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const getLast30Days = () => {
        const days = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    };

    const handleLeaveRequest = async (e) => {
        e.preventDefault();
        if (!leaveDate || !leaveReason) {
            setMessage({ type: 'error', text: 'Please select a date and reason' });
            return;
        }

        setSubmittingLeave(true);
        try {
            await attendanceAPI.requestLeave(leaveDate, leaveReason, leaveReasonText);
            setMessage({ type: 'success', text: 'Leave request submitted successfully!' });
            setShowLeaveModal(false);
            setLeaveDate('');
            setLeaveReason('');
            setLeaveReasonText('');
            fetchData(); // Refresh data
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit leave request' });
        } finally {
            setSubmittingLeave(false);
        }
    };

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30); // Allow up to 30 days in advance
        return maxDate.toISOString().split('T')[0];
    };

    const getSevenDaysAgo = () => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date.toISOString().split('T')[0];
    };

    const handleManualRun = async (e) => {
        e.preventDefault();
        if (!manualDate) {
            setMessage({ type: 'error', text: 'Please select a date' });
            return;
        }

        setRunningManual(true);
        try {
            await attendanceAPI.runManual(manualDate);
            setMessage({ type: 'success', text: `Attendance processed for ${manualDate}` });
            setShowManualModal(false);
            setManualDate('');
            fetchData(); // Refresh data
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to run attendance' });
        } finally {
            setRunningManual(false);
        }
    };

    if (loading) {
        return (
            <Layout title="Attendance">
                <div className="attendance-loading">Loading attendance data...</div>
            </Layout>
        );
    }

    return (
        <Layout title="Attendance">
            <div className="attendance-page">
                {/* Message Display */}
                {message.text && (
                    <div className={`message ${message.type}`} onClick={() => setMessage({ type: '', text: '' })}>
                        {message.text}
                    </div>
                )}

                {/* Page Header with Actions */}
                {user?.status === 'ACTIVE' && (
                    <div className="attendance-header">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowManualModal(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="1 4 1 10 7 10"></polyline>
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                            </svg>
                            Run Past Attendance
                        </button>
                        <button
                            className="leave-request-btn"
                            onClick={() => setShowLeaveModal(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                <line x1="12" y1="14" x2="12" y2="18"></line>
                                <line x1="10" y1="16" x2="14" y2="16"></line>
                            </svg>
                            Request Leave
                        </button>
                    </div>
                )}

                {/* Tabs */}
                <div className="attendance-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('personal')}
                    >
                        My Attendance
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
                        onClick={() => setActiveTab('team')}
                    >
                        Team Overview
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
                        onClick={() => setActiveTab('leaves')}
                    >
                        Team Leaves
                    </button>
                </div>

                {activeTab === 'personal' ? (
                    <>
                        {/* Stats Cards */}
                        <div className="attendance-stats">
                            <div className="attendance-stat-card">
                                <span className="stat-number green">{stats?.presentDays || 0}</span>
                                <span className="stat-name">Present</span>
                            </div>
                            <div className="attendance-stat-card">
                                <span className="stat-number red">{stats?.absentDays || 0}</span>
                                <span className="stat-name">Absent</span>
                            </div>
                            <div className="attendance-stat-card">
                                <span className="stat-number yellow">{stats?.leaveDays || 0}</span>
                                <span className="stat-name">Leave</span>
                            </div>
                            <div className="attendance-stat-card">
                                <span className="stat-number">{user?.consistencyScore || 100}%</span>
                                <span className="stat-name">Score</span>
                            </div>
                        </div>

                        {/* Personal Calendar */}
                        <div className="attendance-calendar">
                            <h3 className="calendar-title">Last 30 Days</h3>
                            <div className="calendar-grid">
                                {stats?.records?.map((record) => (
                                    <div
                                        key={record._id}
                                        className={`calendar-day ${getStatusColor(record.status)}`}
                                        title={`${formatDate(record.date)}: ${record.status}${record.reason ? ` (${record.reason})` : ''}`}
                                    >
                                        <span className="day-date">{new Date(record.date).getDate()}</span>
                                    </div>
                                )) || <p className="no-records">No attendance records yet</p>}
                            </div>
                            <div className="calendar-legend">
                                <span className="legend-item"><span className="legend-dot green"></span> Present</span>
                                <span className="legend-item"><span className="legend-dot red"></span> Absent</span>
                                <span className="legend-item"><span className="legend-dot yellow"></span> Leave</span>
                            </div>
                        </div>
                    </>
                ) : activeTab === 'team' ? (
                    /* Team Table */
                    <div className="team-attendance">
                        <div className="team-table-container">
                            <table className="team-table">
                                <thead>
                                    <tr>
                                        <th className="sticky-col">Founder</th>
                                        {getLast30Days().slice(0, 14).map(date => (
                                            <th key={date}>{new Date(date).getDate()}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamData.users.map(founder => (
                                        <tr key={founder._id}>
                                            <td className="sticky-col">
                                                <div className="founder-cell">
                                                    <span className="founder-name">{founder.name}</span>
                                                    <span className={`badge badge-${founder.status.toLowerCase()}`}>{founder.status}</span>
                                                </div>
                                            </td>
                                            {getLast30Days().slice(0, 14).map(date => {
                                                const record = teamData.attendance[date]?.[founder._id];
                                                const tooltip = record?.status === 'LEAVE' && record?.reason
                                                    ? `${record.status}: ${record.reason}${record.reasonText ? ` - ${record.reasonText}` : ''}`
                                                    : record?.status || 'No record';
                                                return (
                                                    <td key={date} title={tooltip}>
                                                        <span className={`status-dot ${getStatusColor(record?.status || 'none')}`}></span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Team Leaves Tab */
                    <div className="team-leaves">
                        <h3 className="leaves-title">Recent Leave Requests</h3>
                        {teamLeaves.length > 0 ? (
                            <div className="leaves-list">
                                {teamLeaves.map((leave, index) => (
                                    <div key={index} className="leave-card">
                                        <div className="leave-header">
                                            <span className="leave-user">{leave.userName}</span>
                                            <span className="leave-date">{formatDate(leave.date)}</span>
                                        </div>
                                        <div className="leave-body">
                                            <span className="leave-reason-badge">{leave.reason || 'No reason specified'}</span>
                                            {leave.reasonText && (
                                                <p className="leave-reason-text">{leave.reasonText}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-leaves">No leave requests found</p>
                        )}
                    </div>
                )}
            </div>

            {/* Leave Request Modal */}
            {showLeaveModal && (
                <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
                    <div className="leave-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Request Leave</h3>
                        <form onSubmit={handleLeaveRequest}>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={leaveDate}
                                    onChange={(e) => setLeaveDate(e.target.value)}
                                    min={getTodayDate()}
                                    max={getMaxDate()}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Reason</label>
                                <select
                                    value={leaveReason}
                                    onChange={(e) => setLeaveReason(e.target.value)}
                                    required
                                >
                                    <option value="">Select a reason</option>
                                    <option value="Health">Health</option>
                                    <option value="Personal">Personal</option>
                                    <option value="Work conflict">Work conflict</option>
                                    <option value="Burnout">Burnout</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Additional Details (Optional)</label>
                                <textarea
                                    value={leaveReasonText}
                                    onChange={(e) => setLeaveReasonText(e.target.value)}
                                    placeholder="Provide more context about your leave..."
                                    rows={3}
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowLeaveModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-submit"
                                    disabled={submittingLeave}
                                >
                                    {submittingLeave ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manual Attendance Modal */}
            {showManualModal && (
                <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
                    <div className="modal leave-modal" onClick={e => e.stopPropagation()}>
                        <h3>Run Past Attendance</h3>
                        <p className="modal-subtitle">
                            Process attendance for a day when the automatic cron missed (server was sleeping).
                            This marks users as PRESENT or ABSENT based on their activity posts.
                        </p>

                        <form onSubmit={handleManualRun}>
                            <div className="form-group">
                                <label>Select Date</label>
                                <input
                                    type="date"
                                    value={manualDate}
                                    onChange={(e) => setManualDate(e.target.value)}
                                    min={getSevenDaysAgo()}
                                    max={getTodayDate()}
                                    required
                                />
                                <span className="form-hint">Only last 7 days can be processed</span>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowManualModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-submit"
                                    disabled={runningManual}
                                >
                                    {runningManual ? 'Processing...' : 'Run Attendance'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Attendance;
