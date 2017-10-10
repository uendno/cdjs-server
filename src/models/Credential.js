const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CredentialSchema = new Schema({
    type: {
        type: String,
        enum: ['username/password', 'ssh-key'],
        default: 'username/password'
    },

    name: {
        type: String,
        unique: true,
        index: true,
        require: true
    },

    data: Schema.Types.Mixed,

    createdAt: {
        type: Date,
        default: Date.now
    }
});

CredentialSchema.statics.createIfNotExists = function (type, name, data) {
    const Credential = this;

    Credential.findOne({
        type,
        name
    })
        .then(found => {
            if (!found) {
                const git = new Credential({
                    type,
                    name,
                    data
                });

                return git.save()
            }

            return found;
        })
};

module.exports = mongoose.model('Credential', CredentialSchema);

