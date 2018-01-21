const express = require('express');
const router = express.Router();
const {query} = require('express-validator/check');
const validation = require('../../helpers/validation');
const gitHooksController = require('../controllers/git-hooks');

router.post('/', validation.validate([
    query('slug', 'Invalid slug').exists(),
    query('type', 'Invalid type').isIn('github', 'gitlab', 'bitbucket').exists(),
]),gitHooksController.push);

module.exports = router;