const {PythonShell} = require('python-shell');
const request = require('request');
const config = require('../config.js');
const {publishToFront} = require('../mqtt/publish.js');
const sessionManager = require('../test_session/SessionManager.js');
const client = require('../api/client.js');

// 동일한 appium_session_id에 대해 두번이상 보내면 안된다.
// 서버는 device_id에 의해서만 free - run이 정해진다.
const appiumSessionIdsTerminated = {}
const appiumSessionTerminateToFront = async (device_id, appium_session_id) => {
    console.log('appiumSessionTerminateToFront');
    if(!appiumSessionIdsTerminated[appium_session_id]){
        appiumSessionIdsTerminated[appium_session_id] = appium_session_id;
        console.log(`appiumSessionTerminateToFront ${appium_session_id} sent`);
        await client.req_sync(`/device_status_terminate?device_id=${device_id}&appium_session_id=${appium_session_id}`);
    }
}

// appium 세션 유지를 위해 http://127.0.0.1:4723/wd/hub/sessions로 자동 체크 를 해야하나?
// /wd/hub/sessions http요청은 현재 세션의 newCommandTimeout 를 리셋시키지 못한다. 
// 반면 /wd/hub/session/[세션ID]는 세션이 newCommandTimeout를 리셋시켜 현재 세션이 유지가 된다. 
// /wd/hub/sessions로 세션 아이디를 가져온 다음
// 콘솔 명령어를 날리기전에 /wd/hub/session 커맨드로 해당 세션을 연장시키자
// 또한 sessions로 해당 세션이 살아 있는지 폴링 방식으로 감지한 후 서버에 매번 전달해줘야 한다.
const appiumSessionChecker = async (device_id, appium_session_id) => {
    console.log(` ${device_id}`);
    if(sessionManager.getCurrectAppiumSessonId(device_id)){
        client.reqAppium(device_id, '/wd/hub/sessions', async (err, resp, body) => {
            if(err){
                appiumSessionTerminateToFront(device_id, appium_session_id);
            } else {
                const json = JSON.parse(body);
                if(json.value && json.value.length > 0 && json.value[json.value.length-1].id === sessionManager.getCurrectAppiumSessonId(device_id)) {
                    console.log(`appiumSessionChecker alive ${device_id}`);
                    setTimeout(appiumSessionChecker, 10000, device_id, appium_session_id);
                } else { 
                    appiumSessionTerminateToFront(device_id, appium_session_id);
                }
            }
        })
    } else {
        console.log(`appiumSessionChecker end ${device_id}`);
    }
}

const execute_python = async (code, device_id) => {

}

const test = async (member_no, token, json) => {
    const test_session_id = json.test_session_id;

    client.req(`/test_session_pop/${test_session_id}`, (json)=>{
        if(json.r){
            try{
                var code = json.data.code
                const device_id = json.data.device_id;

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
                sessionManager.putSession(test_session_id, pyshell);
                var results = [];
                var traceback = [];
                var traceback_line = 0;
                pyshell.on('message', function (message) {
                    // received a message sent from the Python script (a simple "print" statement)
                    console.log(` result ${test_session_id}`, message);
                    if(message.startsWith('__ERROR__')){
                        traceback.push(message.replace('__ERROR__', ''));
                    } else if(message.startsWith('__LINE__')){
                        traceback_line = parseInt(message.replace('__LINE__', ''));
                    } else if(message.startsWith('__CONSOLE__')){
                        request({
                            url: config.api_host + `/test_session_console/${test_session_id}`,
                            headers: {
                                'x-access-token': token,
                                'content-type':'application/json'
                            },
                            json:true,
                            method: 'POST',
                            body:{status:'start'},
                        }, async (err, resp, body) => {
    
                        });
                    } else if(message.startsWith('__SESSION__')) {
                        const appium_session_id = message.replace('__SESSION__', '');
                        sessionManager.setCurrectAppiumSessonId(device_id, appium_session_id)
                        appiumSessionChecker(device_id, appium_session_id);
                    } else if(message) {
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
                .on('error', function (err) {
                    console.log(' error ', err);
                })
                .on('close', function (stderr) {
                    pyshell.end( async (err) =>{
                        console.log('python finished');
                        const appium_session_id = sessionManager.getCurrectAppiumSessonId(device_id);
                        sessionManager.removeSession(test_session_id);
                        await appiumSessionTerminateToFront(device_id, appium_session_id);
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
                    })
                })
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
