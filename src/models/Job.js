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

    git: {
        id: {
            type: String,
            index: true,
            require: true
        },
        name: String,
        fullName: String
    }

});

module.exports = mongoose.model('Job', JobSchema);