const express = require('express');
const router = express.Router();

router.use('/webhook', require('./webhook'));
router.use('/auth', require('./auth'));
// router.use('/service', require('./service'));

module.exports = router;