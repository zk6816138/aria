(function () {
    'use strict';

    angular.module('ariaNg').factory('ariaNgNativeElectronService', ['ariaNgLocalizationService','$rootScope', function (ariaNgLocalizationService,$rootScope) {
        var electron = angular.isFunction(window.nodeRequire) ? nodeRequire('electron') : {};
        var remote = electron.remote || {
            require: function () {
                return {};
            }
        };
        var ipcRenderer = electron.ipcRenderer || {};
        var shell = electron.shell || {};
        var config = remote.require('./config') || {};
        var menu = remote.require('./menu') || {};
        var tray = remote.require('./tray') || {};
        var localfs = remote.require('./localfs') || {};
        var option = remote.require('./option') || {};
        var float = remote.require('./float') || {};
        var core = remote.require('./core') || {};
        var icon = remote.require('./icon') || {};

        var getSetting = function (item) {
            if (!remote || !remote.getGlobal) {
                return null;
            }

            var settings = remote.getGlobal('settings');

            if (!settings) {
                return null;
            }

            return settings[item];
        };

        var getCurrentWindow = function () {
            if (!remote || !remote.getCurrentWindow) {
                return {};
            }

            return remote.getCurrentWindow();
        };

        var onMainWindowEvent = function (event, callback) {
            getCurrentWindow().on && getCurrentWindow().on(event, callback);
        };

        var onMainProcessMessage = function (channel, callback) {
            ipcRenderer.on && ipcRenderer.on(channel, callback);
        };

        var removeMainProcessCallback = function (channel, callback) {
            ipcRenderer.removeListener && ipcRenderer.removeListener(channel, callback);
        };

        var sendMessageToMainProcess = function (channel, message) {
            ipcRenderer.send && ipcRenderer.send(channel, message);
        };

        return {
            writeAria2cOption: function(k,v){
                return option.write(k,v);
            },
            getRuntimeEnvironment: function () {
                if (!remote.process || !remote.process.versions) {
                    return null;
                }

                var versions = remote.process.versions;
                var items = [];

                items.push({name: 'Electron', value: versions.electron});
                items.push({name: 'Node.js', value: versions.node});
                items.push({name: 'Chrome', value: versions.chrome});
                items.push({name: 'V8', value: versions.v8});

                return items;
            },
            getVersion: function() {
                return getSetting('version');
            },
            getAriaNgVersion: function() {
                return getSetting('ariaNgVersion');
            },
            isDevMode: function () {
                return !!getSetting('isDevMode');
            },
            useCustomAppTitle: function () {
                return !!getSetting('useCustomAppTitle');
            },
            getNativeConfig: function () {
                var cfg = {};

                for (var key in config) {
                    if (!config.hasOwnProperty(key)) {
                        continue;
                    }

                    if (angular.isFunction(config[key])) {
                        continue;
                    }

                    cfg[key] = angular.copy(config[key]);
                }

                return cfg;
            },
            setDefaultPosition: function (value) {
                config.defaultPosition = value;
                config.save('defaultPosition');
            },
            setMinimizedToTray: function (value) {
                config.minimizedToTray = !!value;
                config.save('minimizedToTray');
            },
            setMainWindowLanguage: function () {
                this.setApplicationMenu();
                this.setTrayMenu();
                this.setFloatContextMenu();
            },
            isLocalFSExists: function (fullpath) {
                return localfs.isExists(fullpath);
            },
            openProjectLink: function () {
                // return shell.openExternal && shell.openExternal('https://github.com/mayswind/AriaNg-Native');
            },
            openProjectReleaseLink: function () {
                // return shell.openExternal && shell.openExternal('https://github.com/mayswind/AriaNg-Native/releases');
            },
            openFileInDirectory: function (dir, filename) {
                var fullpath = localfs.getFullPath(dir, filename);
                return shell.showItemInFolder && shell.showItemInFolder(fullpath);
            },
            onMainWindowMaximize: function (callback) {
                onMainWindowEvent('maximize', callback);
            },
            onMainWindowUnmaximize: function (callback) {
                onMainWindowEvent('unmaximize', callback);
            },
            onMainProcessNavigateTo: function (callback) {
                onMainProcessMessage('navigate-to', callback);
            },
            onMainProcessShowError: function (callback) {
                onMainProcessMessage('show-error', callback);
            },
            onMainProcessUpdateContextMenu: function(callback){
                onMainProcessMessage('update-context-menu', callback);
            },
            onMainProcessSelectAll: function(callback){
                onMainProcessMessage('select-all', callback);
            },
            onMainProcessNewTaskFromFile: function (callback) {
                onMainProcessMessage('new-task-from-file', callback);
            },
            onMainProcessNewTaskFromText: function (callback) {
                onMainProcessMessage('new-task-from-text', callback);
            },
            onMainProcessTaskState: function (callback) {
                onMainProcessMessage('task-state', callback);
            },
            onMainSelectedTheme: function (callback) {
                onMainProcessMessage('selected-theme', callback);
            },
            onMainColorChange: function (callback) {
                onMainProcessMessage('color-change', callback);
            },
            onMainThemeWindowLoaded: function (callback) {
                onMainProcessMessage('theme-window-loaded', callback);
            },
            removeMainProcessNewTaskFromFileCallback: function (callback) {
                removeMainProcessCallback('new-task-from-file', callback);
            },
            removeMainProcessNewTaskFromTextCallback: function (callback) {
                removeMainProcessCallback('new-task-from-text',  callback);
            },
            sendViewLoadedMessageToMainProcess: function (message) {
                sendMessageToMainProcess('view-content-loaded', message);
            },
            sendNewDropFileMessageToMainProcess: function (message) {
                sendMessageToMainProcess('new-drop-file', message);
            },
            sendNewDropTextMessageToMainProcess: function (message) {
                sendMessageToMainProcess('new-drop-text', message);
            },
            sendDownloadSpeedToMainProcess: function (message) {
                sendMessageToMainProcess('download-speed', message);
            },
            sendSkinCenterStatusToMainProcess: function(){
                if (core.themeWindow == null){
                    $rootScope.themeWindowLoading = true;
                }
                sendMessageToMainProcess('skin-center-status','');
            },
            sendLanguageChangeToMainProcess: function(message){
                sendMessageToMainProcess('language-change',message);
            },
            sendOpenLoginWindowToMainProcess: function(){
                sendMessageToMainProcess('open-login-window','');
            },
            onMainProcessLoginToMain: function (callback) {
                onMainProcessMessage('login-to-main', callback);
            },
            sendMainToLoginToMainProcess: function(message){
                sendMessageToMainProcess('main-to-login',message);
            },
            setApplicationMenu: function () {
                if (menu.setApplicationMenu) {
                    menu.setApplicationMenu({
                        labels: {
                            Quit: ariaNgLocalizationService.getLocalizedText('menu.Quit')
                        }
                    });
                }
            },
            setTrayMenu: function () {
                if (tray.setContextMenu) {
                    tray.setContextMenu({
                        labels: {
                            ShowAriaNgNative: ariaNgLocalizationService.getLocalizedText(core.mainWindow.isVisible()?'tray.HideAriaNgNative':'tray.ShowAriaNgNative'),
                            ShowFloatWindow: ariaNgLocalizationService.getLocalizedText(config.showFloat?'tray.HideFloatWindow':'tray.ShowFloatWindow'),
                            StartAllTask: ariaNgLocalizationService.getLocalizedText('tray.StartAllTask'),
                            StopAllTask: ariaNgLocalizationService.getLocalizedText('tray.StopAllTask'),
                            Exit: ariaNgLocalizationService.getLocalizedText('tray.Exit')
                        }
                    });
                }
            },
            setFloatContextMenu: function () {
                if (float.setFloatContextMenu) {
                    float.setFloatContextMenu({
                        labels: {
                            ShowAriaNgNative: ariaNgLocalizationService.getLocalizedText(core.mainWindow.isVisible()?'tray.HideAriaNgNative':'tray.ShowAriaNgNative'),
                            ShowFloatWindow: ariaNgLocalizationService.getLocalizedText(config.showFloat?'tray.HideFloatWindow':'tray.ShowFloatWindow'),
                            StartAllTask: ariaNgLocalizationService.getLocalizedText('tray.StartAllTask'),
                            StopAllTask: ariaNgLocalizationService.getLocalizedText('tray.StopAllTask'),
                            Exit: ariaNgLocalizationService.getLocalizedText('tray.Exit')
                        }
                    });
                }
            },
            setTrayToolTip: function (value) {
                if (tray.setToolTip) {
                    tray.setToolTip(value);
                }
            },
            reload: function () {
                getCurrentWindow().reload && getCurrentWindow().reload();
            },
            isMaximized: function () {
                return getCurrentWindow().isMaximized && getCurrentWindow().isMaximized();
            },
            minimizeWindow: function () {
                getCurrentWindow().minimize && getCurrentWindow().minimize();
            },
            maximizeOrRestoreWindow: function () {
                if (!this.isMaximized()) {
                    getCurrentWindow().maximize && getCurrentWindow().maximize();
                } else {
                    getCurrentWindow().unmaximize && getCurrentWindow().unmaximize();
                }
            },
            exitApp: function () {
                getCurrentWindow().close && getCurrentWindow().close();
            },
            getFileIcon: function (fileName) {
                var arr = fileName.split('.');
                var ext = arr[arr.length-1].trim();

                var iconPath = icon.getSavePath(ext);
                if (localfs.isExists(iconPath)){
                    return iconPath;
                }
                else {
                    return new Promise(function (resolve) {
                        icon.getFileIcon(ext,function (res) {
                            if (res){
                                resolve(res);
                            }
                            else {
                                resolve('../assets/default_icon.png')
                            }
                        })
                    })
                }
            },
            getCustomColors: function () {
                return config.getCustomColors();
            }
        };
    }]);
}());
