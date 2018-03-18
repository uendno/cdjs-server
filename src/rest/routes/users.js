const express = require('express');
const router = express.Router();
const {body} = require('express-validator/check');

const validation = require('../../helpers/validation');
const {roleMiddleware} = require('../middlewares/auth');
const usersController = require('../controllers/users');

router.get('/', usersController.getAllUsers);

router.post('/', validation.validate([
    roleMiddleware(['admin']),
    body('email', 'Invalid email.')
        .exists()
        .isEmail(),
    body('role', 'Invalid role')
        .exists()
        .isIn(['admin', 'user', 'guest']),
    body('password', 'Invalid password.').exists()
]), usersController.createUser);

router.put('/:id/password', validation.validate([
    body('oldPassword', 'Invalid oldPassword.').exists(),
    body('newPassword', 'Invalid newPassword').exists()
]), usersController.changePassword);

router.put('/:id', validation.validate([
    roleMiddleware(['admin']),
    body('role', 'Invalid role').exists()
]), usersController.updateUser);

router.delete('/:id', [roleMiddleware(['admin'])], usersController.deleteUser);

router.get('/:userId/permissions', usersController.getPermissions);

router.post('/:userId/permissions', validation.validate([
    body('userId', 'Invalid userId').exists(),
    body('jobId', 'Invalid jobId').exists(),
    body('actions', 'Invalid actions').exists().custom(validation.validateArray('string'))
]), usersController.createPermission);

router.put('/:userId/permissions/:permissionId', validation.validate([
    body('actions', 'Invalid actions').exists().custom(validation.validateArray('string'))
]), usersController.updatePermission);

router.delete('/:userId/permissions/:permissionId', usersController.deletePermission);

module.exports = router;