const validatorMiddleware = require('../rest/middlewares/validator');

exports.validate = (validation) => {
    return validation.concat(validatorMiddleware);
};

exports.validateArray = (type) => (array) => {
    if (!Array.isArray(array)) {
        return false;
    }

    let result = true;

    array.forEach(value => {
        if (typeof (value) !== type) {
            result = false;
        }
    });

    return result;
};

exports.validateCredentialData = () => (data, {req}) => {
    switch (req.body.type) {
        default:
            if (!data.username || !value.password) {
                return false
            }
    }

    return true;
};