const express = require('express');
const router = express.Router();


router.use(require('./middlewares/decorators'));

// unprotected

router.use('/auth', require('./routes/auth'));


// protected
router.use(require('./middlewares/auth'));

router.use('/webhook', require('./routes/webhook'));
router.use('/jobs', require('./routes/jobs'));
router.use('/name-validations', require('./routes/name-validations'));
router.use('/agents', require('./routes/agents'));
router.use('/credentials', require('./routes/credentials'));
router.use('/builds', require('./routes/builds'));

module.exports = router;