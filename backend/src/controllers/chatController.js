const Message = require('../models/Message');

// @desc    Get recent messages
// @route   GET /api/chat/messages
// @access  Private
const getMessages = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const messages = await Message.find()
            .populate('sender', 'name email status')
            .sort({ createdAt: -1 })
            .limit(limit);

        // Return in chronological order
        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Send a message (also emits via socket)
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        const message = await Message.create({
            sender: req.user._id,
            content: content.trim()
        });

        await message.populate('sender', 'name email status');

        // Emit to all connected clients via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('new_message', message);
        }

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getMessages, sendMessage };
