const AdmZip = require('adm-zip');
const Path = require('path');
const fs = require('fs-extra');
const Build = require('../../models/Build');
const dirHelper = require('../../helpers/dir');



exports.upload = (req, res, next) => {
    const zip = new AdmZip(req.file.path);
    const buildId = req.decoded.buildId;
    const folderName = Path.basename(req.file.originalname, '.zip');
    let build;

    Build.findOne(({
        _id: buildId
    }))
        .populate('job')
        .then(found => {
            if (!found) {
                const error = new Error('Build not found!');
                error.status = 400;
                throw error;
            }

            build = found;

            const buildfolder = dirHelper.getBuildDir(build.job.slug, build.number);

            return new Promise((resolve, reject) => {
                zip.extractAllToAsync(buildfolder + "/" + folderName, true, function (error) {
                    if (error) return reject(error);
                    return resolve();
                });
            })
        })
        .then(() => {
            return fs.unlink(req.file.path);
        })
        .then(() => {
            build.achievements.push(folderName);
            return build.save();
        })
        .then(() => {
            res.sendSuccess(null);
        })
        .catch(error => {
            return next(error);
        })
};