/**
 * server.js
 * Minimal Express + Mongoose backend for TaskMaster
 * Exposes:
 * - POST /api/auth/register
 * - POST /api/auth/login
 * - GET  /api/data/:userId
 * - POST /api/data/:userId
 *
 * Note: This implementation returns a simple user object on login to remain
 * compatible with the frontend that stores user in localStorage.
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth.js';
import dataRoutes from './server/routes/data.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmaster';

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

// Root health
app.get('/', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

// Connect to MongoDB and start server
mongoose.set('strictQuery', false);
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });