const jwt = require('jsonwebtoken');

const config = require('../../config');

module.exports = (req, res, next) => {

    if (!req.headers.authorization) {
        const error = new Error('Access token must be provided!');
        error.status = 401;
        return next(error);
    }

    jwt.verify(req.headers.authorization, config.auth.jwtSecret, (err, decoded) => {
        if (err) {
            err.status = 401;
            return next(err);
        }

        req.decoded = decoded;
        return next();
    })
};