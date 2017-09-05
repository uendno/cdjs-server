const Job = require('../models/Job');

module.exports = {
    Query: {
        allJobs: () => {
            return Job.find();
        }
    },

    Mutation: {
        createJob: (_, data) => {

            const git = data.git;

            const job = new Job({
                name: data.name,
                git: {
                    id: git.id,
                    name: git.name,
                    fullName: git.fullName
                },
                cdFilePath: data.cdFilePath
            });

            return job.save();
        }
    }
};