import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { reactivationAPI } from '../services/reactivationApi';
import './Reactivation.css';

const Reactivation = () => {
    const { user, isActive } = useAuth();
    const [requests, setRequests] = useState([]);
    const [myRequest, setMyRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [resolutionModal, setResolutionModal] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [allRes, myRes] = await Promise.all([
                reactivationAPI.getAll(),
                reactivationAPI.getMine()
            ]);
            setRequests(allRes.data);
            setMyRequest(myRes.data);
        } catch (err) {
            console.error('Failed to load reactivation data');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestReactivation = async () => {
        setSubmitting(true);
        try {
            await reactivationAPI.create();
            fetchData();
        } catch (err) {
            console.error('Failed to request reactivation');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVote = async (requestId, vote) => {
        try {
            const res = await reactivationAPI.vote(requestId, vote);
            if (res.data.resolution) {
                setResolutionModal(res.data.resolution);
            }
            fetchData();
        } catch (err) {
            console.error('Failed to vote');
        }
    };

    const hasVoted = (request) => {
        return request.votes.some(v => v.voter._id === user?._id);
    };

    const getMyVote = (request) => {
        const vote = request.votes.find(v => v.voter._id === user?._id);
        return vote?.vote;
    };

    if (loading) {
        return (
            <Layout title="Reactivation">
                <div className="reactivation-loading">Loading...</div>
            </Layout>
        );
    }

    return (
        <Layout title="Reactivation">
            <div className="reactivation-page">
                {/* OUT Founder View - Request Reactivation */}
                {user?.status === 'OUT' && (
                    <div className="request-section">
                        {myRequest ? (
                            <div className="my-request-card">
                                <div className="request-status pending">Pending</div>
                                <h3>Your Reactivation Request</h3>
                                <p>Waiting for votes from active founders</p>
                                <div className="vote-progress">
                                    <div className="vote-count yes">
                                        <span className="count">{myRequest.yesVotes}</span>
                                        <span className="label">Yes</span>
                                    </div>
                                    <div className="vote-count no">
                                        <span className="count">{myRequest.noVotes}</span>
                                        <span className="label">No</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="request-prompt">
                                <div className="prompt-icon">🔄</div>
                                <h3>Request Reactivation</h3>
                                <p>You are currently marked as OUT. Submit a request to rejoin as an active founder.</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleRequestReactivation}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Request Reactivation'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ACTIVE Founder View - Vote on Requests */}
                {isActive && (
                    <div className="voting-section">
                        <h3 className="section-title">Pending Requests</h3>
                        {requests.length === 0 ? (
                            <div className="no-requests">
                                <p>No pending reactivation requests</p>
                            </div>
                        ) : (
                            <div className="requests-list">
                                {requests.map(request => (
                                    <div key={request._id} className="request-card">
                                        <div className="request-info">
                                            <span className="requester-name">{request.requester.name}</span>
                                            <span className="requester-email">{request.requester.email}</span>
                                        </div>
                                        <div className="request-votes">
                                            <span className="vote-badge yes">{request.yesVotes} Yes</span>
                                            <span className="vote-badge no">{request.noVotes} No</span>
                                        </div>
                                        <div className="request-actions">
                                            {hasVoted(request) ? (
                                                <span className={`voted-badge ${getMyVote(request).toLowerCase()}`}>
                                                    Voted {getMyVote(request)}
                                                </span>
                                            ) : (
                                                <>
                                                    <button
                                                        className="vote-btn yes"
                                                        onClick={() => handleVote(request._id, 'YES')}
                                                    >
                                                        ✓ Yes
                                                    </button>
                                                    <button
                                                        className="vote-btn no"
                                                        onClick={() => handleVote(request._id, 'NO')}
                                                    >
                                                        ✕ No
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Resolution Modal */}
                {resolutionModal && (
                    <div className="modal-overlay" onClick={() => setResolutionModal(null)}>
                        <div className="modal resolution-modal" onClick={e => e.stopPropagation()}>
                            <div className={`resolution-icon ${resolutionModal.toLowerCase()}`}>
                                {resolutionModal === 'APPROVED' ? '✓' : '✕'}
                            </div>
                            <h3 className="resolution-title">
                                Request {resolutionModal === 'APPROVED' ? 'Approved!' : 'Rejected'}
                            </h3>
                            <p className="resolution-text">
                                {resolutionModal === 'APPROVED'
                                    ? 'The founder has been reactivated and can now participate again.'
                                    : 'The reactivation request was not approved by the majority.'}
                            </p>
                            <button className="btn btn-primary" onClick={() => setResolutionModal(null)}>
                                Got it
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Reactivation;

