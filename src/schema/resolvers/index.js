const Job = require('../../models/Job');
const Git = require('../../models/Git');

module.exports = {
    Query: {
        allJobs: () => {
            return Job.find();
        },

        allGithubAccounts: () => {
            return Git.find();
        },

        reposForAccountId: require('./reposForAccountId'),

        jobByName: (_, {name}) => {
            return Job.findOne({name});
        }
    },

    Mutation: {
        createJob: require('./createJob')
    }
};