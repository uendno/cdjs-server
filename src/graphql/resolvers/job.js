const randomstring = require('randomstring');
const slugify = require('slug');
const _ = require('lodash');
const rmdir = require('rmdir');
const Job = require('../../models/Job');
const Build = require('../../models/Build');
const Stage = require('../../models/Stage');
const config = require('../../config');
const buildSrv = require('../../services/build');
const queueSrv = require('../../services/queue');
const eventEmitter = require('../../services/events');
const wsEvents = require('../../wsEvents');

exports.checkJobName = (root, {name}) => {

    const slug = slugify(name, {
        lower: true
    });

    return Job.findOne({
        $or: [
            {name},
            {slug}
        ]
    })
        .then(found => {
            if (found) {
                return {
                    valid: false
                }
            } else {
                const generatedSecret = randomstring.generate();
                return {
                    valid: true,
                    generatedSecret,
                    webhookUrl: config.webHook.url + "/" + slug + "?secret=" + generatedSecret
                }
            }
        })
};

exports.allJobs = (root) => {
    return Job.find().populate('credential');
};

exports.createJob = (root, {name, repoType, repoUrl, branch, credentialId, description, secret, cdFilePath}) => {

    const slug = slugify(name, {
        lower: true
    });


    const data = _.pickBy({
        name,
        slug,
        repoType,
        repoUrl,
        branch,
        credentialId,
        description,
        secret,
        cdFilePath
    }, _.identity);


    return Job.findOne({
        name
    })
        .then(found => {
            if (found) {
                throw new Error("A job with this name already exists.");
            } else {
                const job = new Job(data);
                return job.save();
            }
        })
        .then(job => {
            return Job.findOne({_id: job._id})
                .populate('credential')
        });
};

exports.updateJob = (root, {id, name, repoType, repoUrl, branch, credentialId, description, secret, cdFilePath}) => {

};

exports.deleteJob = (root, {id}) => {
    let buildIds;

    Build.find({job: id})
        .then(builds => {
            buildIds = builds.map(b => b._id)
        })
        .then(() => {
            return Stage.remove({
                build: {
                    $in: buildIds
                }
            })
        })
        .then(() => {
            return Build.remove({job: id});
        })
        .then(() => {
            return Job.remove({_id: id});
        })
        .then(() => {
            return new Promise((resolve, reject) => {
                const jobPath = config.workspace + "/" + job.name;
                const repoPath = jobPath + "/source";
                rmdir(repoPath, (error) => {
                    if (error) {
                        return reject(error);
                    }

                    return resolve();
                })
            })
        })
        .then(() => "Done!");
};

exports.play = (root, {id}) => {
    let job;

    return Job.findOne({
        _id: id
    })
        .populate('credential')
        .then(res => {
            job = res;

            // create new build
            const build = new Build({
                job: job._id,
                status: 'pending'
            });

            return build.save();
        })
        .then(build => {

            eventEmitter.emit(wsEvents.BUILD_STATUS, {
                job: job._id,
                build: {
                    _id: build._id,
                    status: 'pending',
                    startAt: build.startAt
                },
            });

            const task = buildSrv(job, build);
            queueSrv.push(task);

            return build._id;
        });
};

exports.lastBuild = ({_id}) => {
    return Build.findOne({job: _id})
        .sort({createdAt: -1})
        .populate('stages');
};

exports.builds = ({_id}) => {
    return Build.find({job: _id})
        .sort({createdAt: -1})
        .populate('stages');
};

exports.jobDetails = (root, {id}) => {
    return Job.findOne({_id: id});
};