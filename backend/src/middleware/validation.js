// Input validation and sanitization middleware

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
const isStrongPassword = (password) => {
    // Minimum 6 characters
    return password && password.length >= 6;
};

// Sanitize string input (remove potential script tags and trim)
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, ''); // Remove HTML tags
};

// Validation middleware for login
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Sanitize inputs
    req.body.email = sanitizeString(email.toLowerCase());
    req.body.password = password; // Don't sanitize password, just pass through

    next();
};

// Validation middleware for password reset request
const validateResetRequest = (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    req.body.email = sanitizeString(email.toLowerCase());
    next();
};

// Validation middleware for password reset
const validatePasswordReset = (req, res, next) => {
    const { code, newPassword } = req.body;

    if (!code || !newPassword) {
        return res.status(400).json({ message: 'Reset code and new password are required' });
    }

    if (!isStrongPassword(newPassword)) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Sanitize code (alphanumeric only)
    req.body.code = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    next();
};

// Validation middleware for activity creation
const validateActivity = (req, res, next) => {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Activity content is required' });
    }

    if (content.length > 5000) {
        return res.status(400).json({ message: 'Activity content is too long (max 5000 characters)' });
    }

    req.body.content = sanitizeString(content);
    next();
};

// Validation middleware for generating credentials
const validateCredentials = (req, res, next) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (name.length < 2 || name.length > 100) {
        return res.status(400).json({ message: 'Name must be between 2 and 100 characters' });
    }

    req.body.name = sanitizeString(name);
    req.body.email = sanitizeString(email.toLowerCase());
    next();
};

// Generic text sanitization middleware
const sanitizeBody = (fields) => {
    return (req, res, next) => {
        for (const field of fields) {
            if (req.body[field] && typeof req.body[field] === 'string') {
                req.body[field] = sanitizeString(req.body[field]);
            }
        }
        next();
    };
};

module.exports = {
    validateLogin,
    validateResetRequest,
    validatePasswordReset,
    validateActivity,
    validateCredentials,
    sanitizeBody,
    sanitizeString,
    isValidEmail,
    isStrongPassword
};
