if (process.env.NODE_ENV !== 'production') {
    const dotenv = require('dotenv');
    dotenv.config();
}

const express = require('express');
const bodyParser = require('body-parser');

const {createServer} = require('http');
const config = require('./src/config');

const connectMongo = require('./src/lib/mongo-connector');
const setupWinston = require('./src/lib/winston');
const redisService = require('./src/services/redis');

const userHelper = require('./src/helpers/user');
const cleanner = require('./src/helpers/cleanner');

// winston
setupWinston();

// mongodb
connectMongo(config.mongodb.uri);

const app = express();

app.use(bodyParser.json());

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
        success: false,
        message: err.message,
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
