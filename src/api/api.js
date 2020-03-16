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
    const test_session_id = json.test_session_id;
    req(token, `/test_session_pop/${test_session_id}`, (json)=>{
        if(json.r){
            const code = json.data.code
            console.log(code);
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
                var body = {};
                if (err) {
                    console.log('-------------------------------err------------------------------');
                    console.log(Object.keys(err));
                    console.log(err);
                    body.message = err.message;
                    body.traceback = err.traceback;
                } else {
                    body.results = results;
                    console.log('-------------------------------success------------------------------');
                };
                //console.log(output);
                console.log('-------------------------------------------------------------');
                
                request({
                    url: config.api_host + `/test_session_complete/${test_session_id}`,
                    headers: {
                        'x-access-token': token,
                        'content-type':'application/json'
                    },
                    json:true,
                    method: 'POST',
                    body:body,
                },
                async function (err, resp, body) {
                    
                });
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
