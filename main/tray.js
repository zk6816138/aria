'use strict';

const os = require('os');
const path = require('path');
const electron = require('electron');

const core = require('./core');
const config = require('./config');
const ipc = require('./ipc')

const app = electron.app;
const Menu = electron.Menu;
const Tray = electron.Tray;

let instance = null;
let iconPath = path.join(__dirname, '..', 'assets', 'AriaNg.ico');

let init = function () {
    if (instance === null && os.platform() === 'win32') {
        instance = new Tray(iconPath);
        instance.setToolTip('AriaNg');
        instance.setContextMenu(Menu.buildFromTemplate([
            {
                label: 'Quit', click: function () {
                    core.isConfirmExit = true;
                    app.quit();
                }
            }
        ]));
        instance.on('click', () => {
            core.mainWindow.show();
            core.mainWindow.focus();
        });
    }
};

let setContextMenu = function (context) {
    if (instance !== null) {
        instance.setContextMenu(Menu.buildFromTemplate([
            {
                label: context.labels.ShowAriaNgNative, click: function () {
                    core.mainWindow.show();
                }
            },
            {
                label: context.labels.ShowFloatWindow, click: function () {
                    if (core.floatWindow.isVisible()){
                        core.floatWindow.hide();
                        config.showFloat = false;
                    }
                    else {
                        core.floatWindow.show();
                        config.showFloat = true;
                    }
                    config.save('showFloat');
                    ipc.showFloatWindowMessage();
                }
            },
            {
                type: 'separator'
            },
            {
                label: context.labels.Exit, click: function () {
                    core.isConfirmExit = true;
                    app.quit();
                }
            }
        ]));
    }
};

let setToolTip = function (value) {
    if (instance !== null) {
        instance.setToolTip(value);
    }
};

module.exports = {
    isEnabled: function () {
        return !!instance;
    },
    init: init,
    setContextMenu: setContextMenu,
    setToolTip: setToolTip
};
