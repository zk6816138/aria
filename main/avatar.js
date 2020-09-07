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
        pathname: path.join(__dirname, '..', 'app/avatar.html')
    });
};

let init = function (parentWindow=null) {
    core.avatarWindow = new BrowserWindow({
        parent: parentWindow ? parentWindow : null,
        title: '',
        width: 410,
        height: 650,
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

    core.avatarWindow.hookWindowMessage(0x116,()=>{
        core.avatarWindow.setEnabled(false);
        setTimeout(()=>{
            core.avatarWindow.setEnabled(true);
        },100)
    })

    core.avatarWindow.loadURL(getIndexUrl());

    core.avatarWindow.on('close', (event) => {
        event.preventDefault();
    })
    core.avatarWindow.webContents.openDevTools();
    electronLocalshortcut.register(core.avatarWindow, 'F12', () => {
        core.avatarWindow.webContents.openDevTools();
    });

    electronLocalshortcut.register(core.avatarWindow, 'Esc', () => {
        core.avatarWindow.webContents.send('main-to-avatar', {type: 'avatar-window=close'});
    });

    core.avatarWindow.closeWindow = close;
    core.avatarWindow.showWindow = show;
}

let show = function(){
    if (core.avatarWindow != null && core.mainWindow!=null){
        var size = core.mainWindow.getSize();
        var pos = core.mainWindow.getPosition();
        var x = pos[0] + parseInt(size[0]/2) - (410/2);
        var y = pos[1] + parseInt(size[1]/2) - (650/2);
        core.avatarWindow.setPosition(x,y);
        core.avatarWindow.show();
    }
}

let close = function(){
    if (core.avatarWindow != null){
        core.avatarWindow.hide();
    }
}

module.exports = {
    init: init,
    show: show,
    close: close
}
