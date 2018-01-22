const express = require('express');
const router = express.Router();
const buildsController = require('./controllers/builds');


router.use(require('./middlewares/decorators'));

// unprotected

router.use('/auth', require('./routes/auth'));
router.use('/git-hooks', require('./routes/git-hooks'));
router.get('/builds/:id/files/*', buildsController.downloadFile);


// protected
router.use(require('./middlewares/auth'));

router.use('/jobs', require('./routes/jobs'));
router.use('/name-validations', require('./routes/name-validations'));
router.use('/agents', require('./routes/agents'));
router.use('/credentials', require('./routes/credentials'));
router.use('/builds', require('./routes/builds'));
router.use('/files', require('./routes/files'));

module.exports = router;