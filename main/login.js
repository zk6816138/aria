'use strict';
const electron = require('electron');
const core = require('./core');
const electronLocalshortcut = require('electron-localshortcut');
const url = require('url');
const path = require('path');
const ipc = require('./ipc')
const BrowserWindow = electron.BrowserWindow;

let getIndexUrl = function () {
    return url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, '..', 'app/login.html')
    });
};

let init = function (parentWindow=null) {
    core.loginWindow = new BrowserWindow({
        parent: parentWindow ? parentWindow : null,
        title: '',
        width: 332,
        height: 466,
        fullscreenable: false,
        frame: false,
        show: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        closable: false,
        skipTaskbar: true,
        transparent: true,
        modal:true,
        webPreferences: {
            nodeIntegration: true
        }
    })

    core.loginWindow.hookWindowMessage(0x116,()=>{
        core.loginWindow.setEnabled(false);
        setTimeout(()=>{
            core.loginWindow.setEnabled(true);
        },100)
    })

    core.loginWindow.loadURL(getIndexUrl());

    core.loginWindow.on('close', (event) => {
        event.preventDefault();
    })

    electronLocalshortcut.register(core.loginWindow, 'F12', () => {
        core.loginWindow.webContents.openDevTools();
    });

    electronLocalshortcut.register(core.loginWindow, 'Esc', () => {
        close(true);
    });

    core.loginWindow.closeWindow = close;
    core.loginWindow.showWindow = show;
}

let show = function(){
    if (core.loginWindow != null && core.mainWindow!=null){
        var size = core.mainWindow.getSize();
        var pos = core.mainWindow.getPosition();
        var x = pos[0] + parseInt(size[0]/2) - (332/2);
        var y = pos[1] + parseInt(size[1]/2) - (466/2);
        core.loginWindow.setPosition(x,y);
        core.loginWindow.webContents.send('main-to-login','login-window=show');
    }
}

let close = function(flag = false){
    if (core.loginWindow != null){
        core.loginWindow.webContents.send('main-to-login',`login-window=close${flag?'-true':''}`);
    }
}

module.exports = {
    init: init,
    show: show,
    close: close
}
