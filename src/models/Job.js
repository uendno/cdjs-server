const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobSchema = new Schema({
    name: {
        type: String,
        require: true,
        unique: true,
        index: true
    },

    cdFilePath: {
        type: String,
        default: './cd.js'
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    repo: {
        id: {
            type: Number,
            index: true,
            require: true
        },
        name: String,
        fullName: String,
        private: Boolean,
        url: String,
        ownerAvatarUrl: String
    },

    git: {
        type: Schema.ObjectId,
        ref: 'Git'
    }
});

module.exports = mongoose.model('Job', JobSchema);