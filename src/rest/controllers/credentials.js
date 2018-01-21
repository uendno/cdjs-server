const hidePasswordIfNeeded = require('../../helpers/credentials').hidePasswordIfNeeded;
const Credential = require('../../models/Credential');

exports.list = (req, res, next) => {
    return Credential.find()
        .then(credentials => {
            return credentials.map(credential => {
                return hidePasswordIfNeeded(credential);
            })
        })
        .then(credentials => {
            return res.sendSuccess(credentials);
        })
        .catch(error => {
            return next(error);
        })
};

exports.create = (req, res, next) => {
    const name = req.body.name;
    const type = req.body.type;
    const data = req.body.data;

    return Credential.findOne({
        name
    })
        .then(found => {
            if (found) {
                const error = new Error("A credential with this name already exists.");
                error.status = 400;

                throw error;
            } else {
                const credential = new Credential({
                    data,
                    type,
                    name,
                });
                return credential.save();
            }
        })
        .then(credential => {
            return res.sendSuccess(hidePasswordIfNeeded(credential))
        })
        .catch(error => {
            return next(error);
        })
};

exports.update = (req, res, next) => {
    const id = req.params.id;
    const data = req.body;

    return Credential.findOne({
        _id: id
    })
        .then(credential => {
            if (!credential) {
                const error = new Error('Job not found!');
                error.status = 404;

                throw error;
            }

            return Credential.findOneAndUpdate({
                _id: id
            }, data, {
                new: true
            })
        })
        .then(credential => {
            return res.sendSuccess(credential.toJSON())
        })
        .catch(error => {
            return next(error);
        })
};

exports.delete = (req, res, next) => {
    const id = req.params.id;

    return Credential.remove({_id: id})
        .then(() => {
            res.sendSuccess(null);
        })
        .catch(error => {
            return next(error);
        });
};