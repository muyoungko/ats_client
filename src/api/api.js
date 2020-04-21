const {PythonShell} = require('python-shell');
const request = require('request');
const config = require('../config.js');
const {publishToFront} = require('../mqtt/publish.js');

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

const test = async (member_no, token, json) => {
    const test_session_id = json.test_session_id;
    req(token, `/test_session_pop/${test_session_id}`, (json)=>{
        if(json.r){
            var code = json.data.code

            //test_session_id
            code = code.replace(/__TOKEN__/gi, token)
            .replace(/__API_HOST__/gi, config.api_host)
            .replace(/__TEST_SESSION_ID__/gi, test_session_id); 

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
                    // console.log('executable', err.executable);
                    // console.log('options', err.options);
                    // console.log('script', err.script);
                    // console.log('args', err.args);
                    body.message = err.message;
                    body.traceback = err.traceback;
                } else {
                    //코드가 syntex오류가 실패한다면 실패 할 때까지 출력된 로그가 results에 수집되지 않는다.
                    //TODO : 실패 로그를 수집해야한다.
                    body.results = results;
                    console.log('-------------------------------success------------------------------');
                    console.log('--------------------------results-----------------------------------');
                    console.log(results)
                };
                

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
                async (err, resp, body) => {
                });
            });

            pyshell.on('message', function (message) {
                // received a message sent from the Python script (a simple "print" statement)
                console.log(message);
              });
        } else {
            console.log('Test session is already poped');
        }
    });
}

module.exports = {
 test : test
};
