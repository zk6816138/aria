'use strict';
const electron = require('electron');
const config = require('./config');
const core = require('./core');
const electronLocalshortcut = require('electron-localshortcut');
const url = require('url');
const path = require('path');
const ipc = require('./ipc')
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let getIndexUrl = function () {
    return url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, '..', 'app/theme.html')
    });
};

let init = function (parentWindow=null) {
    core.themeWindow = new BrowserWindow({
        parent: parentWindow,
        title: '',
        width: 460,
        height: 310,
        fullscreenable: false,
        frame: false,
        show :false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        skipTaskbar: true,
        transparent:true,
        webPreferences: {
            nodeIntegration: true
        }
    })

    core.themeWindow.hookWindowMessage(0x116,()=>{
        core.themeWindow.setEnabled(false);
        setTimeout(()=>{
            core.themeWindow.setEnabled(true);
        },100)
    })

    core.themeWindow.loadURL(getIndexUrl());

    core.themeWindow.on('closed',function () {
        core.themeWindow = null;
    })

    electronLocalshortcut.register(core.themeWindow, 'F12', () => {
        core.themeWindow.webContents.openDevTools();
    });
}

let show = function(parent){
    init(parent);
    if (core.themeWindow!=null && core.mainWindow!=null){
        var size = core.mainWindow.getSize();
        var pos = core.mainWindow.getPosition();
        var x = size[0] + pos[0] - 450 - 46;
        var y = pos[1] + 46;
        core.themeWindow.setPosition(x,y);
        core.themeWindow.show();
    }
}

let close = function(){
    if (core.themeWindow != null){
        core.themeWindow.destroy();
    }
}
module.exports = {
    show:show,
    close:close,
}
