class SessionManager { 
    constructor() { 
        if (!SessionManager.instance) { 
            this._cache = {}
            SessionManager.instance = this 
        } 
        return SessionManager.instance 
    } 
    
    putSession(session_id, pythonshell) { 
        this._cache[session_id] = pythonshell;
    } 

    removeSession(session_id) { 
        delete this._cache.session_id;
    } 
    
    getSession(session_id) { 
        return this._cache[session_id];
    } 
}

const sessionManager = new SessionManager()
module.exports = sessionManager;