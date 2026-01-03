import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/profileApi';
import { useNavigate } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import './Profile.css';

const Profile = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({ name: '', email: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [deletePassword, setDeletePassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name, email: user.email });
        }
    }, [user]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await profileAPI.update(formData);
            if (refreshUser) refreshUser();
            showMessage('success', 'Profile updated successfully');
        } catch (err) {
            showMessage('error', err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showMessage('error', 'Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await profileAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            showMessage('success', 'Password changed successfully');
        } catch (err) {
            showMessage('error', err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showMessage('error', 'Image must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                await profileAPI.uploadAvatar(reader.result);
                if (refreshUser) refreshUser();
                showMessage('success', 'Avatar updated successfully');
            } catch (err) {
                showMessage('error', 'Failed to upload avatar');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            showMessage('error', 'Please enter your password');
            return;
        }
        setLoading(true);
        try {
            await profileAPI.deleteAccount(deletePassword);
            logout();
            navigate('/login');
        } catch (err) {
            showMessage('error', err.response?.data?.message || 'Failed to delete account');
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    };

    return (
        <Layout title="Profile Settings">
            <div className="profile-page">
                {message.text && (
                    <div className={`message ${message.type}`}>{message.text}</div>
                )}

                {/* Profile Header */}
                <div className="profile-header-card">
                    <div className="avatar-section">
                        <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="avatar-img" />
                            ) : (
                                <div className="avatar-placeholder">{getInitials(user?.name)}</div>
                            )}
                            <div className="avatar-overlay">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        <div className="profile-info">
                            <h2>{user?.name}</h2>
                            <p>{user?.email}</p>
                            <span className={`badge badge-${user?.status?.toLowerCase()}`}>
                                {user?.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    <button
                        className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile Info
                    </button>
                    <button
                        className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        Security
                    </button>
                    <button
                        className={`tab ${activeTab === 'danger' ? 'active' : ''}`}
                        onClick={() => setActiveTab('danger')}
                    >
                        Danger Zone
                    </button>
                </div>

                {/* Profile Info Tab */}
                {activeTab === 'profile' && (
                    <div className="profile-card">
                        <h3>Update Profile</h3>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="profile-card">
                        <h3>Change Password</h3>
                        <form onSubmit={handleChangePassword}>


                            <div className="form-group">
                                <label>Current Password</label>
                                <PasswordInput
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <PasswordInput
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <PasswordInput
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Danger Zone Tab */}
                {activeTab === 'danger' && (
                    <div className="profile-card danger">
                        <h3>Delete Account</h3>
                        <p className="danger-text">
                            This action is permanent. All your data including activities,
                            messages, and attendance records will be permanently deleted.
                        </p>
                        <button
                            className="btn btn-danger"
                            onClick={() => setShowDeleteModal(true)}
                        >
                            Delete My Account
                        </button>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                        <div className="modal delete-modal" onClick={e => e.stopPropagation()}>
                            <h3>⚠️ Delete Account</h3>
                            <p>Enter your password to confirm deletion:</p>
                            <PasswordInput
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Your password"
                            />
                            <div className="modal-actions">
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                >
                                    {loading ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Profile;
