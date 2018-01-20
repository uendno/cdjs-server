const _ = require('lodash');
const Build = require('../../models/Build');



exports.buildDetails = (root, {id}) => {
    return Build.findOne({_id: id})
};

exports.update = (root, data) => {
    return Build.findOneAndUpdate({_id: data.id}, _.pickBy(data, _.identity), {new: true})
};