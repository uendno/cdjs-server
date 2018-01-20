const uuid = require('uuid');
const _ = require('lodash');
const Agent = require('../../models/Agent');
const agentSrv = require('../../services/agents');


exports.addAgent = (root, {name}) => {
    const agent = new Agent({
        name,
        token: uuid()
    });

    return agent.save()
};

exports.allAgents = (root) => {
    return Agent.find()
};

exports.updateAgent = (root, {id, name, enabled, numberOfConcurrentBuilds}) => {
    const data = _.pickBy({
        name,
        enabled,
        numberOfConcurrentBuilds
    }, (value, key) => {
        return value !== undefined;
    });

    return Agent.findOneAndUpdate({_id: id}, data, {new: true})
};

exports.checkAgentName = (root, {name, currentAgentId}) => {
    return Agent.findOne({
        $or: [
            {name}
        ],
        _id: {
            $ne: currentAgentId
        }
    })
        .then(found => {
            if (found) {
                return {
                    valid: false
                }
            } else {
                return {
                    valid: true
                }
            }
        })
};

exports.deleteAgent = (root, {id}) => {
    return agentSrv.removeAgent(id)
        .then(() => "Remove agent completely.");
};