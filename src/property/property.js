const fs = require('fs');

class Property {
    constructor() { 
        if (!Property.instance) { 
            Property.instance = this;
            Property.instance.load();
        } 
        return Property.instance 
    } 

    value = {loaded:false};
    set = function(k, v){
        this.value[k] = v;
        this.save();
    }

    save = function(){
        const ks = Object.keys(this.value);
        var s = '';
        ks.map(k => {
            if(k)
                s+= `${k}=${this.value[k]}\n`;
        });
        fs.writeFileSync('properties', s);
    };

    load = function(){
        if(!fs.existsSync('properties')) {
            fs.writeFileSync('properties', '');
        }
        var s = fs.readFileSync('properties').toString();
        const lines = s.split('\n');
        lines.map(l=>{
            const pv = l.split('=');
            const p = pv[0];
            const v = pv[1];
            this.value[p] = v;
        });
    };
}
const p = new Property()
module.exports = p;
