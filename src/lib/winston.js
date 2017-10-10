const logger = require('winston');
const util = require('util');

module.exports = () => {
    logger.configure({
        transports: [
            new (logger.transports.Console)({
                timestamp: function () {
                    return Date.now();
                },
                formatter: function (options) {
                    // Return string will be passed to logger.
                    return options.level.toUpperCase() + ' ' + (options.message ? options.message : '') +
                        (options.meta && Object.keys(options.meta).length ? '\n' + util.inspect(options.meta, {
                            showHidden: true,
                            depth: null
                        }) : '' ) + "\n";
                }
            })
        ]
    });

    if (process.env.NODE_ENV !== 'production') {
        logger.level = 'debug';
    } else {
        logger.level = 'info';
    }
};
