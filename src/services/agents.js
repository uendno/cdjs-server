const jwt = require('jsonwebtoken');
const Agent = require('../models/Agent');
const queueSrv = require('./queue');
const config = require('../config');
const eventEmitter = require('../services/events');

const wsEvents = config.wsEvents;
const agentMessages = config.agentMessages;

const agentControllers = [];
const listeners = [];

const removeAgentControllerBySocketId = (socketId) => {
    let selectedIndex = -1;

    agentControllers.forEach((c, index) => {
        if (c.socketId = socketId) {
            selectedIndex = index
        }
    });

    if (selectedIndex > -1) {
        agentControllers.splice(selectedIndex, 1);
    }
};

exports.connectAgent = (socketId, ip, token) => {
    let agent;

    return new Promise((resolve, reject) => {
        jwt.verify(token, config.auth.jwtSecret, (error, decoded) => {
            if (error) return reject(error);

            resolve(decoded)
        });
    })
        .then(decoded => {
            return Agent.findOne({
                _id: decoded.id,
                status: {
                    $ne: 'online'
                }
            })
        })
        .then(res => {

            agent = res;

            if (!agent) {
                throw new Error('Invalid token!')
            }

            agent.ip = ip;
            agent.status = 'online';
            agent.socketId = socketId;

            eventEmitter.emit(wsEvents.AGENT_STATUS, agent);

            return agent.save();
        })
        .then(() => {
            const queue = queueSrv.createQueue(agent.numberOfConcurrentBuilds);

            agentControllers.push({
                queue,
                agentId: agent._id.toString(),
                socketId,
                tags: agent.tags,
                enabled: agent.enabled,
            });
        })
};

exports.disconnectAgent = (socketId) => {

    return Agent.findOne({
        socketId: socketId
    })
        .then(agent => {
            if (!agent) {
                throw new Error('Agent not found!')
            }

            agent.status = 'offline';
            agent.socketId = null;
            agent.lastOnline = Date.now();

            eventEmitter.emit(wsEvents.AGENT_STATUS, agent);

            return agent.save();
        })
        .then(() => {
            removeAgentControllerBySocketId(socketId)
        });
};

exports.removeAgent = (id) => {

    let socketId;

    return Agent.findOne({
        _id: id
    })
        .then(agent => {

            if (!agent) {
                const error = new Error('Agent not found!');
                error.status = 404;

                throw error;
            }

            socketId = agent.socketId;

            return Agent.remove({
                _id: id
            })
        })
        .then(() => {
            removeAgentControllerBySocketId(socketId);
            eventEmitter.emit(wsEvents.DISCONNECT_AGENT, socketId);
        })
};

exports.assignTask = (task, agentTags) => {
    if (agentTags.length === 0) {
        let minRate = 999;
        let selectedIndex = -1;

        agentControllers.filter(c => c.enabled).forEach((controller, index) => {
            const queue = controller.queue;
            const queueLength = queue.length();

            const rate = (queueLength + 1) / (queue.concurrency + 1);

            if (rate < minRate) {
                selectedIndex = index;
                minRate = rate;
            }
        });

        if (selectedIndex > -1) {
            const controller = agentControllers[selectedIndex];
            controller.queue.push({
                agentId: controller.agentId,
                task
            });

            return true;
        } else {
            return false;
        }

    } else {
        const controller = agentControllers.filter(c => c.enabled).find(c => {
            let result = true;

            agentTags.forEach(tag => {
                if (c.tags.indexOf(tag) === -1) {
                    result = false
                }
            });

            return result;
        });

        if (!controller) {
            return false;
        } else {
            controller.queue.push({
                agentId: controller.agentId,
                task
            });
            return true;
        }
    }
};

exports.createTunnel = (agentId, buildId) => {

    const controller = agentControllers.find(c => c.agentId === agentId);

    if (!controller) return null;

    return {
        setOnMessage: (onMessage) => new Promise((resolve, reject) => {
            eventEmitter.emit(wsEvents.CREATE_AGENT_COMMUNICATION_TUNNEL, controller.socketId, buildId);

            let resolved = false;

            setTimeout(() => {
                if (!resolved) {
                    reject(new Error('Connection time out!'))
                }
            }, 5000);

            const initListener = (resSocketId, resBuildId) => {
                if (controller.socketId === resSocketId && buildId.toString() === resBuildId) {

                    // Do stuff

                    eventEmitter.removeListener(wsEvents.CREATE_AGENT_COMMUNICATION_TUNNEL_RESPONSE, initListener);

                    listeners.push({
                        agentId,
                        buildId: buildId.toString(),
                        socketId: controller.socketId,
                        onMessage
                    });

                    resolved = true;
                    return resolve();
                }
            };

            eventEmitter.on(wsEvents.CREATE_AGENT_COMMUNICATION_TUNNEL_RESPONSE, initListener)
        }),

        sendMessage: message => {
            eventEmitter.emit(wsEvents.SEND_MESSAGE_TO_AGENT, controller.socketId, buildId, message)
        },

        end: () => {
            const listener = listeners.find(l => l.agentId === agentId && l.buildId === buildId);
            if (listener) {
                listeners.splice(listeners.indexOf(listener), 1);
            }

            eventEmitter.emit(wsEvents.SEND_MESSAGE_TO_AGENT, controller.socketId, buildId, {
                type: agentMessages.DONE
            });
        }
    }
};

exports.changeQueueConcurrency = (agentId, concurrency) => {
    const controller = agentControllers.find(c => c.agentId === agentId);

    if (controller) {
        controller.queue.concurrency = concurrency;
    }
};

exports.updateAgent = (agentId, data) => {
    const controller = agentControllers.find(c => c.agentId === agentId);

    if (controller) {
        Object.keys(data).forEach(key => {
            controller[key] = data[key];
        })
    }
};

eventEmitter.on(wsEvents.MESSAGE_FROM_AGENT, (socketId, buildId, message) => {
    const listener = listeners.find(l => l.socketId === socketId && l.buildId === buildId);

    if (listener) {
        listener.onMessage(message)
    }
});