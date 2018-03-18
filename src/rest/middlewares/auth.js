const jwt = require('jsonwebtoken');
const config = require('../../config');
const redisClient = require('../../services/redis');
const Permission = require('../../models/Permission');

exports.authMiddleware = (req, res, next) => {

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

exports.roleMiddleware = (roles) => (req, res, next) => {
    const user = req.decoded.sub;

    if (roles.indexOf(user.role) === -1) {
        const error = new Error('Unauthorized.');
        error.status = 401;
        return next(error);
    }

    return next();
};

exports.permissionMiddleware = (requiredPermissions, paramName) => (req, res, next) => {
    const jobId = req.params[paramName];
    const user = req.decoded.sub;

    if (user.role === 'admin') {
        return next();
    }

    return redisClient
        .getAsync(config.redis.prefix + ':permissions:' + user._id + '-' + jobId)
        .then(permisions => {
            if (!permisions) {
                return Permission
                    .find({user: user._id, job: jobId})
                    .then(permissions => {
                        return permissions.map(permission => permission.action);
                    })
                    .then(permissions => {

                        permissions.forEach(permission => {
                            redisClient
                            .saddAsync(config.redis.prefix + ':permissions:' + user._id + '-' + jobId, permission)
                        });

                        return permissions;
                    });
            } else {
                return permisions;
            }
        })
        .then(permissions => {
            if (!permissions || permissions.length === 0) {
                const error = new Error('You don\'t have permission');
                error.status = 401;
                throw error;
            }

            let result = true;

            requiredPermissions.forEach(permision => {
                if (permissions.indexOf(permission) === -1) {
                    result = false;
                }
            });

            if (!result) {
                const error = new Error('You don\'t have permission');
                error.status = 401;
                throw error;
            }

            return next();
        })
        .catch(next);
};