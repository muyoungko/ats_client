const {PythonShell} = require('python-shell');
const request = require('request');
const config = require('../config.js');

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

const test = async (token, json) => {
    req(token, `/test_session/${json.test_session_id}`, (json)=>{
        if(json){
            const code = json.code
            //console.log(code);
            /*
                파이썬2에 자꾸 설치되서 python3에서 못찾음 다음과 같이 설치해야한다.
                python3 -m pip install Appium-Python-Client
            */
            let options = {
                mode: 'text',
                pythonOptions: ['-u'], // get print results in real-time
                args: ['value1', 'value2', 'value3']
            };

            console.log('script runnging...');
            const pyshell = PythonShell.runString(code, options, function (err, results) {
                if (err) {
                    console.log(err);
                };
                console.log(results);
                console.log('finished');
                
            });

            pyshell.on('message', function (message) {
                // received a message sent from the Python script (a simple "print" statement)
                console.log(message);
              });
        }
    });
}

module.exports = {
 test : test
};
