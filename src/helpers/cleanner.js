const Build = require('../models/Build');
const Agent = require('../models/Agent');
const agentSrv = require('../services/agents');

const disconnectAllAgents = () => {
  return Agent
    .find({})
    .then(agents => {
      return Promise.all(agents.map(agent => agentSrv.disconnectAgent(agent.socketId)))
    })
};

const stopAllBuilds = () => {
  return Build
    .find({})
    .then(builds => {
      const promises = builds.map(build => {
        if (build.status !== 'failed' && build.status !== 'success') {
          build.status = 'failed';
          if (build.stages.length > 0) {
            build.stages[build.stages.length - 1].status = 'failed'
          }
        }

        return build.save();
      });

      return Promise.all(promises);
    })
};

exports.clean = () => {
  return Promise.all([disconnectAllAgents(), stopAllBuilds()]);
};
