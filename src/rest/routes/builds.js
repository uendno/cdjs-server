const express = require('express');
const router = express.Router();
const {body} = require('express-validator/check');

const validation = require('../../helpers/validation');
const buildsController = require('../controllers/builds');

router.get('/:id', buildsController.details);

router.post('/', validation.validate([
    body('jobId', 'Invalid jobId').exists()
]), buildsController.create);

module.exports = router;