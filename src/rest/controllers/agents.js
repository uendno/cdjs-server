const jwt = require('jsonwebtoken');
const config = require('../../config');
const Agent = require('../../models/Agent');
const agentSrv = require('../../services/agents');


exports.list = (req, res, next) => {
    return Agent.find()
        .then(agents => {
            return res.sendSuccess(agents);
        })
        .catch(next)
};

exports.create = (req, res, next) => {
    const name = req.body.name;

    return Agent.findOne({
        name
    })
        .then(found => {
            if (found) {
                const error = new Error("An agent with this name already exists.");
                error.status = 400;

                throw error;
            } else {
                const agent = new Agent({
                    name
                });
                return agent.save();
            }
        })
        .then(agent => {
            const token = jwt.sign({
                id: agent._id
            }, config.auth.jwtSecret);

            return res.sendSuccess({
                token,
                agent: agent.toJSON()
            });
        })
        .catch(next)
};

exports.update = (req, res, next) => {
    const id = req.params.id;
    const data = req.body;

    return Agent.findOne({
        _id: id
    })
        .then(agent => {
            if (!agent) {
                const error = new Error('Agent not found!');
                error.status = 404;

                throw error;
            }
        })
        .then(() => {
            return Agent.findOneAndUpdate({
                _id: id
            }, data, {
                new: true
            })
        })
        .then(agent => {
            agentSrv.changeQueueConcurrency(agent._id.toString(), agent.numberOfConcurrentBuilds);
            agentSrv.setAgentState(agent._id.toString(), agent.enabled);
            return res.sendSuccess(agent.toJSON())
        })
        .catch(next)
};

exports.delete = (req, res, next) => {
    const id = req.params.id;

    return agentSrv.removeAgent(id)
        .then(() => {
            return res.sendSuccess(null)
        })
        .catch(next)
};