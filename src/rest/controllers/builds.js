const fs = require('fs-extra');
const Path = require('path');
const url = require('url');
const jwt = require('jsonwebtoken');
const AdmZip = require('adm-zip');
const Promise = require('bluebird');
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

            if (!fs.existsSync(buildFolder)) {
                return tree
            } else {
                return listFiles(buildId, buildFolder, '', tree)
                    .then(() => {
                        return tree;
                    })
            }
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


    const token = req.query.access_token;

    if (!token) {
        const error = new Error('Access token is required.');
        error.status = 401;
        return next(error);
    }

    const decoded = jwt.decode(token, config.auth.jwtSecret);

    if (decoded.path !== relativePath) {
        const error = new Error('Invalid access token');
        error.status = 401;
        return next(error);
    }


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
        tree.downloadUrl = config.server.publicUrl + '/builds/' + buildId + '/files' + relativePath + '?access_token=' + jwt.sign({
            path: relativePath
        }, config.auth.jwtSecret);
    }

    return fs.stat(path)
        .then(stats => {
            if (stats.isDirectory()) {

                tree.children = [];

                return fs.readdir(path)
                    .then(files => {
                        return Promise.each(files, file => {
                            return fs.stat(path + '/' + file)
                                .then(stats => {
                                    if ((stats.isFile() || stats.isDirectory()) && file !== '.DS_Store') {
                                        const child = {
                                            name: Path.basename(file)
                                        };

                                        tree.children.push(child);

                                        return listFiles(buildId, path + '/' + file, relativePath + '/' + file, child)
                                    }
                                })
                        });
                    })
            } else {
                tree.size = stats.size;
                return null;
            }
        });
};