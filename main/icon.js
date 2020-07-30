'use strict';

const os = require('os');
const path = require('path');
const exec = require('child_process').exec;
const app = require('electron').app;

let getPath = function () {
    if (global.settings.isDevMode){
        return path.join(__dirname,'..','assets','icon.exe');
    }
    else {
        return path.join(process.cwd(),'resources','icon.exe');
    }
}

let getSavePath = function(fileName){
    return path.join(app.getPath('userData'),'iconCache',`${fileName}.png`);
}

let getFileIcon = function(ext,callback){
    if (os.platform() != 'win32') return;
    var exePath = getPath();
    var savePath = getSavePath(ext);
    exec(`${exePath} -f ${ext} -o ${savePath}`,function (err,stdout,stderr) {
        if (stdout.toString()==true) {
            callback(savePath);
        }
        else {
            callback(false);
        }
    });
}

module.exports = {
    getFileIcon:getFileIcon,
    getPath:getPath,
    getSavePath:getSavePath
}
