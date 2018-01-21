const Promise = require('bluebird');
const mkdirp = require('mkdirp');
const _ = require('lodash');
const winston = require('winston');
const Queue = require('async/queue');
const eventEmitter = require('./events');
const config = require('../config');
const dirHelper = require('../helpers/dir');
const Job = require('../models/Job');
const Build = require('../models/Build');
const agentsSrv = require('./agents');

const wsEvents = config.wsEvents;
const agentMessages = config.agentMessages;

const buildSavingQueues = {};

/**
 * Create source code directory if needed, notify web clients that build is starting
 * @param build
 * @param job
 */
const prepareDir = (build, job) => {

    const buildPath = dirHelper.getBuildDir(job.slug, build.number);

    // Make jobs directory if needed
    return new Promise((resolve, reject) => {
        mkdirp(buildPath, (error) => {
            if (error) return reject(error);
            return resolve(buildPath);
        })
    })
};

/**
 * Save build status, notify web clients
 * @param build
 * @param job
 * @param logger
 * @returns {Promise.<TResult>}
 */
const complete = (build, job, logger) => {
    build.status = 'success';
    build.doneAt = Date.now();

    logger.info('Build result: PASSED', {
        label: 'system'
    });

    return build.save()
        .then(() => {
            eventEmitter.emit(wsEvents.BUILD_STATUS, {
                jobId: job._id,
                build: build.toJSON(),
            });
        })
};

const saveBuild = (buildId, data) => {
    let queue = buildSavingQueues[buildId];

    if (!queue) {
        queue = Queue((task, callback) => {
            task()
                .then(() => {
                    return callback();
                })
                .catch(error => {
                    console.error(error.stack);
                    return callback(error);
                })
        }, 1);

        buildSavingQueues[buildId] = queue;
    }

    queue.push(() => Build.findOneAndUpdate({
        _id: buildId
    }, data, {
        new: true
    })
        .populate('agent', '_id name status')
        .then(build => {
            eventEmitter.emit(wsEvents.BUILD_STATUS, {
                jobId: build.job,
                build: build.toJSON(),
            });
        }))
};

/**
 * Error handling
 * @param build
 * @param job
 * @param error
 * @param logger
 * @param tunnel
 * @returns {Promise.<TResult>}
 */
const errorHandle = (build, job, error, logger, tunnel) => {
    if (tunnel) {
        tunnel.end();
    }

    saveBuild(build._id, {
        status: 'failed',
        doneAt: Date.now()
    });

    if (logger) {
        logger.error(error.stack);
        logger.info('Build result: FAILED', {
            label: 'system'
        });
    } else {
        console.error(error);
    }
};

/**
 * Create file logger
 * @param buildDir
 * @returns {DerivedLogger}
 */
const createLogger = (buildDir) => {
    const {combine, timestamp, printf} = winston.format;

    const myFormat = printf(info => {
        let message = info.message;
        if (message.endsWith('\n')) {
            message = message.slice(0, message.length - 1);
        }
        return JSON.stringify(Object.assign(info, {message})) + "/end_line/";
    });

    return winston.createLogger({
        level: 'info',
        format: combine(
            timestamp(),
            myFormat
        ),
        transports: [
            new winston.transports.File({
                filename: buildDir + "/combined.log",
                level: 'info'
            }),
            new winston.transports.File({
                filename: buildDir + "/error.log",
                level: 'error'
            }),
        ]
    });
};

const createTask = (inputBuild, job) => {
    return (agentId) => {

        let build = inputBuild;

        const debug = require('debug')('build:' + build._id.toString());

        build.status = 'preparing';
        build.startAt = Date.now();
        build.agent = agentId;

        let logger;
        let tunnel;

        const onMessage = (message) => {

            const data = message.data;

            debug('Incoming: ' + message.type);

            switch (message.type) {
                case agentMessages.LOG: {
                    return logger[data.level || 'info'](data.message, data.options);
                }

                case agentMessages.PREPARE_DIR_COMPLETE: {

                    debug('Sending: ' + agentMessages.CLONE);

                    return tunnel.sendMessage({
                        type: agentMessages.CLONE,
                        data: {
                            job: job.toJSON()
                        }
                    })
                }

                case agentMessages.CLONE_COMPLETE: {

                    debug('Sending: ' + agentMessages.CHECK_OUT);

                    return tunnel.sendMessage({
                        type: agentMessages.CHECK_OUT,
                        data: {
                            job: job.toJSON()
                        }
                    })
                }

                case agentMessages.CHECK_OUT_COMPLETE: {

                    debug('Sending: ' + agentMessages.NPM_INSTALL);

                    return tunnel.sendMessage({
                        type: agentMessages.NPM_INSTALL,
                        data: {
                            job: job.toJSON()
                        }
                    })
                }

                case agentMessages.NPM_INSTALL_COMPLETE: {
                    return tunnel.sendMessage({
                        type: agentMessages.RUN_SCRIPT,
                        data: {
                            build: build.toJSON(),
                            job: job.toJSON()
                        }
                    })
                }

                case agentMessages.RUN_SCRIPT_COMPLETE: {

                    debug('Sending: ' + agentMessages.DONE);

                    return complete(build, job, logger)
                        .then(() => {
                            tunnel.end();
                        })
                }

                case agentMessages.SAVE_BUILD: {
                    const updateData = _.omit(data.build, ['_id', '_v']);
                    return saveBuild(build._id, updateData);
                }

                case agentMessages.ERROR: {
                    return errorHandle(build, job, data.error, logger, tunnel)
                }
            }
        };

        return build.save()
            .then(build => {
                return Build.populate(build, {
                    path: 'agent',
                    select: '_id name status'
                });
            })
            .then(res => {
                build = res;

                eventEmitter.emit(wsEvents.BUILD_STATUS, {
                    jobId: job._id,
                    build: build.toJSON()
                });
            })
            .then(() => {

                debug('Creating tunnel');

                tunnel = agentsSrv.createTunnel(agentId, build._id);

                return tunnel.setOnMessage(onMessage)
            })
            .then(() => {

                debug('Create tunnel successfully');

                return prepareDir(build, job)
            })
            .then(buildPath => {
                logger = createLogger(buildPath);
            })
            .then(() => {

                debug('Sending: ' + agentMessages.PREPARE_DIR);

                tunnel.sendMessage({
                    type: agentMessages.PREPARE_DIR,
                    data: {
                        build: build.toJSON(),
                        job: job.toJSON()
                    }
                })
            })
            .catch(error => errorHandle(build, job, error, logger, tunnel))
    };
};

exports.createBuild = (jobId, push) => {

    let job;

    return Job.findOne({
        _id: jobId,
    })
        .populate('credential')
        .then(res => {
            job = res;

            if (!job) {
                const error = new Error('Job not found!');
                error.status = 400;
                throw error;
            }

            if (job.status !== 'active') {
                const error = new Error('Can\' process this jobs!');
                error.status = 400;
                throw error;
            }

            let build;

            if (push) {
                const commit = push.head_commit;
                // create new build
                build = new Build({
                    job: jobId,
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

            } else {
                build = new Build({
                    job: jobId,
                    status: 'pending',
                });
            }

            return build.save();
        })
        .then(build => {

            eventEmitter.emit(wsEvents.NEW_BUILD, {
                jobId,
                build: build.toJSON(),
            });

            const task = createTask(build, job);

            agentsSrv.assignTask(task, job.agentId);

            return build;
        });
};