const eventEmitter = require('../services/events');
const wsEvents = require('../wsEvents');


module.exports = io => {
    eventEmitter.on(wsEvents.BUILD_STATUS, message => {
        io.emit(wsEvents.BUILD_STATUS, message)
    })
};