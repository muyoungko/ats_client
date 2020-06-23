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
        if(this._value[k] == 'undefined')
            return null;
        else 
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
        const property_path =  `${__dirname}/.property`
        fs.writeFileSync(property_path, s);
    };

    load(){
        const property_path =  `${__dirname}/.property`
        if(!fs.existsSync(property_path)) {
            fs.writeFileSync(property_path, '');
        }
        var s = fs.readFileSync(property_path).toString();
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
