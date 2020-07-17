'use strict';

const os = require('os');
const path = require('path');
const localfs = require('./localfs');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;

let getPath = function () {
    if (global.settings.isDevMode){
        return path.join(__dirname,'..','aria2','aria2c.exe');
    }
    else {
        return path.join(process.cwd(),'resources','aria2','aria2c.exe');
    }
}

let isRunning = function(){
    var stdout = execSync(`tasklist /fi "IMAGENAME eq aria2c.exe"`);
    var res = stdout.toString().toLowerCase().indexOf('aria2c.exe');
    return res >= 0;
}

let start = function(){
    if (os.platform() != 'win32') return;
    var aria2cPath = getPath();
    if (!localfs.isExists(aria2cPath)) return;
    var aria2cDir = path.dirname(aria2cPath);
    var confPath = path.join(aria2cDir,'aria2.conf');
    var sessionPath = path.join(aria2cDir,'aria2.session');

    if (!localfs.isExists(sessionPath)) {
        localfs.writeFile(sessionPath,'');
    }
    if (!localfs.isExists(confPath)) {
        localfs.writeFileSync(confPath,`dir=${path.join(localfs.getBigVolume(),'AriaNgDownload')}`);
    }

    var args = [
        "--quiet",
        "--rpc-allow-origin-all",
        "--enable-rpc",
        "--save-session-interval=60",
        `--conf-path=${confPath}`,
        `--input-file=${sessionPath}`,
        `--save-session=${sessionPath}`,
        `--stop-with-process=${process.pid}`
    ];

    exec(`${aria2cPath} ${args.join(' ')}`);
}

module.exports = {
    start:start,
    getPath:getPath,
    isRunning:isRunning
}
