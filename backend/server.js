const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_traffic_db';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// --- SCHEMAS & MODELS ---

const ViolationSchema = new mongoose.Schema({
    type: String,
    location: String,
    vehicle: String,
    time: { type: Date, default: Date.now },
    status: { type: String, default: 'Active' },
    fineAmount: Number
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
const Violation = mongoose.model('Violation', ViolationSchema);

const LogSchema = new mongoose.Schema({
    action: String,
    module: String,
    level: { type: String, default: 'info' },
    time: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
const SystemLog = mongoose.model('SystemLog', LogSchema);

const MessageSchema = new mongoose.Schema({
    type: { type: String, enum: ['bot', 'user'] },
    text: String,
    time: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
const ChatMessage = mongoose.model('ChatMessage', MessageSchema);

// --- API ROUTES ---

// 1. Violations
app.get('/api/violations', async (req, res) => {
    try {
        const violations = await Violation.find().sort({ time: -1 }).limit(50);
        res.json(violations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/violations', async (req, res) => {
    try {
        const newViolation = new Violation(req.body);
        const saved = await newViolation.save();
        res.json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. System Logs
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await SystemLog.find().sort({ time: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/logs', async (req, res) => {
    try {
        const newLog = new SystemLog(req.body);
        const saved = await newLog.save();
        res.json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Chat Messages
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await ChatMessage.find().sort({ time: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const newMessage = new ChatMessage(req.body);
        const saved = await newMessage.save();
        res.json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`MongoDB Backend running on http://localhost:${PORT}`);
});
