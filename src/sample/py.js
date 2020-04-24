const {PythonShell} = require('python-shell');


let options = {
    mode: 'text',
    pythonOptions: ['-u'], // get print results in real-time
    args: ['value1', 'value2', 'value3']
};

const code = 

`
import sys, os

def console() :
    print('console : ')
    while True:
        input = sys.stdin.readline()
        if input.startswith('exit') :
            break
        exec(input)

print('start new ')
a = 1 + 1
print(a)

# console()
try :
    sdklfjsljf
except Exception as ex:
    print('__ERROR__' + str(ex))
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    print('__LINE__' + str(exc_tb.tb_lineno))
    

`

const sleep = (ms) => {
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}


const start = async () =>{
    console.log('script runnging...');

    const filename = `var/f.py`; 
    fs = require('fs');
    fs.writeFileSync(filename, code, 'utf8')

    let pyshell = new PythonShell(filename, options);
    // const pyshell = PythonShell.runString(code, options, function (err, results) {
    //     var body = {};
    //     if (err) {
    //         console.log('-------------------------------err------------------------------');
    //         console.log(Object.keys(err));
    //         console.log(err);
    //         // console.log('executable', err.executable);
    //         // console.log('options', err.options);
    //         // console.log('script', err.script);
    //         // console.log('args', err.args);
    //         body.message = err.message;
    //         body.traceback = err.traceback;
    //     } else {
    //         //코드가 syntex오류가 실패한다면 실패 할 때까지 출력된 로그가 results에 수집되지 않는다.
    //         //TODO : 실패 로그를 수집해야한다.
    //         body.results = results;
    //         console.log('-------------------------------success------------------------------');
    //         console.log('--------------------------results-----------------------------------');
    //         console.log(results)
    //     };
        
    // });

    pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        console.log(' - ', message);
    });

    pyshell.on('stdout', function (stdout) {
        console.log(' stdout ', stdout);
    });

    pyshell.on('stderr', function (stderr) {
        console.log(' stderr ', stderr);
    });

    pyshell.on('close', function (stderr) {
        console.log(' close ');
    });

    await sleep(3000)

    pyshell.send(`print('count down')`)

    await sleep(1000)
    pyshell.send(`print('5')`)
    await sleep(1000)
    pyshell.send(`print('4')`)
    await sleep(1000)
    pyshell.send(`print('3')`)
    await sleep(1000)
    pyshell.send(`print('2')`)
    await sleep(1000)
    pyshell.send(`print('1')`)
    await sleep(1000)
    pyshell.send(`print('0')`)
    await sleep(1000)
    pyshell.send(`exit`)

    await sleep(1000)
    // pyshell.end(function (err,code,signal) {
    //     if (err) throw err;
    //     console.log('The exit code was: ' + code);
    //     console.log('The exit signal was: ' + signal);
    //     console.log('finished');
    // });

    console.log('------end------')
}


start()