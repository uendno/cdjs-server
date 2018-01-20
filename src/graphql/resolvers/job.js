const _ = require('lodash');
const fs = require('fs');
const rmdir = require('rmdir');
const Job = require('../../models/Job');
const Build = require('../../models/Build');
const config = require('../../config');
const buildSrv = require('../../services/build');

exports.checkJobName = (root, {name, currentJobId}) => {
    return Job.findOne(
        {
            $or: [
                {name}
            ],
            _id: {
                $ne: currentJobId
            }
        }
    )
        .then(found => {
            if (found) {
                return {
                    valid: false
                }
            } else {
                return {
                    valid: true
                }
            }
        })
};

exports.allJobs = (root) => {
    return Job.find();
};

exports.getJob = (root, {id}) => {
    return Job.findOne({_id: id});
};

exports.createJob = (root, {name}) => {

    return Job.findOne({
        name
    })
        .then(found => {
            if (found) {
                throw new Error("A job with this name already exists.");
            } else {
                const job = new Job({
                    name,
                });
                return job.save();
            }
        })
};

exports.updateJob = (root, {id, name, repoType, repoUrl, branch, credentialId, description, cdFilePath}) => {
    const data = _.pickBy({
        name,
        repoType,
        repoUrl,
        branch,
        credential: credentialId,
        description,
        cdFilePath
    }, _.identity);

    console.log(data);

    return Job.findOne({
        _id: id
    })
        .then(job => {
            if (!job) {
                throw new Error('Job not found!');
            }

            job = Object.assign(job, data);

            return job.save();
        });
};

exports.deleteJob = (root, {id}) => {
    let buildIds;

    return Build.find({job: id})
        .then(builds => {
            buildIds = builds.map(b => b._id)
        })
        .then(() => {
            return Build.remove({job: id});
        })
        .then(() => {
            return Job.findOne({_id: id});
        })
        .then((job) => {
            return new Promise((resolve, reject) => {
                const jobPath = config.workspace + "/" + job.name;

                fs.exists(jobPath, (exists) => {
                    if (exists) {
                        rmdir(jobPath, (error) => {
                            if (error) {
                                return reject(error);
                            }

                            return resolve();
                        })
                    } else {
                        resolve();
                    }
                })
            })
        })
        .then(() => {
            return Job.remove({_id: id});
        })
        .then(() => "Done!");
};

exports.play = (root, {id}) => {
    return buildSrv.createBuild(id);
};

exports.lastBuild = ({_id}) => {
    return Build.findOne({job: _id})
        .sort({createdAt: -1})
};

exports.builds = ({_id}) => {
    return Build.find({job: _id})
        .sort({createdAt: -1})
        .populate('stages')
        .populate('agent', '_id name status')
};

exports.jobDetails = (root, {id}) => {
    return Job.findOne({_id: id});
};

exports.webhookUrl = ({slug}) => config.webHook.url + "/" + slug;