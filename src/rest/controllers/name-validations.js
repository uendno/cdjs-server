const Job = require('../../models/Job');
const Agent = require('../../models/Agent');
const Credential = require('../../models/Credential');
const User = require('../../models/User');

exports.validate = (req, res, next) => {

  const body = req.body;
  const collection = body.collection;
  const currentId = body.currentId;
  const name = body.name;

  let Collection;
  let field = name;

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

    case 'users':
      Collection = User;
      field = 'email';
      break;

    default:
      const error = new Error('Unsupported collection');
      error.status = 400;
      return next(error);
  }

  const option = {};
  option[field] = name;

  return Collection.findOne(
    {
      $or: [option],
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