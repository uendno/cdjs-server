module.exports = {
    mongo: {
        uri: process.env.CDJS_MONGO_URI
    },

    webHook: {
        url: process.env.CDJS_PUBLIC_URL + "/api/webhook/url",
        name: process.env.CDJS_WEBHOOK_NAME
    },

    server: {
        port: process.env.CDJS_SERVER_PORT,
        publicUrl: process.env.CDJS_PUBLIC_URL + "/api"
    },

    web: {
        publicUrl: process.env.CDJS_PUBLIC_URL
    },

    url: {
        clientId: process.env.CDJS_GITHUB_CLIENT_ID,
        clientSecret: process.env.CDJS_GITHUB_CLIENT_SECRET
    },

    auth: {
        jwtSecret: process.env.JWT_SECRET,
        jwtExpire: process.env.JWT_EXPIRE
    }
};