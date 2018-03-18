const express = require('express');
const router = express.Router();
const {body} = require('express-validator/check');

const validation = require('../../helpers/validation');
const jobsController = require('../controllers/jobs');
const {permissionMiddleware} = require('../middlewares/auth');

router.get('/', jobsController.list);

router.post('/', [permissionMiddleware(['create'], 'id')], validation.validate([body('name', 'Invalid name').exists()]), jobsController.create);

router.get('/:id', [permissionMiddleware(['read'], 'id')], jobsController.details);

router.put('/:id', validation.validate([
    permissionMiddleware(['update'], 'id'),
    body('name', 'Invalid name'),
    body('repoType', 'Invalid repoType'),
    body('repoUrl', 'Invalid repoUrl'),
    body('branch', 'Invalid branch'),
    body('credential', 'Invalid credential'),
    body('description', 'Invalid description'),
    body('cdFilePath', 'Invalid cdFilePath')
]), jobsController.update);

router.delete('/:id', [permissionMiddleware(['create'], 'id')], jobsController.delete);

module.exports = router;