const Credential = require('../../models/Credential');
const _ = require('lodash');
const hidePasswordIfNeeded = require('../../helpers/credentials').hidePasswordIfNeeded;

exports.checkCredentialName = (_, {name, currentCredentialId}) => {
    return Credential.findOne({
        name,
        _id: {
            $ne: currentCredentialId
        }
    })
        .then(found => {
            if (found) {
                return {
                    valid: false
                }
            } else {
                return {
                    valid: true,
                }
            }
        })
};

exports.allCredentials = () => {
    return Credential.find()
        .sort({createdAt: -1})
        .then(credentials => credentials.map(credential => {
            return hidePasswordIfNeeded(credential);
        }));

};

exports.createCredential = (root, {name, type, username, password, sshLocation}) => {

    let data = {
        username,
        password,
        sshLocation
    };

    const credential = new Credential({
        type: type,
        name,
        data: _.pickBy(data, _.identity),
    });

    return credential.save()
        .then(credential => {
            return hidePasswordIfNeeded(credential);
        });
};

exports.updateCredential = (root, {id, name, type, username, password, sshLocation}) => {


    let data = _.pickBy({
        name,
        type,
        "data.username": username,
        "data.password": password,
        "data.sshLocation": sshLocation
    }, _.identity);


    if (password === '********') {
        data = _.omit(data, 'data.password');
    }

    return Credential.findOneAndUpdate({_id: id}, {
        $set: data
    }, {new: true})
        .then(credential => {
            return hidePasswordIfNeeded(credential)
        });
};

exports.deleteCredential = (_, {id}) => {
    return Credential.remove({_id: id})
        .then(() => "Done!");
};

