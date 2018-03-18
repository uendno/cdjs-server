const _ = require('lodash');
const User = require('../../models/User');
const Permission = require('../../models/Permission');

exports.getAllUsers = (req, res, next) => {
    return User
        .find({})
        .then(users => {
            const data = users.map(user => {
                return _.omit(user.toJSON(), ['password'])
            });

            return res.sendSuccess(data)
        })
        .catch(next)
};

exports.createUser = (req, res, next) => {
    const {email, role, password} = req.body;

    User
        .findOne({email})
        .then(found => {
            if (found) {
                const error = new Error('An user with this email is already existed.')
                error.status = 400;
                throw error;
            }
            const user = new User({email, role, password});
            return user.save()
        })
        .then(user => {
            return res.sendSuccess(_.omit(user.toJSON(), ['password']))
        })
        .catch(next);

};

exports.deleteUser = (req, res, next) => {
    const id = req.params.id;

    return User
        .findOne({_id: id})
        .then(user => {
            if (!user) {
                const error = new Error('User not found!');
                error.status = 404;
                throw error;
            }

            return User.remove({_id: id})
        })
        .then(() => {
            return res.sendSuccess(null);
        })
        .catch(next);
};

exports.changePassword = (req, res, next) => {
    const id = req.params.id;
    const {oldPassword, newPassword} = req.body;

    let user;

    User
        .findOne({_id: id})
        .then(found => {
            if (!found) {
                const error = new Error('User not found!');
                error.status = 404;
                throw error;
            }

            user = found;

            return user.comparePassword(oldPassword)
        })
        .then(() => {
            user.password = newPassword;
            return user.save();
        })
        .then(() => {
            return res.sendSuccess(null);
        })
        .catch(next);
};

exports.updateUser = (req, res, next) => {
    const userId = req.params.id;

    return User.findOneAndUpdate({_id: userId}, {role: req.body.role}, {new: true})
        .then(user => {
            return res.sendSuccess(_.omit(user.toJSON(), ['password']))
        })
        .catch(next);
};

exports.getPermissions = (req, res, next) => {
    const userId = req.params.userId;

    return User
        .findOne({_id: userId})
        .then(found => {
            if (!found) {
                const error = new Error('User not found!');
                error.status = 404;
                throw error;
            }

            return Permission
                .find({user: userId})
                .populate('job')
                .populate('user')
        })
        .then(permissions => {
            return res.sendSuccess(permissions)
        })
        .catch(next)
};

exports.createPermission = (req, res, next) => {
    const userId = req.params.userId;
    const {jobId, actions} = req.body;
    const data = {
        user: userId,
        job: jobId,
        actions
    };

    return User
        .findOne({_id: userId})
        .then(found => {
            if (!found) {
                const error = new Error('User not found!');
                error.status = 404;
                throw error;
            }

            const permission = new Permission(data);
            return permission.save();
        })
        .then(permission => {
            return Permission
                .populate(permission, {path: 'user'})
                .populate('job')
        })
        .then(permission => {
            return res.sendSuccess(permission)
        })
        .catch(next)
};

exports.updatePermission = (req, res, next) => {
    const userId = req.params.userId;
    const actions = req.body.actions;
    const permisisonId = req.params.permissionId;

    return User
        .findOne({_id: userId})
        .then(found => {
            if (!found) {
                const error = new Error('User not found!');
                error.status = 404;
                throw error;
            }

            return Permission
                .findOne({user: userId, _id: permissionId})
                .populate('job')
                .populate('user')
        })
        .then(permission => {
            if (!permission) {
                const error = new Error('Permission not found!');
                error.status = 404;
                throw error;
            }

            permission.actions = actions;
            return permission.save();
        })
        .then(permission => {
            return res.sendSuccess(permission);
        })
        .catch(next)
};

exports.deletePermission = (req, res, next) => {
    const userId = req.params.userId;
    const permisisonId = req.params.permissionId;

    return User
        .findOne({_id: userId})
        .then(found => {
            if (!found) {
                const error = new Error('User not found!');
                error.status = 404;
                throw error;
            }

            return Permission
                .findOne({user: userId, _id: permissionId})
        })
        .then(permission => {
            if (!permission) {
                const error = new Error('Permission not found!');
                error.status = 404;
                throw error;
            }

            Permission.remove({user: userId, _id: permissionId})
        })
        .then(() => {
            return res.sendSuccess(null);
        })
        .catch(next)
}