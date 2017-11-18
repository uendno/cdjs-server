const DataLoader = require('dataloader');
const Credential = require('../models/Credential');
const hidePasswordIfNeeded = require('./credentials').hidePasswordIfNeeded;

exports.credentialLoader = new DataLoader(keys => {
     return Credential.find({_id: {
         $in: keys
     }})
         .then(credentials => credentials.map(hidePasswordIfNeeded))
});