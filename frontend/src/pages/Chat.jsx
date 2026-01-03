import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/chatApi';
import './Chat.css';

const Chat = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        fetchMessages();

        // Set up Socket.io connection
        socketRef.current = io('http://localhost:3001');

        socketRef.current.on('new_message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await chatAPI.getMessages();
            setMessages(res.data);
        } catch (err) {
            console.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await chatAPI.sendMessage(newMessage);
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const groupMessagesByDate = () => {
        const groups = {};
        messages.forEach(msg => {
            const dateKey = new Date(msg.createdAt).toDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(msg);
        });
        return groups;
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    };

    return (
        <Layout title="Group Chat">
            <div className="chat-page">
                <div className="chat-container">
                    {/* Messages Area */}
                    <div className="chat-messages">
                        {loading ? (
                            <div className="chat-loading">Loading messages...</div>
                        ) : messages.length === 0 ? (
                            <div className="chat-empty">
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            Object.entries(groupMessagesByDate()).map(([dateKey, msgs]) => (
                                <div key={dateKey}>
                                    <div className="date-divider">
                                        <span>{formatDate(msgs[0].createdAt)}</span>
                                    </div>
                                    {msgs.map((msg) => (
                                        <div
                                            key={msg._id}
                                            className={`message ${msg.sender._id === user?._id ? 'own' : ''}`}
                                        >
                                            {msg.sender._id !== user?._id && (
                                                <div className="message-avatar">
                                                    {getInitials(msg.sender.name)}
                                                </div>
                                            )}
                                            <div className="message-content">
                                                {msg.sender._id !== user?._id && (
                                                    <span className="message-sender">{msg.sender.name}</span>
                                                )}
                                                <div className="message-bubble">
                                                    <p>{msg.content}</p>
                                                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form className="chat-input-area" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            className="chat-send-btn"
                            disabled={sending || !newMessage.trim()}
                        >
                            {sending ? '...' : '➤'}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default Chat;
