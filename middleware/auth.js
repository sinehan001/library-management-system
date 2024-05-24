const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access token is missing or invalid' });

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });

        try {
            const foundUser = await User.findById(user.id).select('-password');
            if (!foundUser) return res.status(404).json({ message: 'User not found' });

            req.user = foundUser;
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    });
};

module.exports = authenticateToken;