const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StateSchema = new Schema({
    build: {
        type: Schema.ObjectId,
        ref: "Build"
    },

    name: {
        type: String,
        require: true
    },

    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'building'],
        default: 'pending'
    },

    startAt: {
        type: Date,
        default: Date.now
    },

    doneAt: Date
});

module.exports = mongoose.model('Stage', StateSchema);