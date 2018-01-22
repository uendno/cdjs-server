const fs = require('fs-extra');
const Path = require('path');
const url = require('url');
const AdmZip = require('adm-zip');
const Build = require('../../models/Build');
const buildSrv = require('../../services/build');
const dirHelper = require('../../helpers/dir');
const config = require('../../config');

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

exports.getFiles = (req, res, next) => {
    const buildId = req.params.id;
    let build;

    return Build.findOne({
        _id: buildId
    })
        .populate('job')
        .then(found => {
            if (!found) {
                const error = new Error('Build not found!');
                error.status = 404;
                throw error;
            }

            build = found;

            const buildFolder = dirHelper.getBuildDir(build.job.slug, build.number);

            const tree = {
                name: Path.basename(buildFolder)
            };

            return listFiles(buildId, buildFolder, '', tree)
                .then(() => {
                    return tree;
                })
        })
        .then(tree => {
            return res.sendSuccess(tree)
        })
        .catch(error => {
            return next(error);
        })
};

exports.downloadFile = (req, res, next) => {
    const buildId = req.params.id;
    let path;
    let relativePath = url.parse(req.originalUrl.replace(`/builds/${buildId}/files`, '')).pathname;
    let build;

    return Build.findOne({
        _id: buildId
    })
        .populate('job')
        .then(found => {
            if (!found) {
                const error = new Error('Build not found!');
                error.status = 404;
                throw error;
            }

            build = found;

            const buildFolder = dirHelper.getBuildDir(build.job.slug, build.number);

            path = buildFolder + relativePath;

            return fs.stat(path)
        })
        .then(stats => {
            if (stats.isFile()) {
                return res.download(path)
            } else if (stats.isDirectory()) {
                const zip = AdmZip();
                zip.addLocalFolder(path, Path.basename(path));
                const zipFile = Path.dirname(path) + '/cdjs-download-' + Date.now().toString() + '.zip';

                // Add zip file and download
                zip.writeZip(zipFile, (error) => {
                    if (error) return reject(error);

                    // Delete after download
                    const stream = fs.createReadStream(zipFile);
                    stream.on('end', function () {
                        fs.unlink(zipFile);
                    });
                    stream.pipe(res);

                    return res.download(zipFile);
                });

            } else {
                const error = new Error('File not found!');
                error.status = 404;
                throw error;
            }
        })
        .catch(error => {
            return next(error);
        })
};

const listFiles = (buildId, path, relativePath, tree) => {

    if (relativePath !== '') {
        tree.downloadUrl = config.server.publicUrl + '/builds/' + buildId + '/files' + relativePath;
    }

    return fs.stat(path)
        .then(stats => {
            if (stats.isDirectory()) {

                tree.children = [];

                return fs.readdir(path)
                    .then(files => {

                        const promises = [];

                        files.forEach(file => {
                            const child = {
                                name: Path.basename(file)
                            };

                            tree.children.push(child);

                            promises.push(listFiles(buildId, path + '/' + file, relativePath + '/' + file, child))
                        });

                        return Promise.all(promises);
                    })
            } else {
                tree.size = stats.size;
                return null;
            }
        });
};