const fs = require('fs');
const path = require('path');
const {makeExecutableSchema} = require('graphql-tools');
const resolvers = require('./resolvers/index');


const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8');

module.exports = makeExecutableSchema({typeDefs, resolvers});