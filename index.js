if (process.env.NODE_ENV !== 'production') {
    const dotenv = require('dotenv');
    dotenv.config({path: '../.env'});
}


const express = require('express');
const bodyParser = require('body-parser');
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');
const {execute, subscribe} = require('graphql');
const {createServer} = require('http');
const config = require('./src/config');
const schema = require('./src/graphql/index');
const connectMongo = require('./src/lib/mongo-connector');
const setupWinston = require('./src/lib/winston');
const dataloaders = require('./src/helpers/dataloaders');
// const {authenticate} = require('./lib/authentication');


setupWinston();
connectMongo(config.mongo.uri);

const app = express();

app.use(bodyParser.json());

if (process.env.NODE_ENV !== 'production') {
    app.use('/graphiql', graphiqlExpress({
        endpointURL: '/api/graphql',
        subscriptionsEndpoint: `ws://localhost:${config.server.port}/subscriptions`
    }))
}

app.use('/graphql', graphqlExpress({
    schema
}));

app.use('/', require('./src/rest/index'));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development

    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    res.status(err.status || 500).send({
        status: err.status || 500,
        message: err.message,
        error: process.env.NODE_ENV === 'production' ? null : err
    })
});

const server = createServer(app);

require('./src/socket')(server);

server.listen(config.server.port, () => {
    console.log(`cdjs is listening on port ${config.server.port}`);
});


