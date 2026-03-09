import express from 'express';
import mongoose from 'mongoose';
import Data from '../models/Data.js';
import User from '../models/User.js';

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/data/:userId
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!isValidObjectId(userId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

        const user = await User.findById(userId).select('_id name email');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        let doc = await Data.findOne({ userId: user._id });
        if (!doc) {
            doc = await Data.create({ userId: user._id });
        }

        return res.json({
            settings: doc.settings || {},
            boards: doc.boards || [],
            tasks: doc.tasks || [],
            subjects: doc.subjects || [],
            projects: doc.projects || [],
            meta: doc.meta || {}
        });
    } catch (err) {
        console.error('GET /api/data error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/data/:userId
router.post('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!isValidObjectId(userId)) return res.status(400).json({ success: false, message: 'Invalid userId' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const { settings, boards, tasks, subjects, projects, meta } = req.body;

        const updated = await Data.findOneAndUpdate(
            { userId: user._id },
            {
                $set: {
                    settings: settings || {},
                    boards: Array.isArray(boards) ? boards : [],
                    tasks: Array.isArray(tasks) ? tasks : [],
                    subjects: Array.isArray(subjects) ? subjects : [],
                    projects: Array.isArray(projects) ? projects : [],
                    meta: meta || {},
                    updatedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        return res.json({ success: true, message: 'Saved', data: { updatedAt: updated.updatedAt } });
    } catch (err) {
        console.error('POST /api/data error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;