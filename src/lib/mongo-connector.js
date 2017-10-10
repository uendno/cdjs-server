'use strict';

const Mongoose = require('mongoose');
const logger = require('winston');

module.exports = (uri) => {

    Mongoose.Promise = global.Promise;

    Mongoose.connect(uri, {useMongoClient: true}, function (err) {
        if (err) {
            logger.error(err.stack);
            throw err;
        }

    });

    // When the connection is disconnected

    Mongoose.connection.on('connected', function () {
        logger.info('Mongo Database connected');
    });

    // When the connection is disconnected

    Mongoose.connection.on('disconnected', function () {
        logger.info(' Mongo Database disconnected');
    });

    // If the node process ends, close the mongoose connection

    process.on('SIGINT', function () {
        Mongoose.connection.close(function () {
            logger.info('Mongo Database disconnected through app termination');
            process.exit(0);
        });
    });
};