const eventEmitter = require('../services/events');
const wsEvents = require('../wsEvents');
const Build = require('../models/Build');
const dirHelper = require('../helpers/dir');
const logReaderSrv = require('../services/logReader');

const handleError = (socket, error) => {
    console.error(error.stack);
    socket.emit(wsEvents.ERROR, error.message)
};


module.exports = io => {

    io.on('connection', socket => {

        console.log(socket.id + "Connected");

        let logReader;

        const unwatch = () => {
            if (logReader) {
                logReader.unwatch();
                logReader = null
            }
        };

        const watch = (logFile, buildId) => {
            logReader = logReaderSrv.readFile(logFile, 10,
                data => {

                    console.log("length: " + data.length);

                    socket.emit(wsEvents.LOG_DATA, {
                        buildId,
                        data
                    });
                },
                error => {
                    throw error;
                })
        };

        socket.on(wsEvents.READ_LOG, buildId => {


            Build.findOne({_id: buildId})
                .populate('job')
                .then(build => {

                    unwatch();

                    const buildFolder = dirHelper.getBuildDir(build.job.name, build.number);
                    const logFile = buildFolder + "/combined.log";

                    console.log("Start read log for build: " + buildId + " on " + logFile);

                    watch(logFile, buildId);
                })
                .catch(error => {
                    unwatch();
                    handleError(socket, error);
                })
        });

        socket.on(wsEvents.CANCEL_READ_LOG, () => {
            unwatch();
        });

        socket.on('disconnect', () => {
            unwatch();
        })
    });

    eventEmitter.on(wsEvents.BUILD_STATUS, message => {
        io.emit(wsEvents.BUILD_STATUS, message)
    })
};

