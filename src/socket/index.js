module.exports = (server) => {
    const io = require('socket.io')(server);

    require('./web')(io.of('/web'));
};