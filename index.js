

const mqtt = require('mqtt');
const config = require('./src/config');
const request = require('request');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})
  
console.log(`Hello Auto Test Hub`);
console.log(`Get your client token in here - ${config.host}/#/token`);
var previousToken = process.env.AUTOTESTHUB_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZW1iZXJfbm8iOiIxNTgwNDYyMjYzODExIiwiZW1haWwiOiJtdXlvdW5na28xMXN0QGdtYWlsLmNvbSIsIm5hbWUiOiJtdXlvdW5na28xMXN0IiwidHlwZSI6InNsYWNrIiwicHJvZmlsZSI6Imh0dHBzOi8vc2VjdXJlLmdyYXZhdGFyLmNvbS9hdmF0YXIvOTk1OGE0YTVkZjJlYjMyNmNlNWEzZWZmOWM2NjNlNjguanBnP3M9MTkyJmQ9aHR0cHMlM0ElMkYlMkZhLnNsYWNrLWVkZ2UuY29tJTJGZGYxMGQlMkZpbWclMkZhdmF0YXJzJTJGYXZhXzAwMDktMTkyLnBuZyIsImlhdCI6MTU4MTMxMDE2NywiZXhwIjoxNjY3NzEwMTY3LCJpc3MiOiIqIiwic3ViIjoidXNlckluZm8ifQ.r2cU1CknU0lqb-3IzYx2de77q6sgmaaLPZKQrSe39Uk';
if(previousToken)
    console.log(`previousToken = ${previousToken}`);
readline.question(`Please enter the client token : `, (token) => {
    if(!token)
        token = previousToken;
    readline.close()

    request({
        url: config.api_host + '/token/me',
        headers: {
            'x-access-token': token
        },
    },
    function (err, resp, body) {
        if(body){
            const json = JSON.parse(body);
            const member_no = json.member_no

            const options = {
                host: config.mqtt_host,
                port: config.mqtt_host_post,
                protocol: 'mqtt',
            };
              
            const client = mqtt.connect(options);
            
            client.on("connect", () => {	
                console.log("connected "+ client.connected);
            });
            
            const topic = `${config.mqtt_topic}/${member_no}/#`;
            console.log(topic);
            client.subscribe(topic , {qos:1});
            
            client.on('message', (topic, message, packet) => {
                console.log("message is "+ message);
                console.log("topic is "+ topic);
            });

        }
    });
})
