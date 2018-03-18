const express = require('express');

const {body} = require('express-validator/check');
const router = express.Router();

const validation = require('../../helpers/validation');
const {authMiddleware} = require('../middlewares/auth');
const authController = require('../controllers/auth');

router.post('/', validation.validate([
    body('email', 'Email is missing').exists().isEmail().withMessage('Must be an email'),
    body('password', 'Password is missing').exists(),
]), authController.login);

router.delete('/', [authMiddleware], authController.logout);

module.exports = router;