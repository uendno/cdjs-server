const fs = require('fs-extra');
const rmdir = require('rmdir');
const Job = require('../../models/Job');
const Credential = require('../../models/Credential');
const Build = require('../../models/Build');
const config = require('../../config');

exports.list = (req, res, next) => {
    return Job.find()
        .then(jobs => {

            const data = jobs.map(job => job.toJSON());

            const promises = data.map(job => {
                return Build.findOne({job: job._id})
                    .sort({createdAt: -1})
                    .then(build => {
                        job.lastBuild = build;
                    })
            });

            return Promise.all(promises)
                .then(() => {
                    return res.sendSuccess(data);
                })
        })
        .catch(error => {
            return next(error);
        })
};

exports.details = (req, res, next) => {
    const id = req.params.id;
    let job;

    return Job.findOne({_id: id})
    // .populate({
    //     path: 'builds',
    //     populate: {
    //         path: 'agent',
    //         // select: '_id name'
    //     }
    // })
        .then(found => {
            if (!found) {
                const error = new Error('Job not found!');
                error.status = 404;

                throw error;
            }

            job = found;

            return Build.find({
                job: job._id
            })
                .sort('-createdAt')
                .populate({
                    path: 'agent',
                    select: '_id name'
                });
        })
        .then(builds => {
            return res.sendSuccess(Object.assign(job.toJSON(), {
                builds
            }))
        })
        .catch(error => {
            return next(error);
        })
};

exports.create = (req, res, next) => {
    const name = req.body.name;

    return Job.findOne({
        name
    })
        .then(found => {
            if (found) {
                const error = new Error("A job with this name already exists.");
                error.status = 400;

                throw error;
            } else {
                const job = new Job({
                    name,
                });
                return job.save();
            }
        })
        .then(job => {
            return res.sendSuccess(job.toJSON())
        })
        .catch(error => {
            return next(error);
        })
};

exports.update = (req, res, next) => {
    const id = req.params.id;
    const data = req.body;

    return Job.findOne({
        _id: id
    })
        .then(job => {
            if (!job) {
                const error = new Error('Job not found!');
                error.status = 404;

                throw error;
            }

            if (req.body.credential) {
                return Credential.findOne({
                    _id: req.body.credential
                })
                    .then(credential => {
                        if (!credential) {
                            const error = new Error('Invalid credential ID');
                            error.status = 400;

                            throw error;
                        }
                    })
            }
        })
        .then(() => {
            return Job.findOneAndUpdate({
                _id: id
            }, data, {
                new: true
            })
        })
        .then(job => {
            return res.sendSuccess(job.toJSON())
        })
        .catch(error => {
            return next(error);
        })
};

exports.delete = (req, res, next) => {

    const id = req.params.id;

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
        .then(() => {
            req.sendSuccess(null);
        })
        .catch(error => {
            return next(error);
        });
};