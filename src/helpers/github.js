const rp = require('request-promise');
const parse = require('parse-link-header');

exports.getFullList = (url, accessToken) => {
    return getListAtPage(url, accessToken, 1, []);
};


const getListAtPage = (url, accessToken, page, results) => {
    return rp({
        url: url,
        method: 'GET',
        headers: {
            'Authorization': `token ${accessToken}`,
            'User-Agent': 'cd.js'
        },
        resolveWithFullResponse: true,
        json: true
    })
        .then(res => {

            const newResults = results.concat(res.body);

            if (!res.headers.link) {
                return newResults;
            }

            const parsed = parse(res.headers.link);

            if (parsed.next) {
                return getListAtPage(url, accessToken, page + 1, newResults)
            } else {
                return newResults;
            }
        })
};