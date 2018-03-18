const redis = require('redis');
const Promise = require('bluebird');

const config = require('../config');

module.exports = Promise.promisifyAll(redis.createClient({
    url: config.redis.uri,
    password: config.redis.password
}));

