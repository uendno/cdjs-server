const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StepSchema = new Schema({
    command: {
        type: String,
        require: true
    },

    status: {
        type: String,
        enum: ['success', 'failed', 'building']
    },

    startedAt: {
        type: Date,
        default: Date.now
    },

    doneAt: Date
});

module.exports = mongoose.model('Job', StepSchema);