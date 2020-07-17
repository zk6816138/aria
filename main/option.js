'use strict';

const aria2c = require('./aria2c');
const fs = require('fs');
const ini = require('./ini' );
const path = require('path');

let write = function (k,v) {
    return new Promise(function (resolve, reject) {
        var iniPath = path.join(path.dirname(aria2c.getPath()),'aria2.conf');
        var conf = ini.parse(fs.readFileSync(iniPath).toString());
        conf[k]=v;

        fs.writeFile(iniPath,ini.stringify(conf),function (err) {
            if (err){
                reject(err);
            }
            else {
                resolve();
            }
        });
    })
}

module.exports = {
    write:write
}
