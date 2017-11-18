const Build = require('../../models/Build');

exports.buildDetails = (root, {id}) => {
    return Build.findOne({_id: id})
        .populate('stages')
};