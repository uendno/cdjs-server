const express = require('express');
const router = express.Router();
const multer = require('multer');
const config = require('../../config');
const filesController = require('../controllers/files');


const upload = multer({dest: config.workspace + '/uploads/'});

router.post('/', upload.single('file'), filesController.upload);

module.exports = router;