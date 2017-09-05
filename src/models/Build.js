const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
    name: String,
    email: String,
    username: String
});

const CommitSchema = new Schema({
    id: String,
    message: String,
    author: AuthorSchema,
    committer: AuthorSchema,
    addedFiles: {
        type: [String],
        default: []

    },
    removedFiles: {
        type: [String],
        default: []
    },
    modifiedFiles: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        require: true
    }
});

const OwnerSchema = new Schema({
    id: String,
    username: String
});

const BuildSchema = new Schema({
    status: {
        type: String,
        enum: ['pending', 'building', 'failed', 'success'],
        default: 'pending'
    },

    startAt: {
        type: Date,
        default: Date.now
    },

    doneAt: {
        type: Date
    },

    cdFile: {
        type: String
    },

    commits: {
        type: [CommitSchema],
        default: []
    },

    pusher: OwnerSchema
});

module.exports = mongoose.model('Job', BuildSchema);