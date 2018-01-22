const express = require('express');
const router = express.Router();
const {body} = require('express-validator/check');

const validation = require('../../helpers/validation');
const buildsController = require('../controllers/builds');

router.get('/:id', buildsController.details);

router.post('/', validation.validate([
    body('jobId', 'Invalid jobId').exists()
]), buildsController.create);

router.get('/:id/files', buildsController.getFiles);

router.get('/:id/files/*', buildsController.downloadFile);

module.exports = router;