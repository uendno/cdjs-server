const Git = require('../../models/Git');
const {getFullList} = require('../../helpers/github');

module.exports = (_, {accountId, repoFullName}) => {
    return Git.findOne({_id: accountId})
        .then(git => {
            return getFullList(`https://api.github.com/repos/${repoFullName}/branches`, git.accessToken);
        })
        .then(branches => {
            return branches.map(branch => branch.name);
        })
};