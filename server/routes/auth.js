import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Data from '../models/Data.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.json({ success: false, message: 'Missing required fields.' });

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.json({ success: false, message: 'Email already used.' });

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email: email.toLowerCase(), password: hashed });

        // Create default Data document
        await Data.create({ userId: user._id });

        return res.json({ success: true, message: 'Registered successfully.' });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.json({ success: false, message: 'Missing required fields.' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.json({ success: false, message: 'Account not found.' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.json({ success: false, message: 'Wrong email or password.' });

        const safeUser = { id: user._id.toString(), name: user.name, email: user.email };
        return res.json({ success: true, user: safeUser });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
});

export default router;