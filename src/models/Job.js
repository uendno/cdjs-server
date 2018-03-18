const slugify = require('slug');
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
        unique: true,
        index: true
    },

    cdFilePath: {
        type: String,
        default: 'cd.js'
    },

    description: String,

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
    },
    status: {
        type: String,
        default: 'draft'
    },

    agentTags: [String],
});

JobSchema.pre('save', function (next) {
    if (this.isNew) {
        this.slug = slugify(this.name);
    }
    console.log(this.repoUrl);

    if (this.repoUrl) {
        this.status = 'active';
    }

    next();
});

module.exports = mongoose.model('Job', JobSchema);