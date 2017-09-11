const express = require('express');
const router = express.Router();

router.use('/webhook', require('./webhook'));
router.use('/git', require('./git'));

module.exports = router;