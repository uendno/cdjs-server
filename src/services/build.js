const simpleGit = require('simple-git/promise');
const spawn = require('child_process').spawn;
const path = require('path');
const Promise = require('bluebird');
const Url = require('url');
const mkdirp = require('mkdirp');
const gitUrlParse = require("git-url-parse");
const fs = Promise.promisifyAll(require('fs'));
const queue = require('async/queue');
const Stage = require('../models/Stage');
const config = require('../config');
const eventEmitter = require('./events');
const wsEvents = require('../wsEvents');


/**
 * Create source code directory if needed, notify web clients that build is starting
 * @param build
 * @param job
 * @param jobPath
 */
const prepare = (build, job, jobPath) => {
    // Make job directory if needed
    return new Promise((resolve, reject) => {
        mkdirp(jobPath, (error) => {
            if (error) return reject(error);
            return resolve();
        })
    })
};

/**
 * Git clone, use defined credentials
 * @param build
 * @param job
 * @param repoPath
 * @param jobPath
 * @returns {*}
 */
const clone = (build, job, repoPath) => {

    const credential = job.credential;

    if (!fs.existsSync(repoPath)) {
        const url = Url.parse(job.repoUrl);

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
 */
const checkout = (job, repoPath) => {
    // check out, pull and update submodules
    const gitCli = simpleGit(repoPath);
    const branch = job.branch;
    return gitCli.pull('origin', branch)
        .then(() => gitCli.checkout(branch));
};

/**
 * Install npm packages
 * @param build
 * @param job
 * @param repoPath
 */
const npmInstall = (build, job, repoPath) => {
    const cdjsFilePath = path.join(repoPath, job.cdFilePath);

    console.log(`Executing cd.js file at: ${cdjsFilePath}`);

    const stageUpdateQueue = queue((task, callback) => {
        task()
            .then(() => {
                return callback();
            })
            .catch(error => {
                return callback(error);
            })
    }, 1);


    const cli = spawn('yarn || npm install', {
        cwd: repoPath,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    cli.stdout.on('data', data => console.log(`stdout: ${data}`));
    cli.stderr.on('data', data => console.log(`stderr: ${data}`));

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
 */
const execute = (build, job, repoPath) => {
    const cdjsFilePath = path.join(repoPath, job.cdFilePath);

    console.log(`Executing cd.js file at: ${cdjsFilePath}`);

    const stageUpdateQueue = queue((task, callback) => {
        task()
            .then(() => {
                return callback();
            })
            .catch(error => {
                return callback(error);
            })
    }, 1);


    const cli = spawn('node', [cdjsFilePath], {
        cwd: repoPath,
        env: {
            CDJS_GIT_USERNAME: job.credential && job.credential.data.username,
            CDJS_GIT_ACCESS_TOKEN: job.credential && job.credential.data.password
        },
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    cli.stdout.on('data', data => console.log(`stdout: ${data}`));
    cli.stderr.on('data', data => console.log(`stderr: ${data}`));
    cli.on('message', message => {
        switch (message.type) {
            case 'stages':

                eventEmitter.emit(wsEvents.BUILD_STATUS, {
                    job: job._id,
                    build: build._id,
                    status: 'building'
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
                                job: job._id,
                                build: build._id,
                                status: 'stage-start',
                                stage: message.data
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
                job: job._id,
                build: {
                    _id: build._id,
                    status: 'success',
                    startAt: build.startAt,
                    doneAt: build.doneAt
                },
                status: 'success'
            });
        })
};

/**
 * Error handling
 * @param build
 * @param job
 * @param error
 * @returns {Promise.<TResult>}
 */
const errorHandle = (build, job, error) => {
    build.status = 'failed';
    build.doneAt = Date.now();

    return build.save()
        .then(() => {
            eventEmitter.emit(wsEvents.BUILD_STATUS, {
                job: job._id,
                build: {
                    _id: build._id,
                    status: 'failed',
                    startAt: build.startAt,
                    doneAt: build.doneAt
                },
                status: 'failed',
                error
            });

            throw error;
        })
};

module.exports = (job, build) => () => {
    const jobPath = config.workspace + "/" + job.name;
    const repoPath = jobPath + "/" + gitUrlParse(job.repoUrl).name;


    build.status = 'preparing';
    build.startAt = Date.now();

    eventEmitter.emit(wsEvents.BUILD_STATUS, {
        job: job._id,
        build: {
            _id: build._id,
            status: 'preparing',
            startAt: build.startAt
        },

    });

    return build.save()
        .then((build) => prepare(build, job, jobPath))
        .then(() => clone(build, job, repoPath))
        .then(() => checkout(job, repoPath))
        .then(() => npmInstall(build, job, repoPath))
        .then(() => execute(build, job, repoPath))
        .then(() => complete(build, job))
        .catch(error => errorHandle(build, job, error))
};