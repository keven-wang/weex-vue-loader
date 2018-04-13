/**
 * @fileOverview  weex vue loader plugin context.
 * @author liesun.wjb
 * @since  2018.04.11
 */

const __cache__ = {};

module.exports = {
    regContext (loadCtx, key, file) {
        if (!__cache__[key]) {
            __cache__[key] = {file};
        }
        
        return this.getContext(loadCtx, key);
    }, 

    getContext (loadCtx, key) {
        return new ContextInstance(loadCtx, key);
    },
};

class ContextInstance {
    constructor (loaderCtx, contextKey) {
        this.key = contextKey;
        this.compilation = loaderCtx._compilation;        
    }

    get contextData () {
        return __cache__[this.key];
    }

    release () {
        delete __cache__[this.key];
    }

    hasRegPlugin (event) {
        let plugins = this.compilation._plugins[event];
        return plugins && plugins.length > 0;
    }

    applyPlugins (event, value) {
        this.regCall(event);
        if (event && this.hasRegPlugin(event)) { 
            this.compilation.applyPlugins(event, value, this.contextData);
            this.handleWait(event);
        }
    }

    getPluginVal (event, value) {
        this.regCall(event);
        if (!event || !this.hasRegPlugin(event)) { return value; }

        setTimeout(()=> this.handleWait(event), 0);
        return this.compilation.applyPluginsBailResult(event, value, this.contextData);
    }

    applyAfter (waitEvent, callback) {
        if (typeof callback !== 'function') { 
            throw 'applyAfter: callback must a function!'; 
        }

        if ( this.hasCall(waitEvent) ) {
            callback();
        } else {
            this.regWait(waitEvent, callback);
        }
    }

    regWait (event, callback) {
        let waits = this.contextData.waits || (this.contextData.waits = {})
        let list  = waits[event] || (waits[event] = []);
        list.push(callback);
    }

    hasCall (event) {
        if (!this.contextData.hasCall) { return false }
        return this.contextData.hasCall[event]    
    }

    regCall (event) {
        let hasCall = this.contextData.hasCall || (this.contextData.hasCall = {});
        hasCall[event] = true;
    }

    handleWait (event) {
        if (!this.contextData) { return; }

        let waits = this.contextData.waits;
        if (!waits) { return; }

        let list = waits[event];
        if (!list) { return; }

        delete waits[event];
        list.forEach(func => func());
    } 
}