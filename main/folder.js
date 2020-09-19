'use strict';
const electron = require('electron');
const core = require('./core');
const electronLocalshortcut = require('electron-localshortcut');
const url = require('url');
const path = require('path');
const ipc = require('./ipc');
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
Menu.setApplicationMenu(null);

let getIndexUrl = function () {
    return url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, '..', 'app/folder.html')
    });
};

let init = function (parentWindow=null) {
    core.folderWindow = new BrowserWindow({
        parent: parentWindow,
        title: '',
        width: 400,
        height: 500,
        minWidth: 318,
        minHeight: 288,
        fullscreenable: false,
        show :false,
        minimizable: false,
        maximizable: false,
        skipTaskbar: true,
        modal:true,
        webPreferences: {
            nodeIntegration: true
        }
    })

    core.folderWindow.loadURL(getIndexUrl());
    core.folderWindow.on('close', (event) => {
        core.mainWindow.webContents.send('select-folder','');
        event.preventDefault();
        close();
    })

    core.folderWindow.on('closed',function () {
        core.folderWindow = null;
    })

    electronLocalshortcut.register(core.folderWindow, 'F12', () => {
        core.folderWindow.webContents.openDevTools();
    });
    electronLocalshortcut.register(core.folderWindow, 'Esc', () => {
        close();
    });
    electronLocalshortcut.register(core.folderWindow, 'Alt+F', () => {
        ipc.sendFolderWindowMessage({type:'short',value:'f'})
    });
    electronLocalshortcut.register(core.folderWindow, 'Alt+M', () => {
        ipc.sendFolderWindowMessage({type:'short',value:'m'})
    });
}

let show = function(){
    if (core.folderWindow == null){
        init(core.mainWindow);
    }
    if (core.folderWindow!=null){
        var size = core.mainWindow.getSize();
        var pos = core.mainWindow.getPosition();
        var x = pos[0] + parseInt(size[0]/2) - (400/2);
        var y = pos[1] + parseInt(size[1]/2) - (490/2);
        core.folderWindow.setPosition(x,y);
        core.folderWindow.show();
    }
}

let close = function(){
    if (core.folderWindow != null){
        core.folderWindow.hide();
        setTimeout(function () {
            core.folderWindow.destroy();
        },200)
    }
}
module.exports = {
    show:show,
    close:close,
}
