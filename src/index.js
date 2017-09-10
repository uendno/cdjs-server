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

if (process.env.NODE_ENV !== 'production') {
    app.use('/graphiql', graphiqlExpress({
        endpointURL: '/api/graphql'
    }))
}

app.use('/graphql', graphqlExpress({
    schema,
    tracing: process.env.NODE_ENV !== 'production'
}));

app.use('/', require('./routes'));


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


app.listen(config.server.port, () => {
    console.log(`cdjs is listening on port ${config.server.port}`);
});


