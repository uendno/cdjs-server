const Job = require('../../models/Job');
const buildSrv = require('../../services/build');

exports.push = (req, res, next) => {

    const push = req.body;
    const slug = req.query.slug;
    const type = req.query.type;

    res.send("OK");

    return Job.findOne({
        slug,
        status: 'active'
    })
        .populate('credential')
        .then(job => {
            if (job) {
                return buildSrv.createBuild(job._id, push, type);
            }
        })
};