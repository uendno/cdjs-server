const express = require('express');
const router = express.Router();
const {body} = require('express-validator/check');

const validation = require('../../helpers/validation');
const credentialsController = require('../controllers/credentials');

router.get('/', credentialsController.list);

router.post('/', validation.validate([
    body('name', 'Invalid name').exists(),
    body('type', 'Invalid type').exists(),
    body('data', 'Invalid data').exists().custom(validation.validateCredentialData)
]), credentialsController.create);

router.put('/:id', validation.validate([
    body('name', 'Invalid name'),
    body('type', 'Invalid type'),
    body('data', 'Invalid data')
]), credentialsController.update);

router.delete('/:id', credentialsController.delete);

module.exports = router;