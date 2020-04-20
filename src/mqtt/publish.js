const config = require('../config.js');
const mqtt = require('mqtt');
const topic = require('./topic.js');

const publish = async (topicName, msg, callback) => {
    
    const options = {
        host: config.mqtt_host,
        port: config.mqtt_host_port,
        protocol: 'mqtt',
    };
    console.log(options);
    const client = mqtt.connect(options);
    client.on("connect", () => {	
        console.log("mqtt client connected "+ client.connected);
        console.log(`publish - ${topicName}`);
        console.log(`${msg}`);
        client.publish(topicName, msg, {qos:0}, (err)=>{
            client.end();
            if(err){
                console.log(err);
                callback({r:false, msg:err}); 
            } else {
                callback({r:true});
            }
        }) 
    });
}

const publishToClient = async (member_no, msg, callback) => {
    const topicName = topic.topicClientOfMember(member_no);
    publish(topicName, msg, callback);
}

const publishToFront = async (member_no, msg, callback) => {
    const topicName = topic.topicFrontOfMember(member_no);
    publish(topicName, msg, callback);
}


module.exports = {
    publish : publish,
    publishToClient : publishToClient,
    publishToFront : publishToFront,
};