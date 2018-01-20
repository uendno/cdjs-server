if (process.env.NODE_ENV !== 'production') {
    const dotenv = require('dotenv');
    dotenv.config();
}
const randomstring = require('randomstring');
const express = require('express');
const bodyParser = require('body-parser');
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');
const {createServer} = require('http');
const config = require('./src/config');
const schema = require('./src/graphql/index');
const connectMongo = require('./src/lib/mongo-connector');
const setupWinston = require('./src/lib/winston');
const redisService = require('./src/services/redis');
const authMiddleware = require('./src/rest/middlewares/auth');
// const {authenticate} = require('./lib/authentication');
const userHelper = require('./src/helpers/user');
const cleanner = require('./src/helpers/cleanner');

// winston
setupWinston();

// mongodb
connectMongo(config.mongodb.uri);

// redis
redisService.connect({
    url: config.redis.uri,
    password: config.redis.password
});

const app = express();

app.use(bodyParser.json());

if (process.env.NODE_ENV !== 'production') {
    app.use('/graphiql', graphiqlExpress({
        endpointURL: '/api/graphql',
        subscriptionsEndpoint: `ws://localhost:${config.server.port}/subscriptions`
    }))
}

app.use('/graphql', [authMiddleware], graphqlExpress({
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

Promise.all([
    // Prepare admin user
    userHelper.prepareAdminUser(),

    // Clean DB
    cleanner.clean()
])
    .then(() => {
        server.listen(config.server.port, () => {
            console.log(`cdjs is listening on port ${config.server.port}`);
        });
    });
