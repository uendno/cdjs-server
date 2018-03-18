const express = require('express');
const router = express.Router();
const {body} = require('express-validator/check');

const validation = require('../../helpers/validation');
const nameValidationsController = require('../controllers/name-validations');

router.post('/', validation.validate([
    body('name', 'Invalid name').exists(),
    body('currentId', 'Invalid currentId').exists(),
    body('collection', 'Invalid collection').exists().isIn(['agents', 'jobs', 'credentials', 'users'])
]),nameValidationsController.validate);

module.exports = router;