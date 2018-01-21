const express = require('express');
const router = express.Router();
const Job = require('../../models/Job');
const queueSrv = require('../../services/queue');
const buildSrv = require('../../services/build');
const Build = require('../../models/Build');
const eventEmitter = require('../../services/events');
const wsEvents = require('../../config').wsEvents;

router.post('/:slug', (req, res, next) => {

    const push = req.body;
    const slug = req.params.slug;

    // console.log(util.inspect(req.body, {
    //     showHidden: true,
    //     depth: null
    // }));

    res.send("OK");

    Job.findOne({
        slug,
        status: 'active'
    })
        .populate('credential')
        .then(job => {
            const commit = push.head_commit;

            // create new build
            const build = new Build({
                job: job._id,
                status: 'pending',
                commit: {
                    id: commit.id,
                    message: commit.message,
                    author: commit.author,
                    url: commit.url,
                    addedFiles: commit.added,
                    removedFiles: commit.removed,
                    modifiedFiles: commit.modified,
                    createdAt: new Date(commit.timestamp)
                }
            });

            return build.save()
                .then(build => {

                    eventEmitter.emit(wsEvents.NEW_BUILD, {
                        jobId: job._id,
                        build: build.toJSON(),
                    });

                    const task = buildSrv(job, build);
                    queueSrv.push(task);
                });
        })


});

module.exports = router;