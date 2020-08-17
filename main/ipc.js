'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
const electron = require('electron');

const pkgfile = require('../package');
const core = require('./core');

const ipcMain = electron.ipcMain;

const supportedFileExtensions = {
    '.torrent': 'torrent',
    '.meta4': 'metalink',
    '.metalink': 'metalink'
};

let getIndexUrl = function () {
    return url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, '..', pkgfile.entry)
    });
};

let loadIndexUrl = function () {
    core.mainWindow.loadURL(getIndexUrl());
};

let loadNewTaskUrl = function () {
    core.mainWindow.loadURL(getIndexUrl() + '#!/new');
};

let navigateTo = function (routeUrl) {
    core.mainWindow.webContents.send('navigate-to', routeUrl);
};

let navigateToNewTask = function () {
    navigateTo('/new');
};

let showErrorMessage = function (message) {
    core.mainWindow.webContents.send('show-error', message);
};

let updateContextMenu = function(){
    core.mainWindow.webContents.send('update-context-menu');
}

let sendSelectAll = function(){
    core.mainWindow.webContents.send('select-all');
}

let sendTaskState = function(message){
    core.mainWindow.webContents.send('task-state',message);
}

let sendThemeWindowClose = function(){
    core.themeWindow.webContents.send('theme-window-close');
}

let onNewDropFile = function (callback) {
    ipcMain.on('new-drop-file', callback);
};

let onNewDropText = function (callback) {
    ipcMain.on('new-drop-text', callback);
};

let onDownloadSpeed = function(){
    ipcMain.on('download-speed', function (e,arg) {
        core.floatWindow.webContents.send('download-speed',arg);
    });
}

let onSkinCenterStatus = function(callback){
    ipcMain.on('skin-center-status', callback);
}

let onThemeWindowLoaded = function(){
    ipcMain.on('theme-window-loaded', function () {
        core.mainWindow.webContents.send('theme-window-loaded');
    });
}

let onSelectedTheme = function(){
    ipcMain.on('selected-theme', function (e,arg) {
        core.mainWindow.webContents.send('selected-theme',arg);
        core.floatWindow.webContents.send('selected-theme',arg);
    });
}

let onColorChange = function(){
    ipcMain.on('color-change', function (e,arg) {
        core.mainWindow.webContents.send('color-change',arg);
        if (arg.name=='MainColor'){
            core.floatWindow.webContents.send('color-change',arg);
        }
    });
}

let onLanguageChange = function(){
    ipcMain.on('language-change', function (e,arg) {
        core.themeWindow.webContents.send('language-change',arg);
        core.floatWindow.webContents.send('language-change',arg);
    });
}

let isContainsSupportedFileArg = function (arg) {
    if (!arg) {
        return false;
    }

    let fileExtension = path.extname(arg);

    if (!supportedFileExtensions[fileExtension]) {
        return false;
    }

    return fs.existsSync(arg);
};

let newTaskFromFile = function (filePath, async) {
    let fileExtension = path.extname(filePath);

    if (!supportedFileExtensions[fileExtension]) {
        showErrorMessage('The selected file type is invalid!');
        return;
    }

    let result = null;

    try {
        let fileContent = fs.readFileSync(filePath);

        result = {
            type: supportedFileExtensions[fileExtension],
            fileName: path.basename(filePath),
            base64Content: Buffer.from(fileContent).toString('base64'),
            async: !!async
        };
    } catch (e) {
        result = {
            exception: e
        }
    }

    core.mainWindow.webContents.send('new-task-from-file', result);
};

let asyncNewTaskFromFile = function (filePath) {
    if (!filePath) {
        return;
    }

    ipcMain.once('view-content-loaded', (event, arg) => {
        newTaskFromFile(filePath, true);
    });
};

let newTaskFromText = function (text, async) {
    let result = {
        text: text,
        async: !!async
    };

    core.mainWindow.webContents.send('new-task-from-text', result);
};

let asyncNewTaskFromText = function (text) {
    if (!text) {
        return;
    }

    ipcMain.once('view-content-loaded', (event, arg) => {
        newTaskFromText(text, true);
    });
};

module.exports = {
    loadIndexUrl: loadIndexUrl,
    loadNewTaskUrl: loadNewTaskUrl,
    navigateToNewTask: navigateToNewTask,
    showErrorMessage: showErrorMessage,
    onNewDropFile: onNewDropFile,
    onNewDropText: onNewDropText,
    isContainsSupportedFileArg: isContainsSupportedFileArg,
    newTaskFromFile: newTaskFromFile,
    asyncNewTaskFromFile: asyncNewTaskFromFile,
    newTaskFromText: newTaskFromText,
    asyncNewTaskFromText: asyncNewTaskFromText,
    updateContextMenu: updateContextMenu,
    onDownloadSpeed: onDownloadSpeed,
    sendSelectAll:sendSelectAll,
    sendTaskState: sendTaskState,
    onSkinCenterStatus: onSkinCenterStatus,
    onSelectedTheme: onSelectedTheme,
    onColorChange: onColorChange,
    onLanguageChange: onLanguageChange,
    sendThemeWindowClose: sendThemeWindowClose,
    onThemeWindowLoaded: onThemeWindowLoaded
};
