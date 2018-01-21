module.exports = {
    mongodb: {
        uri: process.env.CDJS_MONGO_URI
    },

    redis: {
        uri: process.env.CDJS_REDIS_URI,
        password: process.env.CDJS_REDIS_PASSWORD,
        prefix: 'cdjs'
    },

    server: {
        port: process.env.CDJS_SERVER_PORT,
        publicUrl: process.env.CDJS_PUBLIC_URL + "/api",
        uploadUrl: process.env.CDJS_PUBLIC_URL + "/api/files"
    },

    web: {
        publicUrl: process.env.CDJS_PUBLIC_URL
    },

    auth: {
        jwtSecret: process.env.JWT_SECRET,
        jwtExpire: process.env.JWT_EXPIRE,
        saltWorkFactor: 10
    },

    workspace: process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] + '/cdjs',

    wsEvents: {
        BUILD_STATUS: 'BUILD_STATUS',
        NEW_BUILD: 'NEW_BUILD',
        READ_LOG: 'READ_LOG',
        CANCEL_READ_LOG: 'CANCEL_READ_LOG',
        LOG_DATA: 'LOG_DATA',
        ERROR: 'ERROR',
        BUILD: 'BUILD',
        DISCONNECT_AGENT: 'DISCONNECT_AGENT',
        AGENT_STATUS: 'AGENT_STATUS',
        SEND_MESSAGE_TO_AGENT: 'SEND_MESSAGE_TO_AGENT',
        CREATE_AGENT_COMMUNICATION_TUNNEL: 'CREATE_AGENT_COMMUNICATION_TUNNEL',
        CREATE_AGENT_COMMUNICATION_TUNNEL_RESPONSE: 'CREATE_AGENT_COMMUNICATION_TUNNEL_RESPONSE',
        MESSAGE_FROM_AGENT: 'MESSAGE_FROM_AGENT'
    },

    agentMessages: {
        SET_ENV: 'SET_ENV',
        SET_ENV_COMPLETE: 'SET_ENV_COMPLETE',
        PREPARE_DIR: 'PREPARE_DIR',
        PREPARE_DIR_COMPLETE: 'PREPARE_DIR_COMPLETE',
        CLONE: 'CLONE',
        CLONE_COMPLETE: 'CLONE_COMPLETE',
        CHECK_OUT: 'CHECK_OUT',
        CHECK_OUT_COMPLETE: 'CHECK_OUT_COMPLETE',
        NPM_INSTALL: 'NPM_INSTALL',
        NPM_INSTALL_COMPLETE: 'NPM_INSTALL_COMPLETE',
        RUN_SCRIPT: 'RUN_SCRIPT',
        RUN_SCRIPT_COMPLETE: 'RUN_SCRIPT_COMPLETE',
        SAVE_BUILD: 'SAVE_BUILD',
        DONE: 'DONE',
        ERROR: 'ERROR',
        LOG: 'LOG',
    }
};