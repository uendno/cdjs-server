const express = require('express');
const router = express.Router();
const {body} = require('express-validator/check');
const validation = require('../../helpers/validation');
const agentsController = require('../controllers/agents');
const {roleMiddleware} = require('../middlewares/auth');

router.get('/', agentsController.list);

router.post('/', validation.validate([
    body('name', 'Invalid name').exists()
]), agentsController.create);

router.put('/:id', validation.validate([
    body('name', 'Invalid name'),
    body('enabled', 'Invalid enabled').optional().isBoolean(),
    body('numberOfConcurrentBuilds', 'Invalid numberOfConcurrentBuilds').optional().isInt(),
    body('tags', 'Invalid tags').optional().custom(validation.validateArray('string')),
]), agentsController.update);

router.delete('/:id', agentsController.delete);

module.exports = router;