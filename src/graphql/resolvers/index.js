const GraphQLJSON = require('graphql-type-json');
const GraphQLDate = require('graphql-date');
const job = require('./job');
const credential = require('./credential');
const build = require('./build');

module.exports = {
    JSON: GraphQLJSON,
    Date: GraphQLDate,

    Query: {
        checkJobName: job.checkJobName,
        allJobs: job.allJobs,
        checkCredentialName: credential.checkCredentialName,
        allCredentials: credential.allCredentials,
        jobDetails: job.jobDetails,
        buildDetails: build.buildDetails
    },

    Mutation: {
        createJob: job.createJob,
        updateJob: job.updateJob,
        deleteJob: job.deleteJob,
        createCredential: credential.createCredential,
        updateCredential: credential.updateCredential,
        deleteCredential: credential.deleteCredential,
        play: job.play,
    },

    Job: {
        lastBuild: job.lastBuild,
        builds: job.builds,
        webhookUrl: job.webhookUrl
    },
};