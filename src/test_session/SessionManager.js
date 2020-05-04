class SessionManager { 
    constructor() { 
        if (!SessionManager.instance) { 
            this._cache = {}
            this.appiumSessionIdByDevice = {};
            SessionManager.instance = this 
        } 
        return SessionManager.instance 
    } 
    
    putSession(session_id, pythonshell) { 
        this._cache[session_id] = pythonshell;
    } 

    removeSession(session_id) { 
        delete this._cache[session_id];
    } 
    
    getSession(session_id) { 
        return this._cache[session_id];
    } 

    setCurrectAppiumSessonId(device_id, appium_session_id){
        //console.log(`setCurrectAppiumSessonId ${device_id}` , this.appiumSessionIdByDevice);
        this.appiumSessionIdByDevice[device_id] = appium_session_id;
    }

    removeCurrectAppiumSessonId(device_id){
        delete this.appiumSessionIdByDevice[device_id];
    }

    getCurrectAppiumSessonId(device_id){
        //console.log(`getCurrectAppiumSessonId ${device_id}` , this.appiumSessionIdByDevice);
        return this.appiumSessionIdByDevice[device_id];
    }
}

const sessionManager = new SessionManager()
module.exports = sessionManager;