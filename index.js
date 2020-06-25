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
const fs = require('fs');

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
            callback(json);
        } else {
            console.log('Auto Test Server not respond');
            process.exit();
        }
    });
}

var connectedDeviceList = [];
const updateConnectedDevice = () => {
    checkiOSorAndroidDevice( list => {
        connectedDeviceList = list;
        console.log('connectedDeviceList', list.map(m=>m.deviceId));
        setTimeout(updateConnectedDevice, 60000);
    });
}
const getConnectedDevice = (deviceId) => {
    var r = null;
    connectedDeviceList.map(m=>{
        if(m.deviceId == deviceId)
            r = m;
    });
    return r;
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
    var previousToken = property.get('token');

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
        
        mqttClientAccess(token, (json)=>{
            
            checkiOSorAndroidDevice(async list=>{

                if(list.length == 0){
                    process.exit();
                }

                var iosStuck = false;
                for(var i=0;i<list.length;i++){
                    const m = list[i];
                    if(m.os == 'ios'){
                        const default_xcode_org_id = json.default_xcode_org_id;
                        const default_xcode_signing_id = json.default_xcode_signing_id;
                        const xcode_org_id_key = `${m.deviceId}_xcode_org_id`;
                        const xcode_signing_id_key = `${m.deviceId}_xcode_signing_id`;
                        if(!property.get(xcode_org_id_key) || !property.get(xcode_signing_id_key)){
                            iosStuck = true;
                            console.log(
`Please Entery your iphone certifications for .xccode file like following example 
DEVELOPMENT_TEAM = 3675B8XJSV
CODE_SIGN_IDENTITY = iPhone Developer`
                            )
                            var q = `Please enter the DEVELOPMENT_TEAM for device(${m.deviceId}) ${default_xcode_org_id?'default('+default_xcode_org_id+')':''}:`;
                            readline.question(q, async (xcode_org_id)=>{
                                if(!xcode_org_id)
                                    xcode_org_id = default_xcode_org_id
                                property.set(xcode_org_id_key, xcode_org_id);
                                var q = `Please enter the CODE_SIGN_IDENTITY for device(${m.deviceId}) ${default_xcode_signing_id?'default('+default_xcode_signing_id+')':''}:`;
                                readline.question(q, async (xcode_signing_id)=>{
                                    if(!xcode_signing_id)
                                        xcode_signing_id = default_xcode_signing_id
                                    property.set(xcode_signing_id_key, xcode_signing_id);
                                    massSetart(token, list);
                                }); 
                            });
                        }
                        break;
                    }
                }

                if(!iosStuck)
                    await massSetart(token, list);
            });
        });
    });
};

const massSetart = async (token, list) => {
    connectedDeviceList = list;
    var port = 8000;
    var system_port = 9000;
    for(var i=0;i<list.length;i++){
        const this_port = port++;
        const this_system_port = system_port++;
        const m = list[i];
        await deviceStart(token, m.os, m.deviceId, m.model, m.version, this_system_port, this_port);
    }

    setTimeout(updateConnectedDevice, 60000);
}

const checkiOSorAndroidDevice = async (callback) => {
    exec('adb devices -l', (err, stdout, stderr) => {
        exec('instruments -s devices', (err2, stdout2, stderr2) => {
            const r = [];
            if(err && err2) {
                console.log('Error', `Check your command 'adb' or command 'instruments' at least one`);
                callback([]);
                return;
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
                    if(model != 'unknown'){
                        console.log(`Android device found - ${model}(${deviceId})`);
                        r.push({
                            os:os,
                            deviceId:deviceId,
                            model:model,
                        })
                    }
                }
            })

            var lines2 = stdout2.split('\n');
            lines2.map(line2 => {
                if(line2 && !line2.startsWith('Known Devices:')
                    && line2.includes('(') && !line2.includes('Simulator')){
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
                callback(r);
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
const deviceStart = async (token, os, deviceId, model, version, system_port, appium_port) => {
    const appium_server_key = `${deviceId}_appium_server`;
    var appium_server_uri = `http://127.0.0.1:${appium_port}`;
    if(property.get(appium_server_key)){
        appium_server_uri = property.get(appium_server_key);
        appium_port = parseInt(appium_server_uri.split(':')[2]);
    }

    const xcode_org_id_key = `${deviceId}_xcode_org_id`;
    const xcode_signing_id_key = `${deviceId}_xcode_signing_id`;
    const xcode_org_id = property.get(xcode_org_id_key);
    const xcode_signing_id = property.get(xcode_signing_id_key);
    const xcconfig_path =  `${__dirname}/.xcconfig`
    const xcconfig =    
`DEVELOPMENT_TEAM = ${xcode_org_id}
CODE_SIGN_IDENTITY = ${xcode_signing_id}`
    console.log(xcconfig_path)
    fs.writeFileSync(xcconfig_path, xcconfig);

    console.log(`Appium Server Start For ${deviceId} - ${appium_server_uri} iOS with ${xcode_org_id} / ${xcode_signing_id}`)

    const appium_server = await Appium.main({port:appium_port});
    property.set(appium_server_key, appium_server_uri);
    setTimeout(deviceStatus, 2000, token, deviceId, appium_server_uri, os, model, version, system_port, xcode_org_id, xcode_signing_id, xcconfig_path);
};

/**
 * 다음 상태를 체크한다.
 * 1. appium 서버가 떠있는지
 * 2. adb로 하드웨어가 연결되어있는지
 * 
 * @param {*} token 
 * @param {*} deviceId 
 */
const deviceStatus = async (token, deviceId, appium_server, os, model, version, system_port, xcode_org_id, xcode_signing_id, xcconfig_path) => {
    console.log(`${new Date()} checking status - ${deviceId}, ${appium_server}`);
    var status_appium = false;
    const d = getConnectedDevice(deviceId);
    var status_connected = d != null;
    if(!d)
        console.log(`Error - Not connected - ${deviceId}`);
    client.reqAppium(deviceId, `/wd/hub/status`, 
    async function (err, resp, body) {
        var appium_version = '0';
        if(err){
            console.log(`Error - No appium - ${deviceId} ${appium_server}`);
        } else {
            status_appium = true;
            const json = JSON.parse(body);
            appium_version = json.value.build.version;
        }

        const path = `/device_status?os=${os}&device_id=${deviceId}&model=${encodeURI(model)}&appium_version=${appium_version}&status_appium=${status_appium}&status_connected=${status_connected}&local_appium_server=${appium_server}&version=${version}&system_port=${system_port}`
                    + `&xcode_org_id=${xcode_org_id}&xcode_signing_id=${xcode_signing_id}&xcconfig_path=${xcconfig_path}`;
        client.req(path, function(json){
                
        });

        setTimeout(deviceStatus, 60000, token, deviceId, appium_server, os, model, version, system_port, xcode_org_id, xcode_signing_id, xcconfig_path);
    });  
        
};

start();


