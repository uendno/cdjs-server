const rp = require('request-promise');
const parse = require('parse-link-header');
const Git = require('../../models/Git');
const Job = require('../../models/Job');
const config = require('../../config');

const getAllWebhooksForRepo = (repoFullName, accessToken) => {
    return getWebhooksAtPage(repoFullName, accessToken, 1, []);
};

const getWebhooksAtPage = (repoFullName, accessToken, page, hooks) => {
    return rp({
        url: `https://api.github.com/repos/${repoFullName}/hooks`,
        method: 'GET',
        headers: {
            'Authorization': `token ${accessToken}`,
            'User-Agent': 'cd.js'
        },
        resolveWithFullResponse: true,
        json: true
    })
        .then(res => {

            const newHooks = hooks.concat(res.body);

            if (!res.headers.link) {
                return newHooks;
            }

            const parsed = parse(res.headers.link);

            if (parsed.next) {
                return getWebhooksAtPage(repoFullName, accessToken, page + 1, newHooks)
            } else {
                return newHooks;
            }
        })
};


module.exports = (_, {name, gitAccountId, repoFullName, cdFilePath}) => {

    let accessToken;

    return Git.findOne({_id: gitAccountId})
        .then(git => {

            accessToken = git.accessToken;

            if (!git) {
                const error = new Error("Git account not found");
                error.status = 400;
                throw error;
            }


            // Check if job name is valid

            return Job.findOne({
                name
            });
        })
        .then(found => {
            if (found) {
                throw new Error("A job with this name already exists.");
            } else {
                return getAllWebhooksForRepo(repoFullName, accessToken);
            }
        })
        .then((hooks) => {

            console.log(hooks);

            // Check if webhook is already added
            const found = hooks.find(hook => hook.config.url === config.webHook.url);

            if (found) {
                return null;
            } else {
                return rp({
                    url: `https://api.github.com/repos/${repoFullName}/hooks`,
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${accessToken}`,
                        'User-Agent': 'cd.js'
                    },
                    body: {
                        name: 'web',
                        active: true,
                        config: {
                            url: config.webHook.url,
                            content_type: "json"
                        }
                    },
                    json: true
                })
            }

        })
        .then(() => {
            // Get repo informations

            const url = `https://api.github.com/repos/${repoFullName}`;
            return rp({
                url,
                headers: {
                    'Authorization': `token ${accessToken}`,
                    'User-Agent': 'cd.js'
                },
                json: true
            });
        })
        .then(repo => {
            const job = new Job({
                name,
                git: gitAccountId,
                repo: {
                    name: repo.name,
                    fullName: repo.fullName,
                    id: repo.id,
                    private: repo.private,
                    url: repo.html_url,
                    ownerAvatarUrl: repo.owner.avatar_url
                },
                cdFilePath: cdFilePath
            });

            return job.save();
        });
};