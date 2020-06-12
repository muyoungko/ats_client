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
const Appium = require('appium')

var mqtt_client;
const getMqttClientInstance = (mqtt_host, mqtt_host_port) => {
    if(!mqtt_client){
        const options = {
            host: mqtt_host,
            port: mqtt_host_port,
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
            const mqtt_client = getMqttClientInstance(json.mqtt_host, json.mqtt_host_port);
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

    //const AppiumDoctor = require('appium-doctor')
    //console.log('AppiumDoctor result');
    //console.log('AppiumDoctor result' , AppiumDoctor);

    process.stdin.setRawMode(true);
    process.stdin.on("keypress", function(chunk, key) {
    if(key && (key.name === "c" || key.name === "z") && key.ctrl) {
        console.log("bye bye, all appium process is killed");
        process.exit();
    }
    });
    
    const version = require("./package.json").version;
    console.log(`Welcome Auto Test Hub - client version ${version}`);
    console.log(`Get your client token in here - ${config.host}/#/token`);
    var previousToken = property.value.token;

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
        
        mqttClientAccess(token, ()=>{

            checkiOSorAndroidDevice(list=>{
                var port = 8000;
                list.map(m=>{
                    deviceStart(token, m.os, m.deviceId, m.model, m.version, port++);
                })
            });
        });
    });
        
};

const checkiOSorAndroidDevice = async (callback) => {
    exec('adb devices -l', (err, stdout, stderr) => {
        exec('instruments -s devices', (err2, stdout2, stderr2) => {
            const r = [];
            if(err && err2) {
                console.log('Error', `Check your command 'adb' or command 'instruments' at least one`);
                process.exit();
            }

            var lines = stdout.split('\n');
            lines.map(line => {
                if(line && !line.startsWith('List of devices attached')){
                    const words = line.split(' ');
                    const deviceId = words[0];
                    const os = 'android';
                    var model = 'unknown'
                    words.map(m=>{
                        if(m.startsWith('model:'))
                            model = m.replace('model:', '');
                    });
                    
                    console.log(`Android device found - ${model}(${deviceId})`);
                    // r.push({
                    //     os:os,
                    //     deviceId:deviceId,
                    //     model:model,
                    // })
                }
            })

            var lines2 = stdout2.split('\n');
            lines2.map(line2 => {
                if(line2 && !line2.startsWith('Known Devices:')
                    && line2.includes('(') && !line2.includes('Simulator')){
                    console.log(line2);
                    const os = 'ios';

                    var name = line2.split(' (')[0];
                    var regExp = /\(([^)]+)\)/;
                    var matches = regExp.exec(line2);
                    var version = matches[0].substring(1, matches[0].length -1);
                    var model = name;

                    var regExp2 = /\[([^)]+)\]/;
                    var matches2 = regExp2.exec(line2);
                    var deviceId = matches2[0].substring(1, matches2[0].length -1);

                    console.log(`iOS device found - ${model} ${version} (${deviceId})`);
                    r.push({
                        os:os,
                        deviceId:deviceId,
                        model:model,
                        version:version,
                    })
                }
            })
            

            if(r.length == 0){
                console.log(`No devices are connected check your command 'adb decices -l' or command 'instruments -s devices'`);

                // console.log('adb command not found');
                // console.log('Please install android studio sdk');
                // console.log('Or export path like `export PATH=~/Library/Android/sdk/platform-tools:$PATH`')

                process.exit();
            } else {
                callback(r);
            }
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
const deviceStart = async (token, os, deviceId, model, version, appium_port) => {
    const appium_server_key = `${deviceId}_appium_server`;
    var appium_server_uri = `http://127.0.0.1:${appium_port}`;
    if(property.value[appium_server_key])
        appium_server_uri = property.value[appium_server_key];
    console.log(`Appium Server Start For ${deviceId} - ${appium_server_uri}`)
    const appium_server = await Appium.main({port:appium_port});
    property.set(appium_server_key, appium_server_uri);
    setTimeout(deviceStatus, 2000, token, deviceId, appium_server_uri, os, model, version);
};

/**
 * 다음 상태를 체크한다.
 * 1. appium 서버가 떠있는지
 * 2. adb로 하드웨어가 연결되어있는지
 * 
 * @param {*} token 
 * @param {*} deviceId 
 */
const deviceStatus = async (token, deviceId, appium_server, os, model, version) => {
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

            const path = `/device_status?os=${os}&device_id=${deviceId}&model=${encodeURI(model)}&appium_version=${v}&status_appium=${status_appium}&status_connected=${status_connected}&local_appium_server=${appium_server}&version=${version}`;
            client.req(path, function(json){
                    
            });

            setTimeout(deviceStatus, 60000, token, deviceId, appium_server, os, model);
        });

    });

    
};

start();


