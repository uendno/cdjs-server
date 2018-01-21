const Job = require('../../models/Job');
const Agent = require('../../models/Agent');
const Credential = require('../../models/Credential');

exports.validate = (req, res, next) => {

    const body = req.body;
    const collection = body.collection;
    const currentId = body.currentId;
    const name = body.name;

    let Collection;

    switch (collection) {
        case 'agents':
            Collection = Agent;
            break;

        case 'credentials':
            Collection = Credential;
            break;

        case 'jobs':
            Collection = Job;
            break;

        default:
            const error = new Error('Unsupported collection');
            error.status = 400;
            return next(error);
    }


    return Collection.findOne(
        {
            $or: [
                {name}
            ],
            _id: {
                $ne: currentId
            }
        }
    )
        .then(found => {
            if (found) {
                return res.sendSuccess({
                    valid: false
                })
            } else {
                return res.sendSuccess({
                    valid: true
                })
            }
        })
        .catch(error => {
            return next(error);
        });
};