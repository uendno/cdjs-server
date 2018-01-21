const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AgentSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },

    socketId: {
        type: String
    },

    ip: {
        type: String
    },

    status: {
        type: String,
        enum: ['waiting-for-connection', 'online', 'offline'],
        default: 'waiting-for-connection'
    },

    enabled: {
        type: Boolean,
        default: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    lastOnline: {
        type: Date,
    },

    numberOfConcurrentBuilds: {
        type: Number,
        default: 1
    },

    tags: [String]
});

module.exports = mongoose.model('Agent', AgentSchema);