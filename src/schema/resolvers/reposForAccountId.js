const rp = require('request-promise');
const Git = require('../../models/Git');
const parse = require('parse-link-header');

module.exports = (_, {accountId, page}) => {
    return Git.findOne({_id: accountId})
        .then(git => {
            const accessToken = git.accessToken;
            const url = `https://api.github.com/user/repos?page=${page}&sort=updated`;

            return rp({
                url,
                headers: {
                    'Authorization': `token ${accessToken}`,
                    'User-Agent': 'cd.js'
                },
                json: true,
                resolveWithFullResponse: true
            })
        })
        .then(res => {

            const parsed = parse(res.headers.link);

            let numberOfPages;

            if (parsed.last) {
                numberOfPages = parsed.last.page;
            } else {
                numberOfPages = page;
            }

            return {
                numberOfPages,
                repos: res.body.map(repo => ({
                    name: repo.name,
                    fullName: repo.full_name,
                    private: repo.private,
                    url: repo.html_url,
                    id: repo.id,
                    ownerAvatarUrl: repo.owner.avatar_url
                }))
            };
        })

};