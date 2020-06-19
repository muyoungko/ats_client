const fs = require('fs');

class Property {
    constructor() { 
        if (!Property.instance) { 
            this._value = {}
            this.load();
            Property.instance = this 
        } 
        return Property.instance 
    } 

    get(k){
        return this._value[k];
    }

    set(k, v){
        this._value[k] = v;
        this.save();
    }

    save(){
        const ks = Object.keys(this._value);
        var s = '';
        ks.map(k => {
            if(k)
                s+= `${k}=${this._value[k]}\n`;
        });
        fs.writeFileSync('properties', s);
    };

    load(){
        if(!fs.existsSync('properties')) {
            fs.writeFileSync('properties', '');
        }
        var s = fs.readFileSync('properties').toString();
        const lines = s.split('\n');
        lines.map(l=>{
            const pv = l.split('=');
            const p = pv[0];
            const v = pv[1];
            this._value[p] = v;
        });
    };
}
const p = new Property()
module.exports = p;
