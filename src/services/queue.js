const queue = require('async/queue');


const q = queue((task, callback) => {
    task()
        .then(() => {
            console.log("DONE!!!!!!!!!!!");
            return callback();
        })
        .catch(error => {
            console.error(error.stack);
            return callback(error);
        })
}, 1);


exports.push = (task) => {
    q.push(task);
};


