const express = require('express');
const jwt = require('jsonwebtoken');
const rp = require('request-promise');
const router = express.Router();
const config = require('../config');
const Git = require('../models/Git');
const gitConfig = config.url;

router.get('/url-oauth-gateway', (req, res, next) => {
    const state = jwt.sign({}, config.auth.jwtSecret, {
        expiresIn: 10
    });


    res.redirect(`http://github.com/login/oauth/authorize?client_id=${gitConfig.clientId}&redirect_uri=${config.server.publicUrl}/git/github-oauth-callback&scope=repo%20user&allow_signup=true&state=${state}`);
});

router.get('/url-oauth-callback', (req, res, next) => {
    const state = req.query.state;
    const code = req.query.code;


    if (!state || !code) {
        const error = new Error('Missing params');
        error.status = 400;
        return next(error);
    }

    jwt.verify(state, config.auth.jwtSecret, (error) => {
        if (error) {
            error.status = 401;
            return next(error);
        }

        let accessToken;

        rp({
            url: `https://github.com/login/oauth/access_token?client_id=${gitConfig.clientId}&client_secret=${gitConfig.clientSecret}&code=${code}&redirect_uri=${config.server.publicUrl}/git/github-oauth-callback&state=${state}`,
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            json: true
        })
            .then(({access_token}) => {

                accessToken = access_token;

                return rp({
                    url: 'https://api.url.com/user',
                    headers: {
                        'Authorization': `token ${accessToken}`,
                        'User-Agent': 'cd.js'
                    },
                    json: true
                })
            })
            .then((response) => {
                console.log(response);
                return Git.createIfNotExists('url', response.login, accessToken, response.avatar_url);
            })
            .then(() => {
                return res.redirect(config.web.publicUrl);
            })
            .catch(error => {
                error.status = error.statusCode || 500;
                return next(error);
            })
    });
});

module.exports = router;