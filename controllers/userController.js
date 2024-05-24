const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const formatDate = require('../utils/formatDate');

//Send a Test User
exports.testUser = async (req, res) => {
    try {
        return res.status(200).json({
            message: 'User is authenticated'
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Register a new user
exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await User.findOne({ $or: [{ username }, { email: username }] });

        if (user) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        return res.status(201).json({
            message: 'User registered successfully',
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// User login
exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ $or: [{ username }, { email: username }] });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ accessToken });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user profile
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -__v');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const formattedUsers = {
            ...user._doc,
            createdAt: formatDate(user.createdAt),
            updatedAt: formatDate(user.updatedAt)
        };

        res.json(formattedUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Update user profile
exports.updateUser = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['username', 'email', 'password', 'fullName', 'phone', 'address'];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates!' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.body.username || req.body.email) {
            const existingUser = await User.findOne({
                $or: [
                    { username: req.body.username },
                    { email: req.body.email }
                ]
            });

            if (existingUser && String(existingUser._id) !== String(user._id)) {
                return res.status(400).json({ message: 'Username or email already in use' });
            }
        }

        updates.forEach((update) => user[update] = req.body[update]);

        if (req.body.password) {
            user.password = await bcrypt.hash(req.body.password, 10);
        }

        await user.save();

        const getUser = await User.findById(req.user._id).select('-password -__v');
        if (!getUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const formattedUsers = {
            ...getUser._doc,
            createdAt: formatDate(getUser.createdAt),
            updatedAt: formatDate(getUser.updatedAt)
        };

        res.json(formattedUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete user account
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};