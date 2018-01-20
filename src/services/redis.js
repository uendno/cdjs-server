const redis = require('redis');
const Promise = require('bluebird');

const config = require('../config');

let client;

exports.connect = (options) => {
    client = Promise.promisifyAll(redis.createClient(options));

    return client.setAsync(config.redis.prefix + ":test-key", "test-ok")
        .then(() => {
            return client.getAsync(config.redis.prefix + ":test-key")
        })
        .then(value => {
            if (value !== 'test-ok') {
                throw new Error('Redis connection test: NOT OK')
            }

            return client.delAsync(config.redis.prefix + ":test-key");
        })
        .then(() => {
            console.log('Redis connected');
        })
};

exports.client = client;