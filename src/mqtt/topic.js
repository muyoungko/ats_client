const config = require('../config.js');
const topicFrontOfMember = (member_no) => {
    return `${config.mqtt_topic}/front/${member_no}`;
}

const topicClientOfMember = (member_no) => {
    return `${config.mqtt_topic}/client/${member_no}`;
}

module.exports = {
    topicFrontOfMember: topicFrontOfMember,
    topicClientOfMember: topicClientOfMember,
};
