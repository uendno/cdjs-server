const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GitSchema = new Schema({
    type: {
        type: String,
        enum: ['url'],
        default: 'url'
    },

    username: {
        type: String,
        require: true
    },

    accessToken: {
        type: String,
        require: true
    },

    avatarUrl: String
});

GitSchema.statics.createIfNotExists = function (type, username, accessToken, avatarUrl) {
    const Git = this;

    Git.findOne({
        type,
        username
    })
        .then(found => {
            if (!found) {
                const git = new Git({
                    type,
                    username,
                    accessToken,
                    avatarUrl
                });

                return git.save()
            }

            return found;
        })
};

module.exports = mongoose.model('Git', GitSchema);

