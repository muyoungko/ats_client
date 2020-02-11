

const mqtt = require('mqtt');
const config = require('./src/config');
const request = require('request');
const wd = require('wd');
const { exec } = require('child_process');
const property = require('./src/property/property.js');
var readlineSync = require('readline-sync');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})


const mqttClientAccess = (token, callback) => {

    req(token, '/token/me', function(json){
        if(json){
            const member_no = json.member_no
    
            const options = {
                host: config.mqtt_host,
                port: config.mqtt_host_post,
                protocol: 'mqtt',
            };
                
            const client = mqtt.connect(options);
            
            client.on("connect", () => {	
                console.log("mqtt client connected "+ client.connected);

                const topic = `${config.mqtt_topic}/${member_no}/#`;
                console.log(`subscribing - ${topic}`);
                client.subscribe(topic , {qos:1});
                client.on('message', (topic, message, packet) => {
                    console.log("message is "+ message);
                    console.log("topic is "+ topic);
                });
                callback();
            });
        }
    });
}

const start = async function(){
    console.log(`Welcome Auto Test Hub`);
    console.log(`Get your client token in here - ${config.host}/#/token`);
    var previousToken = property.value.token;// || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZW1iZXJfbm8iOiIxNTgwNDYyMjYzODExIiwiZW1haWwiOiJtdXlvdW5na28xMXN0QGdtYWlsLmNvbSIsIm5hbWUiOiJtdXlvdW5na28xMXN0IiwidHlwZSI6InNsYWNrIiwicHJvZmlsZSI6Imh0dHBzOi8vc2VjdXJlLmdyYXZhdGFyLmNvbS9hdmF0YXIvOTk1OGE0YTVkZjJlYjMyNmNlNWEzZWZmOWM2NjNlNjguanBnP3M9MTkyJmQ9aHR0cHMlM0ElMkYlMkZhLnNsYWNrLWVkZ2UuY29tJTJGZGYxMGQlMkZpbWclMkZhdmF0YXJzJTJGYXZhXzAwMDktMTkyLnBuZyIsImlhdCI6MTU4MTMxMDE2NywiZXhwIjoxNjY3NzEwMTY3LCJpc3MiOiIqIiwic3ViIjoidXNlckluZm8ifQ.r2cU1CknU0lqb-3IzYx2de77q6sgmaaLPZKQrSe39Uk';
    
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
                        
                        deviceStatus(token, os, deviceId, model);
                    }
                })
            });
        });
    });
        
};



const req = async (token, path, callback) => {
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

const deviceStatus = async (token, os, deviceId, model) => {
    const appium_server_key = `${deviceId}_appium_server`;
    var default_appium_server = 'http://127.0.0.1:4723';
    if(property.value[appium_server_key])
        default_appium_server = property.value[appium_server_key];
    var q = `Please enter the appium server for ${deviceId}(default ${default_appium_server}) : `;
    
    readline.question(q, async (appium_server)=>{
        appium_server = appium_server || default_appium_server;
        readline.close();
        request({
            url: `${appium_server}/wd/hub/status`,
        },
        async function (err, resp, body) {
            if(err){
                console.log('1. install node https://nodejs.org/');
                console.log('2. npm i - g appium');
                console.log('3. execute command appium');
            } else {
                const json = JSON.parse(body);
                const v = json.value.build.version;
                const status = 'FREE';
                req(token, `/device/status?os=${os}&device_id=${deviceId}&model=${model}&appium_version=${v}&status=${status}`, function(json){
                    property.set(appium_server_key, appium_server) 
                });
            }
        });
    });
}


start();


