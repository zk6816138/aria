'use strict';
const electron = require('electron');
const config = require('./config');
const core = require('./core');
const electronLocalshortcut = require('electron-localshortcut');
const url = require('url');
const path = require('path');
const contextMenu = require('electron-context-menu');

const BrowserWindow = electron.BrowserWindow;

let getIndexUrl = function () {
    return url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, '..', 'app/float.html')
    });
};

let init = function (parentWindow) {
    core.floatWindow = new BrowserWindow({
        parent: new BrowserWindow({parent:parentWindow,show: false}),
        title: 'AriaNg 悬浮窗',
        width: 64,
        height: 64,
        fullscreenable: false,
        frame: false,
        show: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        closable: false,
        skipTaskbar: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: true
        }
    })

    contextMenu({
        prepend: (params, browserWindow) => [{
            label: 'Rainbow',
        }]
    });

    core.floatWindow.hookWindowMessage(0x116,function (e) {
        core.floatWindow.setEnabled(false);
        setTimeout(function () {
            core.floatWindow.setEnabled(true);
        },100)
    })

    let displays = electron.screen.getAllDisplays();
    if (!config.floatX || !config.floatY || config.floatX<=0 || config.floatY<=0){
        config.floatX = displays[0].workAreaSize.width*0.9;
        config.floatY = displays[0].workAreaSize.height - displays[0].workAreaSize.height *0.9;
    }
    core.floatWindow.setPosition(config.floatX,config.floatY);

    core.floatWindow.loadURL(getIndexUrl());
    core.floatWindow.setAlwaysOnTop(true,'screen-saver');

    core.floatWindow.once('ready-to-show',()=>{
        if (config.showFloat){
            core.floatWindow.show();
        }
    })

    core.floatWindow.on('close', (event) => {
        event.preventDefault();
    })

    core.floatWindow.on('closed', () => {
        if (config.floatX > 0 && config.floatY > 0) {
            config.save('floatX');
            config.save('floatY');
        }
        core.floatWindow = null;
    })

    core.floatWindow.on('move', () => {
        let positions = core.floatWindow.getPosition();
        config.floatX = positions[0];
        config.floatY = positions[1];
    })

    electronLocalshortcut.register(core.floatWindow, 'F12', () => {
        core.floatWindow.webContents.openDevTools();
    });
}

module.exports = {
    init: init
}
