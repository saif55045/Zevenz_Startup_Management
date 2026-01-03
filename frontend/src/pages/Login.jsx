import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import PasswordInput from '../components/PasswordInput';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Forgot password state
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetResult, setResetResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail.trim()) return;

        setResetLoading(true);
        setResetResult(null);

        try {
            const response = await authAPI.requestReset(resetEmail);
            setResetResult({
                success: true,
                code: response.data.code,
                userName: response.data.userName,
                message: response.data.instructions
            });
        } catch (err) {
            setResetResult({
                success: false,
                message: err.response?.data?.message || 'Failed to generate reset code'
            });
        } finally {
            setResetLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const closeModal = () => {
        setShowForgotModal(false);
        setResetEmail('');
        setResetResult(null);
    };

    return (
        <div className="login-page">
            {/* Left Side - Branding */}
            <div className="login-branding">
                <div className="login-branding-content">
                    <div className="login-brand-logo">Z</div>
                    <h1 className="login-brand-title">Zevenz</h1>
                    <p className="login-brand-tagline">
                        Founder accountability.<br />
                        Team transparency.<br />
                        Execution tracking.
                    </p>
                </div>
                <div className="login-branding-bg"></div>
            </div>

            {/* Right Side - Form */}
            <div className="login-form-section">
                <div className="login-form-container">
                    <div className="login-header">
                        <h2 className="login-title">Welcome back</h2>
                        <p className="login-subtitle">Sign in to your account</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">{error}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="password">Password</label>
                            <PasswordInput
                                id="password"
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="button"
                            className="forgot-password-link"
                            onClick={() => setShowForgotModal(true)}
                        >
                            Forgot password?
                        </button>

                        <button
                            type="submit"
                            className="btn btn-primary login-btn"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <p className="login-footer">
                        Internal system · Contact a founder for access
                    </p>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="forgot-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>✕</button>

                        {!resetResult ? (
                            <>
                                <h3>Forgot Password?</h3>
                                <p className="forgot-desc">
                                    Enter your email to generate a reset code. Share this code with any logged-in founder to reset your password.
                                </p>
                                <form onSubmit={handleForgotPassword}>
                                    <div className="input-group">
                                        <label className="input-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="input"
                                            placeholder="you@company.com"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={resetLoading}
                                        style={{ width: '100%' }}
                                    >
                                        {resetLoading ? 'Generating...' : 'Generate Reset Code'}
                                    </button>
                                </form>
                            </>
                        ) : resetResult.success ? (
                            <div className="reset-success">
                                <div className="success-icon">✓</div>
                                <h3>Reset Code Generated!</h3>
                                <p>For: <strong>{resetResult.userName}</strong></p>

                                <div className="reset-code-box">
                                    <span className="reset-code">{resetResult.code}</span>
                                    <button
                                        className="copy-btn"
                                        onClick={() => copyToClipboard(resetResult.code)}
                                        title="Copy code"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
                                </div>

                                <p className="reset-instructions">
                                    Share this code with any logged-in founder. They can reset your password from Settings → Reset Password.
                                </p>
                                <p className="reset-expiry">⏱ Code expires in 24 hours</p>

                                <button className="btn btn-secondary" onClick={closeModal} style={{ width: '100%', marginTop: '16px' }}>
                                    Close
                                </button>
                            </div>
                        ) : (
                            <div className="reset-error">
                                <div className="error-icon">✗</div>
                                <h3>Error</h3>
                                <p>{resetResult.message}</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setResetResult(null)}
                                    style={{ width: '100%', marginTop: '16px' }}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
