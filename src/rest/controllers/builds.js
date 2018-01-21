const Build = require('../../models/Build');
const buildSrv = require('../../services/build');

exports.details = (req, res, next) => {
    const id = req.params.id;

    return Build.findOne({
        _id: id
    })
        .populate({
            path: 'agent',
            select: '_id name'
        })
        .then(build => {
            if (!build) {
                const error = new Error('Build not found!');
                error.status = 404;
                throw error;
            }

            return res.sendSuccess(build);
        })
        .catch(error => {
            return next(error);
        })
};

exports.create = (req, res, next) => {

    const jobId = req.body.jobId;

    return buildSrv.createBuild(jobId)
        .then(build => {
            return res.sendSuccess(build);
        })
        .catch(error => {
            return next(error);
        })
};