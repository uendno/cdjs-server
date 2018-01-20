const queue = require('async/queue');

exports.createQueue = (concurrentBuilds) => {
    return queue((taskObject, callback) => {
        taskObject.task(taskObject.agentId)
            .then(() => {
                return callback();
            })
            .catch(error => {
                console.error(error.stack);
                return callback(error);
            })
    }, concurrentBuilds);
};