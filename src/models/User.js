const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const config = require('../config');

const UserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        index: true
    },

    password: {
        type: String
    },

    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    }
});

UserSchema.pre('save', function (next) {
    const user = this;

    if (!user.isModified('password')) return next();

    bcrypt.genSalt(config.auth.saltWorkFactor, (err, salt) => {
        if (err) {
            return next(err);
        }

        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) {
                return next(err)
            }

            user.password = hash;
            return next();
        })
    })
});

UserSchema.methods.comparePassword = function (candidatePassword) {

    return new Promise((resolve, reject) => {
        bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
            if (err) return reject(err);

            if (!isMatch) return reject('Password does not match');

            return resolve();
        });
    })
};

module.exports = mongoose.model('User', UserSchema);