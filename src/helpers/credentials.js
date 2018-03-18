const _ = require('lodash');

exports.hidePasswordIfNeeded = (credential) => {
  const json = credential.toJSON();
  if (credential.type === 'username/password') {

    const omittedData = _.assign(json.data, {password: '********'});

    return _.assign(json, {
      data: omittedData
    });

  } else {
    return json;
  }
};