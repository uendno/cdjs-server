const {validationResult} = require('express-validator/check');

module.exports = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(errors.array()[0].msg);
        error.status = 400;
        return next(error);
    }

    return next();
};