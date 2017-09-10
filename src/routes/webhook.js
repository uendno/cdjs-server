const express = require('express');
const router = express.Router();
const util = require('util');
const Job = require('../models/Job');

router.post('/url', (req, res, next) => {

    const push = req.body;

    // console.log(util.inspect(req.body, {
    //     showHidden: true,
    //     depth: null
    // }));

    res.send("OK");

    Job.find({
        "git.id": push.repository.id
    })
        .then(jobs => {
            jobs.forEach(job => {
                
            })
        });

});

module.exports = router;