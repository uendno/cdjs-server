const gitUrlParse = require('git-url-parse');
const config = require('../config');

exports.getJobDir = (jobName) => {
    return config.workspace + "/" + jobName;
};

exports.getRepoDir = (jobName, repoUrl) => {
    return exports.getJobDir(jobName) + "/" + gitUrlParse(repoUrl).name;
};

exports.getBuildDir = (jobName, buildNumber) => {
    return exports.getJobDir(jobName) + "/builds/" + buildNumber;
};