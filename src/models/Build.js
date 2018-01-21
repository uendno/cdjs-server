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

    startAt: Date,

    doneAt: Date
});

const AuthorSchema = new Schema({
    name: String,
    email: String,
    username: String
});

const CommitSchema = new Schema({
    id: String,
    message: String,
    author: AuthorSchema,
    url: String,
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

const BuildSchema = new Schema({
    number: {
        type: Number
    },
    job: {
        type: Schema.ObjectId,
        ref: "Job"
    },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'building', 'failed', 'success'],
        default: 'pending'
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    startAt: {
        type: Date
    },

    doneAt: {
        type: Date
    },

    stages: [StateSchema],

    commit: {
        type: CommitSchema
    },

    agent: {
        type: Schema.ObjectId,
        ref: 'Agent'
    },

    achievements: [String]
});

BuildSchema.pre('save', function (next) {

    if (this.isNew) {
        this.constructor.count({job: this.job})
            .then(number => {

                console.log(number);

                this.number = number;
                return next();
            })
    } else {
        next();
    }
});

module.exports = mongoose.model('Build', BuildSchema);