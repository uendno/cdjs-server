const simpleGit = require('simple-git/promise');
const slugify = require('slug');
const spawn = require('child_process').spawn;
const path = require('path');
const Promise = require('bluebird');
const Url = require('url');
const mkdirp = require('mkdirp');
const fs = require('fs-extra');
const queue = require('async/queue');
const winston = require('winston');
const Stage = require('../models/Stage');
const eventEmitter = require('./events');
const wsEvents = require('../wsEvents');
const dirHelper = require('../helpers/dir');


/**
 * Create source code directory if needed, notify web clients that build is starting
 * @param build
 * @param job
 */
const prepareDir = (build, job) => {

    const buildPath = dirHelper.getBuildDir(job.name, build.number);

    // Make job directory if needed
    return new Promise((resolve, reject) => {
        mkdirp(buildPath, (error) => {
            if (error) return reject(error);
            return resolve(buildPath);
        })
    })
};

/**
 * Git clone, use defined credentials
 * @param build
 * @param job
 * @param repoPath
 * @param logger
 * @returns {*}
 */
const clone = (build, job, repoPath, logger) => {
    const credential = job.credential;

    if (!fs.existsSync(repoPath)) {
        const url = Url.parse(job.repoUrl);

        logger.info("Cloning repo at url: " + job.repoUrl);

        if (credential) {
            switch (credential.type) {
                case 'username/password':
                    url.auth = credential.data.username + ":" + credential.data.password
            }
        }

        const gitCli = simpleGit();
        return gitCli.clone(Url.format(url), repoPath);
    }
};

/**
 * Checkout to defined branch
 * @param job
 * @param repoPath
 * @param logger
 */
const checkout = (job, repoPath, logger) => {
    // check out, pull and update submodules
    const gitCli = simpleGit(repoPath);
    const branch = job.branch;

    logger.info("Pull code and checkout to branch: " + branch);

    return gitCli.pull('origin', branch)
        .then(() => gitCli.checkout(branch));
};

/**
 * Install npm packages
 * @param build
 * @param job
 * @param repoPath
 * @param logger
 */
const npmInstall = (build, job, repoPath, logger) => {

    logger.info("Runing npm install...");

    const cli = spawn('yarn || npm install', {
        cwd: repoPath,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    cli.stdout.on('data', data => logger.info(ansiEscape(data.toString())));
    cli.stderr.on('data', data => logger.error(ansiEscape(data.toString())));

    return new Promise((resolve, reject) => {
        cli.on('close', (code) => {
            if (code !== 0) {
                const error = new Error('Job exited with code: ' + code);
                error.code = code;
                return reject(error);
            } else {
                return resolve();
            }
        });
    })
};

/**
 * Execute cd.js file
 * @param build
 * @param job
 * @param repoPath
 * @param logger
 */
const executeStages = (build, job, repoPath, logger) => {

    const cdjsFilePath = path.join(repoPath, job.cdFilePath);

    return fs.exists(cdjsFilePath)
        .then(exists => {
            if (!exists) {
                throw new Error(job.cdFilePath + " does not exist!");
            }

            logger.info(`Executing cd.js file at: ${cdjsFilePath}`);

            const stageUpdateQueue = queue((task, callback) => {
                task()
                    .then(() => {
                        return callback();
                    })
                    .catch(error => {
                        return callback(error);
                    })
            }, 1);

            build.status = 'building';

            return build.save()
                .then(build => {
                    const cli = spawn('node', [cdjsFilePath], {
                        cwd: repoPath,
                        env: {
                            CDJS_GIT_USERNAME: job.credential && job.credential.data.username,
                            CDJS_GIT_ACCESS_TOKEN: job.credential && job.credential.data.password
                        },
                        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
                    });

                    cli.stdout.on('data', data => logger.info(ansiEscape(data.toString())));
                    cli.stderr.on('data', data => logger.error(ansiEscape(data.toString())));

                    cli.on('message', message => {
                        switch (message.type) {
                            case 'stages':

                                eventEmitter.emit(wsEvents.BUILD_STATUS, {
                                    jobId: job._id,
                                    build: build.toJSON()
                                });

                                const promises = [];
                                const stages = message.data;
                                stages.forEach(name => {
                                    const stage = new Stage({
                                        build: build._id,
                                        name,
                                        status: 'pending'
                                    });

                                    promises.push(stage.save()
                                        .then(stage => build.stages.push(stage))
                                        .then(() => build.save()));
                                });

                                stageUpdateQueue.push(Promise.all(promises));
                                break;

                            case 'stage-start': {
                                stageUpdateQueue.push(Stage.findAndUpdate({
                                        build: build._id,
                                        name: message.data
                                    }, {
                                        status: 'building'
                                    })
                                        .then(() => {
                                            eventEmitter.emit(wsEvents.BUILD_STATUS, {
                                                jobId: job._id,
                                                build: build.toJSON()
                                            })
                                        })
                                );

                                break;
                            }

                            case 'stage-success': {
                                stageUpdateQueue.push(Stage.findAndUpdate({
                                    build: build._id,
                                    name: message.data
                                }, {
                                    status: 'success'
                                }));

                                break;
                            }

                            case 'stage-failed': {
                                stageUpdateQueue.push(Stage.findAndUpdate({
                                    build: build._id,
                                    name: message.data
                                }, {
                                    status: 'failed'
                                }));

                                break;
                            }

                        }
                    });

                    cli.on('close', (code) => {
                        if (code !== 0) {
                            const error = new Error('Job exited with code: ' + code);
                            error.code = code;
                            return reject(error);
                        } else {
                            return resolve();
                        }
                    });

                });
        });
};

/**
 * Save build status, notify web clients
 * @param build
 * @param job
 * @returns {Promise.<TResult>}
 */
const complete = (build, job) => {
    build.status = 'success';
    build.doneAt = Date.now();

    return build.save()
        .then(() => {
            eventEmitter.emit(wsEvents.BUILD_STATUS, {
                jobId: job._id,
                build: build.toJSON(),
            });
        })
};

/**
 * Error handling
 * @param build
 * @param job
 * @param error
 * @param logger
 * @returns {Promise.<TResult>}
 */
const errorHandle = (build, job, error, logger) => {
    build.status = 'failed';
    build.doneAt = Date.now();

    return build.save()
        .then(() => {
            eventEmitter.emit(wsEvents.BUILD_STATUS, {
                jobId: job._id,
                build: build.toJSON(),
                error
            });

            console.log(error.stack);
            logger.error(error.stack);

            throw error;
        })
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

const ansiEscape = (string) => string.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

module.exports = (job, build) => () => {
    const repoPath = dirHelper.getRepoDir(job.name, job.repoUrl);


    build.status = 'preparing';
    build.startAt = Date.now();

    let logger;

    return build.save()
        .then(build => {
            eventEmitter.emit(wsEvents.BUILD_STATUS, {
                jobId: job._id,
                build: build.toJSON()
            });
        })
        .then(() => prepareDir(build, job))
        .then(buildPath => {
            logger = createLogger(buildPath);
        })
        .then(() => clone(build, job, repoPath, logger))
        .then(() => checkout(job, repoPath, logger))
        .then(() => npmInstall(build, job, repoPath, logger))
        .then(() => executeStages(build, job, repoPath))
        .then(() => complete(build, job))
        .catch(error => errorHandle(build, job, error, logger))

};