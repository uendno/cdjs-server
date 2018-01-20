const eventEmitter = require('../services/events');
const wsEvents = require('../config').wsEvents;
const agentsSrv = require('../services/agents');

const handleError = (socket, error) => {
    console.error(error.stack);
    socket.emit(wsEvents.ERROR, error.message)
};

module.exports = io => {
    io.on('connection', socket => {
        const token = socket.handshake.query.token;
        const address = socket.handshake.address;

        agentsSrv.connectAgent(socket.id, address, token)
            .catch(error => {
                handleError(socket, error);
            });

        socket.on('disconnect', () => {
            agentsSrv.disconnectAgent(socket.id)
                .catch(error => {
                    handleError(socket, error);
                });
        });

        socket.on(wsEvents.CREATE_AGENT_COMMUNICATION_TUNNEL_RESPONSE, buildId => {
            eventEmitter.emit(wsEvents.CREATE_AGENT_COMMUNICATION_TUNNEL_RESPONSE, socket.id, buildId);
        });

        socket.on(wsEvents.MESSAGE_FROM_AGENT, (buildId, message) => {
            eventEmitter.emit(wsEvents.MESSAGE_FROM_AGENT, socket.id, buildId, message);
        });
    });

    eventEmitter.on(wsEvents.BUILD, (job, build) => {
        agentsSrv.assignTask(() => {

        })
    });

    eventEmitter.on(wsEvents.DISCONNECT_AGENT, (id) => {
        const socket = io.connected[id];

        if (socket) {
            socket.disconnect();
        }
    });

    eventEmitter.on(wsEvents.CREATE_AGENT_COMMUNICATION_TUNNEL, (socketId, buildId) => {
        const socket = io.connected[socketId];

        if (socket) {
            socket.emit(wsEvents.CREATE_AGENT_COMMUNICATION_TUNNEL, buildId);
        }
    });

    eventEmitter.on(wsEvents.SEND_MESSAGE_TO_AGENT, (socketId, buildId, message) => {
        const socket = io.connected[socketId];

        if (socket) {
            socket.emit(wsEvents.SEND_MESSAGE_TO_AGENT, buildId, message);
        }
    })
};