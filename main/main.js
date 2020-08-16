'use strict';

const os = require('os');
const electron = require('electron');
const electronLocalshortcut = require('electron-localshortcut');

const pkgfile = require('../package');
const config = require('./config');
const core = require('./core');
const cmd = require('./cmd');
const ipc = require('./ipc');
const menu = require('./menu');
const tray = require('./tray');
const aria2c = require('./aria2c');
const float = require('./float');
const theme = require('./theme');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const singletonLock = app.requestSingleInstanceLock();
const isRun = aria2c.isRunning();

if (!singletonLock || isRun) {
    app.quit();
}

let filePathInCommandLine = process.argv.length > 1 && process.argv[1];

function isEnableCloseToHide() {
    return (tray.isEnabled() || os.platform() === 'darwin') && config.minimizedToTray;
}

global.settings = {
    version: pkgfile.version,
    ariaNgVersion: pkgfile.version,
    isDevMode: cmd.argv.development,
    useCustomAppTitle: false
};

if (!app.isPackaged) {
    global.settings.isDevMode = true;
}

if (!isRun){
    aria2c.start();
}

app.setAppUserModelId(pkgfile.appId);

if (os.platform() === 'win32' && !cmd.argv.classic) {
    global.settings.useCustomAppTitle = true;
}

if (os.platform() === 'darwin') {
    app.on('will-finish-launching', () => {
        app.on('open-file', (event, filePath) => {
            if (filePath) {
                filePathInCommandLine = filePath;
            }
        });
    });

    app.on('before-quit', () => {
        core.isConfirmExit = true;
    });

    app.on('activate', () => {
        if (core.mainWindow) {
            core.mainWindow.show();
        }
    });
}

app.on('window-all-closed', () => {
    app.quit();
});

app.on('second-instance', (event, argv, workingDirectory) => {
    if (core.mainWindow) {
        if (core.mainWindow.isMinimized()) {
            core.mainWindow.restore();
        } else if (!core.mainWindow.isVisible()) {
            core.mainWindow.show();
        }

        core.mainWindow.focus();

        if (ipc.isContainsSupportedFileArg(argv[1])) {
            ipc.asyncNewTaskFromFile(argv[1]);
            ipc.navigateToNewTask();
        }
    }
});

app.on('ready', () => {
    core.mainWindow = new BrowserWindow({
        title: 'AriaNg',
        width: config.width,
        height: config.height,
        minWidth: 800,
        minHeight: 600,
        fullscreenable: false,
        frame: !global.settings.useCustomAppTitle,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    core.mainWindow.hookWindowMessage(0x116,()=>{
        core.mainWindow.setEnabled(false);
        setTimeout(()=>{
            core.mainWindow.setEnabled(true);
        },100)
    })

    let displays = electron.screen.getAllDisplays();
    let isLastPositionInScreen = false;

    if (config.x >= 0 && config.y >= 0) {
        for (let i = 0; i < displays.length; i++) {
            let x1 = displays[i].bounds.x;
            let x2 = x1 + displays[i].workAreaSize.width;
            let y1 = displays[i].bounds.y;
            let y2 = y1 + displays[i].workAreaSize.height;

            if (config.x >= x1 && config.x <= x2 && config.y >= y1 && config.y <= y2) {
                isLastPositionInScreen = true;
                break;
            }
        }
    }

    if (config.defaultPosition === 'last-position' && isLastPositionInScreen) {
        core.mainWindow.setPosition(config.x, config.y);
    } else if (config.defaultPosition === 'screen-center') {
        core.mainWindow.center();
    }

    if (config.maximized) {
        core.mainWindow.maximize();
    }

    if (os.platform() === 'darwin') {
        electronLocalshortcut.register(core.mainWindow, 'CmdOrCtrl+Z', () => {
            core.mainWindow.webContents.undo();
        });

        electronLocalshortcut.register(core.mainWindow, 'Shift+CmdOrCtrl+Z', () => {
            core.mainWindow.webContents.redo();
        });

        electronLocalshortcut.register(core.mainWindow, 'CmdOrCtrl+X', () => {
            core.mainWindow.webContents.cut();
        });

        electronLocalshortcut.register(core.mainWindow, 'CmdOrCtrl+C', () => {
            core.mainWindow.webContents.copy();
        });

        electronLocalshortcut.register(core.mainWindow, 'CmdOrCtrl+V', () => {
            core.mainWindow.webContents.paste();
        });
    }

    electronLocalshortcut.register(core.mainWindow, 'CmdOrCtrl+A', () => {
        ipc.sendSelectAll();
    });
    // if (global.settings.isDevMode) {
        electronLocalshortcut.register(core.mainWindow, 'F12', () => {
            core.mainWindow.webContents.openDevTools();
        });
    // }

    menu.init();
    tray.init();
    float.init();

    if (ipc.isContainsSupportedFileArg(filePathInCommandLine)) {
        ipc.asyncNewTaskFromFile(filePathInCommandLine);
        ipc.loadNewTaskUrl();
    } else {
        ipc.loadIndexUrl();
    }

    core.mainWindow.once('ready-to-show', () => {
        core.mainWindow.show();
    });

    core.mainWindow.on('resize', () => {
        let sizes = core.mainWindow.getSize();
        config.width = sizes[0];
        config.height = sizes[1];
    });

    core.mainWindow.on('maximize', () => {
        config.maximized = core.mainWindow.isMaximized();
    });

    core.mainWindow.on('unmaximize', () => {
        config.maximized = core.mainWindow.isMaximized();
    });

    core.mainWindow.on('move', () => {
        let positions = core.mainWindow.getPosition();
        config.x = positions[0];
        config.y = positions[1];
    });

    core.mainWindow.on('close', (event) => {
        if (isEnableCloseToHide() && !core.isConfirmExit) {
            event.preventDefault();
            core.mainWindow.hide();
            ipc.updateContextMenu();
            event.returnValue = false;
        }
    });

    core.mainWindow.on('closed', () => {
        if (core.floatWindow && !core.floatWindow.isDestroyed() && !core.floatWindow.getParentWindow()){
            core.floatWindow.destroy();
        }
        try {
            if (!config.maximized) {
                if (config.width > 0) {
                    config.save('width');
                }

                if (config.height > 0) {
                    config.save('height');
                }

                if (config.x > 0 && config.y > 0) {
                    config.save('x');
                    config.save('y');
                }
            }

            config.save('maximized');
        } catch (ex) {
            ; // Do Nothing
        }

        core.mainWindow = null;
    });

    ipc.onNewDropFile((event, arg) => {
        if (!arg) {
            return;
        }

        let filePath = arg.filePath;
        let location = arg.location;

        if (location.indexOf('/new') === 0) {
            ipc.newTaskFromFile(filePath);
        } else {
            ipc.asyncNewTaskFromFile(filePath);
            ipc.navigateToNewTask();
        }
    });

    ipc.onNewDropText((event, arg) => {
        if (!arg) {
            return;
        }

        let text = arg.text;
        let location = arg.location;

        if (location.indexOf('/new') === 0) {
            ipc.newTaskFromText(text);
        } else {
            ipc.asyncNewTaskFromText(text);
            ipc.navigateToNewTask();
        }
    });

    ipc.onDownloadSpeed();

    ipc.onSkinCenterStatus(function () {
        if (core.themeWindow == null){
            theme.show(core.mainWindow);
        }
        else {
            theme.close();
        }
    })

    ipc.onSelectedTheme();
    ipc.onColorChange();
    ipc.onLanguageChange();
});
