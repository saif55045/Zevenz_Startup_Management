import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { planAPI } from '../services/planApi';
import './Plans.css';

const Plans = () => {
    const { isActive } = useAuth();
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newPlan, setNewPlan] = useState({ title: '', description: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await planAPI.getAll();
            setPlans(res.data);
        } catch (err) {
            console.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newPlan.title.trim()) return;

        setCreating(true);
        try {
            await planAPI.create(newPlan);
            setNewPlan({ title: '', description: '' });
            setShowModal(false);
            fetchPlans();
        } catch (err) {
            console.error('Failed to create plan');
        } finally {
            setCreating(false);
        }
    };

    const getStatusColor = (status) => {
        return status === 'COMPLETED' ? 'green' : 'purple';
    };

    return (
        <Layout title="Plans">
            <div className="plans-page">
                {/* Header */}
                <div className="plans-header">
                    <div>
                        <p className="plans-subtitle">Manage execution plans and track progress</p>
                    </div>
                    {isActive && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            + New Plan
                        </button>
                    )}
                </div>

                {/* Plans Grid */}
                {loading ? (
                    <div className="plans-loading">Loading plans...</div>
                ) : plans.length === 0 ? (
                    <div className="plans-empty">
                        <div className="empty-icon">◫</div>
                        <h3>No plans yet</h3>
                        <p>Create your first plan to start tracking work</p>
                    </div>
                ) : (
                    <div className="plans-grid">
                        {plans.map((plan) => (
                            <div
                                key={plan._id}
                                className="plan-card"
                                onClick={() => navigate(`/plans/${plan._id}`)}
                            >
                                <div className="plan-card-header">
                                    <span className={`plan-status ${getStatusColor(plan.status)}`}>
                                        {plan.status}
                                    </span>
                                    {plan.deadTasksCount > 0 && (
                                        <span className="dead-indicator">⚠ {plan.deadTasksCount}</span>
                                    )}
                                </div>
                                <h3 className="plan-title">{plan.title}</h3>
                                {plan.description && (
                                    <p className="plan-description">{plan.description}</p>
                                )}
                                <div className="plan-progress">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${plan.progress}%` }}
                                        />
                                    </div>
                                    <span className="progress-text">
                                        {plan.tasks.filter(t => t.status === 'DONE').length}/{plan.tasks.length} tasks
                                    </span>
                                </div>
                                <div className="plan-meta">
                                    <span>By {plan.createdBy?.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h3 className="modal-title">Create New Plan</h3>
                            <form onSubmit={handleCreate}>
                                <div className="input-group">
                                    <label className="input-label">Title</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Plan title"
                                        value={newPlan.title}
                                        onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Description (optional)</label>
                                    <textarea
                                        className="input"
                                        placeholder="Brief description"
                                        rows={3}
                                        value={newPlan.description}
                                        onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={creating || !newPlan.title.trim()}>
                                        {creating ? 'Creating...' : 'Create Plan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Plans;
