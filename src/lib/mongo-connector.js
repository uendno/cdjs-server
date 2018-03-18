'use strict';

const Mongoose = require('mongoose');

module.exports = (uri) => {

  Mongoose.Promise = global.Promise;

  Mongoose.connect(uri, {useMongoClient: true}, function (err) {
    if (err) {
      console.error(err.stack);
      throw err;
    }

  });

  // When the connection is disconnected

  Mongoose.connection.on('connected', function () {
    console.log('Mongo Database connected');
  });

  // When the connection is disconnected

  Mongoose.connection.on('disconnected', function () {
    console.log(' Mongo Database disconnected');
  });

  // If the node process ends, close the mongoose connection

  process.on('SIGINT', function () {
    Mongoose.connection.close(function () {
      console.log('Mongo Database disconnected through app termination');
      process.exit(0);
    });
  });
};