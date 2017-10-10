const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobSchema = new Schema({
    name: {
        type: String,
        require: true,
        unique: true,
        index: true
    },

    slug: {
        type: String,
        require: true,
        unique: true,
        index: true
    },

    cdFilePath: {
        type: String,
        default: 'cd.js'
    },

    description: String,

    secret: {
        require: true,
        type: String
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    repoType: {
        type: String,
        enum: ['github', 'gitlab', 'bitbucket'],
        default: 'github'
    },
    repoUrl: String,
    branch: {
        type: String,
        default: "master"
    },
    credential: {
        type: Schema.ObjectId,
        ref: 'Credential'
    }
});

module.exports = mongoose.model('Job', JobSchema);