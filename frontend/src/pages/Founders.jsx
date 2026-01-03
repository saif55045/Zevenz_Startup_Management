import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { foundersAPI } from '../services/foundersApi';
import { authAPI } from '../services/api';
import PasswordInput from '../components/PasswordInput';
import './Founders.css';

const Founders = () => {
    const { isActive } = useAuth();
    const [founders, setFounders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [generatedCredentials, setGeneratedCredentials] = useState(null);
    const [error, setError] = useState('');

    // Password reset state
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetting, setResetting] = useState(false);
    const [resetResult, setResetResult] = useState(null);
    const [resetError, setResetError] = useState('');

    useEffect(() => {
        fetchFounders();
    }, []);

    const fetchFounders = async () => {
        try {
            const res = await foundersAPI.getAll();
            setFounders(res.data);
        } catch (err) {
            console.error('Failed to load founders');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!newName.trim() || !newEmail.trim()) return;

        setGenerating(true);
        setError('');

        try {
            const res = await foundersAPI.generateCredentials(newName, newEmail);
            setGeneratedCredentials(res.data.credentials);
            fetchFounders();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate credentials');
        } finally {
            setGenerating(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!resetCode.trim() || !newPassword.trim()) {
            setResetError('Please enter reset code and new password');
            return;
        }

        if (newPassword !== confirmPassword) {
            setResetError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setResetError('Password must be at least 6 characters');
            return;
        }

        setResetting(true);
        setResetError('');

        try {
            const res = await authAPI.resetPassword(resetCode, newPassword);
            setResetResult({
                success: true,
                userName: res.data.userName,
                email: res.data.email
            });
        } catch (err) {
            setResetError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setResetting(false);
        }
    };

    const closeModal = () => {
        setShowGenerateModal(false);
        setNewName('');
        setNewEmail('');
        setGeneratedCredentials(null);
        setError('');
    };

    const closeResetModal = () => {
        setShowResetModal(false);
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setResetResult(null);
        setResetError('');
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <Layout title="Founders">
                <div className="founders-loading">Loading founders...</div>
            </Layout>
        );
    }

    return (
        <Layout title="Founders">
            <div className="founders-page">
                <div className="founders-header">
                    <p className="founders-subtitle">
                        {founders.length} co-founders building together
                    </p>
                    <div className="founders-actions">
                        {isActive && (
                            <>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowResetModal(true)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    Reset Password
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowGenerateModal(true)}
                                >
                                    + Generate Credentials
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="founders-grid">
                    {founders.map((founder) => (
                        <div key={founder._id} className="founder-card">
                            <div className="founder-avatar-section">
                                {founder.avatar ? (
                                    <img src={founder.avatar} alt={founder.name} className="founder-avatar-img" />
                                ) : (
                                    <div className="founder-avatar">
                                        {getInitials(founder.name)}
                                    </div>
                                )}
                                <span className={`badge badge-${founder.status.toLowerCase()}`}>
                                    {founder.status}
                                </span>
                            </div>

                            <div className="founder-info">
                                <h3 className="founder-name">{founder.name}</h3>
                                <p className="founder-email">{founder.email}</p>
                            </div>

                            <div className="founder-stats">
                                <div className="founder-stat">
                                    <span className="stat-value">{founder.consistencyScore}%</span>
                                    <span className="stat-label">Consistency</span>
                                </div>
                                <div className="founder-stat">
                                    <span className="stat-value">{founder.consecutiveAbsences || 0}</span>
                                    <span className="stat-label">Absences</span>
                                </div>
                            </div>

                            <div className="founder-meta">
                                <span>Joined {formatDate(founder.createdAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Generate Credentials Modal */}
                {showGenerateModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal generate-modal" onClick={e => e.stopPropagation()}>
                            {!generatedCredentials ? (
                                <>
                                    <h3>Generate Credentials</h3>
                                    <p className="modal-subtitle">Create login for a new co-founder</p>

                                    {error && <div className="alert alert-error">{error}</div>}

                                    <form onSubmit={handleGenerate}>
                                        <div className="input-group">
                                            <label className="input-label">Full Name</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                placeholder="e.g. John Doe"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Email</label>
                                            <input
                                                type="email"
                                                className="input"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                placeholder="e.g. john@zevenz.com"
                                            />
                                        </div>
                                        <div className="modal-actions">
                                            <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={generating || !newName.trim() || !newEmail.trim()}
                                            >
                                                {generating ? 'Generating...' : 'Generate'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <div className="success-icon">✓</div>
                                    <h3>Credentials Generated!</h3>
                                    <p className="modal-subtitle">Share these with the new founder</p>

                                    <div className="credentials-box">
                                        <div className="credential-item">
                                            <span className="credential-label">Email</span>
                                            <span className="credential-value">{generatedCredentials.email}</span>
                                        </div>
                                        <div className="credential-item">
                                            <span className="credential-label">Password</span>
                                            <span className="credential-value password">{generatedCredentials.password}</span>
                                        </div>
                                    </div>

                                    <button className="btn btn-primary" onClick={closeModal}>
                                        Done
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Reset Password Modal */}
                {showResetModal && (
                    <div className="modal-overlay" onClick={closeResetModal}>
                        <div className="modal reset-modal" onClick={e => e.stopPropagation()}>
                            {!resetResult ? (
                                <>
                                    <h3>Reset Founder Password</h3>
                                    <p className="modal-subtitle">
                                        Enter the reset code shared by the founder who needs help
                                    </p>

                                    {resetError && <div className="alert alert-error">{resetError}</div>}

                                    <form onSubmit={handleResetPassword}>
                                        <div className="input-group">
                                            <label className="input-label">Reset Code</label>
                                            <input
                                                type="text"
                                                className="input reset-code-input"
                                                value={resetCode}
                                                onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                                                placeholder="e.g. A1B2C3D4"
                                                maxLength={8}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">New Password</label>
                                            <PasswordInput
                                                className="input"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Minimum 6 characters"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Confirm Password</label>
                                            <PasswordInput
                                                className="input"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                        <div className="modal-actions">
                                            <button type="button" className="btn btn-secondary" onClick={closeResetModal}>
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={resetting || !resetCode.trim() || !newPassword.trim()}
                                            >
                                                {resetting ? 'Resetting...' : 'Reset Password'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <div className="success-icon">✓</div>
                                    <h3>Password Reset!</h3>
                                    <p className="modal-subtitle">
                                        Password has been reset for <strong>{resetResult.userName}</strong>
                                    </p>
                                    <p className="reset-email-info">({resetResult.email})</p>

                                    <button className="btn btn-primary" onClick={closeResetModal} style={{ marginTop: '16px' }}>
                                        Done
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Founders;
