const request = require('request-promise');
const config = require('../config');
const {value} = require('../property/property.js');

const req = async (path, callback) => {
    const token = value.token;
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
    const token = value.token;
    return await request({
        url: config.api_host + path,
        headers: {
            'x-access-token': token
        },
    });
}

const reqAppium = async (deviceId, path, callback) => {
    const appium_server_key = `${deviceId}_appium_server`;
    const url = value[appium_server_key] + path;
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