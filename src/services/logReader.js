const Tail = require('always-tail');
const _ = require('lodash');

exports.readFile = (file, wait, onLine, onError) => {
    const tail = new Tail(file, '/end_line/', {
        start: 0
    });

    let buffer = [];


    const throttled = _.throttle(() => {
        onLine(buffer);
        buffer = [];
    }, wait, {
        leading: false,
        trailing: true
    });

    tail.on("line", data => {

        try {
            const json = JSON.parse(data);
            buffer.push(json);
        } catch (error) {
            buffer.push(data);
        }

        // empty buffer and call onLine every [wait] milliseconds
        throttled()
    });

    tail.on('error', onError);

    return {
        unwatch: tail.unwatch
    }
};