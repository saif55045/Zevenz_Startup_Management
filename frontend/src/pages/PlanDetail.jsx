import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { planAPI } from '../services/planApi';
import './PlanDetail.css';

const PlanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isActive } = useAuth();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState('');
    const [adding, setAdding] = useState(false);
    const [showBlockedModal, setShowBlockedModal] = useState(null);

    useEffect(() => {
        fetchPlan();
    }, [id]);

    const fetchPlan = async () => {
        try {
            const res = await planAPI.getOne(id);
            setPlan(res.data);
        } catch (err) {
            console.error('Failed to load plan');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        setAdding(true);
        try {
            const res = await planAPI.addTask(id, newTask);
            setPlan(res.data);
            setNewTask('');
        } catch (err) {
            console.error('Failed to add task');
        } finally {
            setAdding(false);
        }
    };

    const handleStatusChange = async (taskId, status, blockedReason = null) => {
        try {
            const res = await planAPI.updateTask(id, taskId, { status, blockedReason });
            setPlan(res.data);
            setShowBlockedModal(null);
        } catch (err) {
            console.error('Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            const res = await planAPI.deleteTask(id, taskId);
            setPlan(res.data);
        } catch (err) {
            console.error('Failed to delete task');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'DONE': return '✓';
            case 'BLOCKED': return '⊘';
            default: return '○';
        }
    };

    if (loading) {
        return (
            <Layout title="Plan">
                <div className="plan-loading">Loading...</div>
            </Layout>
        );
    }

    if (!plan) {
        return (
            <Layout title="Plan">
                <div className="plan-not-found">Plan not found</div>
            </Layout>
        );
    }

    return (
        <Layout title={plan.title}>
            <div className="plan-detail">
                {/* Back Button */}
                <button className="back-btn" onClick={() => navigate('/plans')}>
                    ← Back to Plans
                </button>

                {/* Plan Header */}
                <div className="plan-detail-header">
                    <div className="plan-detail-info">
                        <span className={`plan-status ${plan.status === 'COMPLETED' ? 'green' : 'purple'}`}>
                            {plan.status}
                        </span>
                        <h1 className="plan-detail-title">{plan.title}</h1>
                        {plan.description && (
                            <p className="plan-detail-description">{plan.description}</p>
                        )}
                    </div>
                    <div className="plan-detail-stats">
                        <div className="stat">
                            <span className="stat-value">{plan.progress}%</span>
                            <span className="stat-label">Complete</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{plan.tasks.length}</span>
                            <span className="stat-label">Tasks</span>
                        </div>
                    </div>
                </div>

                {/* Add Task Form */}
                {isActive && plan.status !== 'COMPLETED' && (
                    <form className="add-task-form" onSubmit={handleAddTask}>
                        <input
                            type="text"
                            className="input"
                            placeholder="Add a new task..."
                            value={newTask}
                            onChange={e => setNewTask(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" disabled={adding || !newTask.trim()}>
                            {adding ? 'Adding...' : 'Add'}
                        </button>
                    </form>
                )}

                {/* Tasks List */}
                <div className="tasks-list">
                    {plan.tasks.length === 0 ? (
                        <div className="tasks-empty">No tasks yet. Add your first task above.</div>
                    ) : (
                        plan.tasks.map((task) => (
                            <div key={task._id} className={`task-item ${task.status.toLowerCase()}`}>
                                <div className="task-left">
                                    <span className={`task-icon ${task.status.toLowerCase()}`}>
                                        {getStatusIcon(task.status)}
                                    </span>
                                    <div className="task-content">
                                        <span className="task-title">{task.title}</span>
                                        {task.blockedReason && (
                                            <span className="task-blocked-reason">{task.blockedReason}</span>
                                        )}
                                    </div>
                                </div>
                                {isActive && plan.status !== 'COMPLETED' && (
                                    <div className="task-actions">
                                        {task.status !== 'DONE' && (
                                            <button
                                                className="task-btn done"
                                                onClick={() => handleStatusChange(task._id, 'DONE')}
                                                title="Mark Done"
                                            >
                                                ✓
                                            </button>
                                        )}
                                        {task.status !== 'BLOCKED' && task.status !== 'DONE' && (
                                            <button
                                                className="task-btn blocked"
                                                onClick={() => setShowBlockedModal(task._id)}
                                                title="Mark Blocked"
                                            >
                                                ⊘
                                            </button>
                                        )}
                                        {task.status !== 'TODO' && (
                                            <button
                                                className="task-btn todo"
                                                onClick={() => handleStatusChange(task._id, 'TODO')}
                                                title="Reset to TODO"
                                            >
                                                ↺
                                            </button>
                                        )}
                                        <button
                                            className="task-btn delete"
                                            onClick={() => handleDeleteTask(task._id)}
                                            title="Delete"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Blocked Reason Modal */}
                {showBlockedModal && (
                    <div className="modal-overlay" onClick={() => setShowBlockedModal(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h3 className="modal-title">Select Block Reason</h3>
                            <div className="block-reasons">
                                {['Technical issue', 'Waiting on co-founder', 'External dependency'].map(reason => (
                                    <button
                                        key={reason}
                                        className="reason-btn"
                                        onClick={() => handleStatusChange(showBlockedModal, 'BLOCKED', reason)}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                            <button
                                className="btn btn-secondary"
                                style={{ width: '100%', marginTop: 'var(--space-4)' }}
                                onClick={() => setShowBlockedModal(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PlanDetail;
