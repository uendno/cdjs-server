const jwt = require('jsonwebtoken');
const _ = require('lodash');
const User = require('../../models/User');
const config = require('../../config');

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let user;

    return User.findOne({
        email
    })
        .then(found => {
            if (!found) {
                const error = new Error('User not found!');
                error.status = 400;
                throw error;
            }

            user = found;

            return user.comparePassword(password)
        })
        .then(() => {
            return new Promise((resolve, reject) => {
                const data = _.omit(user.toJSON(), 'password');
                jwt.sign({sub: data}, config.auth.jwtSecret, {
                    expiresIn: config.auth.jwtExpire
                }, function (err, token) {
                    if (err) return reject(err);

                    return resolve(token);
                })
            })
        })
        .then(token => {
            res.send({
                status: 200,
                data: token
            })
        })
        .catch(err => {
            console.log(err);
            err.message = 'Wrong username or password.';
            next(err);
        })
};