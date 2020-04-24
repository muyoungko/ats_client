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
            try{
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

                const filename = `test_${test_session_id}.py`; 
                fs = require('fs');
                fs.writeFileSync(filename, code, 'utf8')            
                
                let pyshell = new PythonShell(filename, options);
                var results = [];
                var traceback = [];
                var traceback_line = 0;
                pyshell.on('message', function (message) {
                    // received a message sent from the Python script (a simple "print" statement)
                    console.log(' result ', message);
                    if(message.startsWith('__ERROR__')){
                        traceback.push(message.replace('__ERROR__', ''));
                    } else if(message.startsWith('__LINE__')){
                        traceback_line = parseInt(message.replace('__LINE__', ''));
                    } else {
                        results.push(message);
                        request({
                            url: config.api_host + `/test_session_log/${test_session_id}`,
                            headers: {
                                'x-access-token': token,
                                'content-type':'application/json'
                            },
                            json:true,
                            method: 'POST',
                            body:{
                                log : message
                            },
                        }, async (err, resp, body) => {
    
                        });
                    }
                })
                .on('stderr', function (stderr) {
                    console.log(' stderr ', stderr);
                    traceback.push(stderr);
                })
                .end(function (err) {
                    console.log(' end ', err);
                    console.log('python finished');
                    request({
                        url: config.api_host + `/test_session_complete/${test_session_id}`,
                        headers: {
                            'x-access-token': token,
                            'content-type':'application/json'
                        },
                        json:true,
                        method: 'POST',
                        body:{
                            success : traceback.length == 0,
                            results:results, traceback:traceback,
                            traceback_line : traceback_line
                        },
                    }, async (err, resp, body) => {

                    });
                });;
            
            }catch(e){
                console.log(' try - catch ', e);
            }
        } else {
            console.log('Test session is already poped');
        }
    });
}

module.exports = {
 test : test
};
