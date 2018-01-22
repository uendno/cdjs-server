const express = require('express');

const {body} = require('express-validator/check');
const router = express.Router();

const config = require('../../config');

const validation = require('../../helpers/validation');
const authMiddleware = require('../middlewares/auth');
const authController = require('../controllers/auth');
const redisClient = require('../../services/redis').client;

router.post('/', validation.validate([
    body('email', 'Email is missing').exists().isEmail().withMessage('Must be an email'),
    body('password', 'Password is missing').exists(),
]), authController.login);

router.delete('/', [authMiddleware], (req, res, next) => {
    redisClient.saddAsync(config.redis.prefix + ':access-token-black-list', req.headers.authorization)
        .then(() => {
            res.send({
                status: 200,
                message: 'Ok'
            })
        })
        .catch(err => {
            next(err);
        })
});

module.exports = router;