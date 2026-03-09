import mongoose from 'mongoose';

const DataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    settings: { type: Object, default: { enableTaskDragDrop: true, hideCompletedTasks: false, hideCompletedBoards: false } },
    boards: { type: Array, default: [] },
    tasks: { type: Array, default: [] },
    subjects: { type: Array, default: [] },
    projects: { type: Array, default: [] },
    meta: { type: Object, default: {} }, // e.g. projectsMeta, other client state
    updatedAt: { type: Date, default: Date.now }
});

DataSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model('Data', DataSchema);