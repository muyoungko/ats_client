#!/usr/bin/env node
const mqtt = require('mqtt');
const config = require('./src/config');
const request = require('request');
const { exec } = require('child_process');
const property = require('./src/property/property.js');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})
const api = require('./src/api/api.js');
const client = require('./src/api/client.js');
const topic = require('./src/mqtt/topic.js');
const sessionManager = require('./src/test_session/SessionManager.js');


var mqtt_client;
const getMqttClientInstance = () => {
    if(!mqtt_client){
        const options = {
            host: config.mqtt_host,
            port: config.mqtt_host_port,
            protocol: 'mqtt',
        };
        mqtt_client = mqtt.connect(options);
    }
    return mqtt_client;
}

const mqttClientAccess = (token, callback) => {

    client.req('/token/me', function(json){
        if(json){
            const member_no = json.member_no
            const mqtt_client = getMqttClientInstance();
            mqtt_client.on("connect", () => {	
                //console.log("mqtt client connected "+ mqtt_client.connected);
            });

            const topicName = topic.topicClientOfMember(member_no);
            console.log(`subscribing - ${topicName}`);
            mqtt_client.subscribe(topicName , {qos:1});
            mqtt_client.on('message', (topic, message, packet) => {
                console.log("topic is "+ topic);
                console.log("message is "+ message);

                const json = JSON.parse(message);
                if(json.path === '/test') {
                    api.test(member_no, token, json);
                } else if(json.path === '/query') {
                    const pyshell = sessionManager.getSession(json.test_session_id);
                    if(pyshell)
                        pyshell.send(json.command);
                }
            });
            callback();
        } else {
            console.log('Auto Test Server not respond');
            process.exit();
        }
    });
}

const start = async function(){
    console.log(`Welcome Auto Test Hub`);
    console.log(`Get your client token in here - ${config.host}/#/token`);
    var previousToken = property.value.token;// || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZW1iZXJfbm8iOiIxNTgwNDYyMjYzODExIiwiZW1haWwiOiJtdXlvdW5na28xMXN0QGdtYWlsLmNvbSIsIm5hbWUiOiJtdXlvdW5na28xMXN0IiwidHlwZSI6InNsYWNrIiwicHJvZmlsZSI6Imh0dHBzOi8vc2VjdXJlLmdyYXZhdGFyLmNvbS9hdmF0YXIvOTk1OGE0YTVkZjJlYjMyNmNlNWEzZWZmOWM2NjNlNjguanBnP3M9MTkyJmQ9aHR0cHMlM0ElMkYlMkZhLnNsYWNrLWVkZ2UuY29tJTJGZGYxMGQlMkZpbWclMkZhdmF0YXJzJTJGYXZhXzAwMDktMTkyLnBuZyIsImlhdCI6MTU4MTMxMDE2NywiZXhwIjoxNjY3NzEwMTY3LCJpc3MiOiIqIiwic3ViIjoidXNlckluZm8ifQ.r2cU1CknU0lqb-3IzYx2de77q6sgmaaLPZKQrSe39Uk';
    
    //TODO : Should Check JAVA_HOME

    var qm = '';
    if(previousToken)
        qm = `(default - ${previousToken.substring(0,10)}...)`
    var q = `Please enter the client token${qm} : `;
    readline.question(q, async (token)=>{
        
        if(!token)
            token = previousToken;
        if(!token) 
            return;
        
        property.set('token', token);
        
        exec('adb devices -l', (err, stdout, stderr) => {
            if (err) {
                console.log('adb command not found');
                console.log('Please install android studio sdk');
                console.log('Or export path like `export PATH=~/Library/Android/sdk/platform-tools:$PATH`')
                return;
            }
        
            mqttClientAccess(token, ()=>{
                var lines = stdout.split('\n');
                var count = 0;
                lines.map(line => {
                    if(line && !line.startsWith('List of devices attached')){
                        const words = line.split(' ');
                        const deviceId = words[0];
                        count++;
                        const os = 'android';
                        var model = 'unknown'
                        words.map(m=>{
                            if(m.startsWith('model:'))
                                model = m.replace('model:', '');
                        });
                        
                        console.log('Everything ok');
                        deviceStart(token, os, deviceId, model);

                    }
                })
                if(count == 0){
                    console.log('No devices are connected check your adb');
                    process.exit();
                }
            });
        });
    });
        
};

/**
 * 
 * 
 * @param {*} token 
 * @param {*} os 
 * @param {*} deviceId 
 * @param {*} model 
 */
const deviceStart = async (token, os, deviceId, model) => {
    const appium_server_key = `${deviceId}_appium_server`;
    var default_appium_server = 'http://127.0.0.1:4723';
    if(property.value[appium_server_key])
        default_appium_server = property.value[appium_server_key];
    var q = `Please enter the appium server for ${deviceId}(default ${default_appium_server}) : `;
    
    readline.question(q, async (appium_server)=>{
        appium_server = appium_server || default_appium_server;
        property.set(appium_server_key, appium_server);
        setTimeout(deviceStatus, 2000, token, deviceId, appium_server, os, model);
    });
};

/**
 * 다음 상태를 체크한다.
 * 1. appium 서버가 떠있는지
 * 2. adb로 하드웨어가 연결되어있는지
 * 
 * @param {*} token 
 * @param {*} deviceId 
 */
const deviceStatus = async (token, deviceId, appium_server, os, model) => {
    console.log(`${new Date()} checking status - ${deviceId}, ${appium_server}`);
    var status_appium = false;
    var status_connected = false;
    exec('adb devices -l', (err, stdout, stderr) => {
        var lines = stdout.split('\n');
        lines.map(line => {
            if(line && !line.startsWith('List of devices attached')){
                const words = line.split(' ');
                const lineDeviceId = words[0];
                if(deviceId === lineDeviceId)
                    status_connected = true;
            }
        })

        if(!status_connected)
            console.log(`Error - Not connected - ${deviceId}`);
        client.reqAppium(deviceId, `/wd/hub/status`, 
        async function (err, resp, body) {
            var v = '0';
            if(err){
                console.log(`Error - No appium - ${deviceId} ${appium_server}`);
            } else {
                status_appium = true;
                const json = JSON.parse(body);
                v = json.value.build.version;
            }

            client.req(`/device_status?os=${os}&device_id=${deviceId}&model=${model}&appium_version=${v}&status_appium=${status_appium}&status_connected=${status_connected}&local_appium_server=${appium_server}`, function(json){
                    
            });

            setTimeout(deviceStatus, 60000, token, deviceId, appium_server, os, model);
        });

    });

    
};

start();


