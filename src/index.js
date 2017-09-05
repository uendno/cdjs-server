const express = require('express');
const bodyParser = require('body-parser');
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');

const config = require('./config');
const schema = require('./schema');
const connectMongo = require('./lib/mongo-connector');
// const {authenticate} = require('./lib/authentication');


connectMongo(config.mongo.uri);

const app = express();

app.use(bodyParser.json());

app.use('/graphql', graphqlExpress({
    schema,
    tracing: process.env.NODE_ENV !== 'production'
}));

app.use('/', require('./routes'));

if (process.env.NODE_ENV !== 'production') {
    app.use('/graphiql', graphiqlExpress({
        endpointURL: '/graphql'
    }))
}

app.listen(config.server.port, () => {
    console.log(`cdjs is listening on port ${config.server.port}`);
});