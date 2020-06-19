const request = require('request-promise');
const config = require('../config');
const property = require('../property/property.js');

const req = async (path, callback) => {
    const token = property.get('token');
    request({
        url: config.api_host + path,
        headers: {
            'x-access-token': token
        },
    },
    async function (err, resp, body) {
        if(err)
            callback(null);
        else {
            const json = JSON.parse(body);
            callback(json);
        }
    });
}

const req_sync = async (path) => {
    const token = property.get('token');
    return await request({
        url: config.api_host + path,
        headers: {
            'x-access-token': token
        },
    });
}

const reqAppium = async (deviceId, path, callback) => {
    const appium_server_key = `${deviceId}_appium_server`;
    const appium_server = property.get(appium_server_key);
    const url = appium_server + path;
    request({
        url: url,
    },
    async function (err, resp, body) {
        callback(err, resp, body);
    });
}

module.exports = {
    req : req,
    reqAppium : reqAppium,
    req_sync: req_sync
}