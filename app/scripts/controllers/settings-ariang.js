(function () {
    'use strict';

    angular.module('ariaNg').controller('AriaNgSettingsController', ['$rootScope', '$scope', '$routeParams', '$window', '$interval', '$timeout', '$filter', 'clipboard', 'ariaNgLanguages', 'ariaNgCommonService', 'ariaNgNotificationService', 'ariaNgLocalizationService', 'ariaNgLogService', 'ariaNgFileService', 'ariaNgSettingService', 'ariaNgMonitorService', 'ariaNgTitleService', 'aria2SettingService', 'ariaNgVersionService', 'ariaNgNativeElectronService', function ($rootScope, $scope, $routeParams, $window, $interval, $timeout, $filter, clipboard, ariaNgLanguages, ariaNgCommonService, ariaNgNotificationService, ariaNgLocalizationService, ariaNgLogService, ariaNgFileService, ariaNgSettingService, ariaNgMonitorService, ariaNgTitleService, aria2SettingService, ariaNgVersionService, ariaNgNativeElectronService) {
        var extendType = $routeParams.extendType;
        var lastRefreshPageNotification = null;

        var getFinalTitle = function () {
            return ariaNgTitleService.getFinalTitleByGlobalStat({
                globalStat: ariaNgMonitorService.getCurrentGlobalStat(),
                currentRpcProfile: getCurrentRPCProfile()
            });
        };

        var getCurrentRPCProfile = function () {
            if (!$scope.context || !$scope.context.rpcSettings || $scope.context.rpcSettings.length < 1) {
                return null;
            }

            for (var i = 0; i < $scope.context.rpcSettings.length; i++) {
                var rpcSetting = $scope.context.rpcSettings[i];
                if (rpcSetting.isDefault) {
                    return rpcSetting;
                }
            }

            return null;
        };

        var getNativeSettings = function () {
            var originalConfig = ariaNgNativeElectronService.getNativeConfig();
            var config = {};

            config.defaultPosition = originalConfig.defaultPosition || 'last-position';

            if (!originalConfig.minimizedToTray) {
                config.afterMainWindowClosed = 'exit-application';
            } else {
                config.afterMainWindowClosed = 'minimize-to-tray';
            }

            return config;
        };

        var setNeedRefreshPage = function () {
            if (lastRefreshPageNotification) {
                return;
            }

            lastRefreshPageNotification = ariaNgLocalizationService.notifyInPage('', 'Configuration has been modified, please reload the page for the changes to take effect.', {
                delay: false,
                type: 'info',
                templateUrl: 'views/notification-reloadable.html',
                onClose: function () {
                    lastRefreshPageNotification = null;
                }
            });
        };

        $scope.context = {
            currentTab: 'global',
            ariaNgNativeVersion: ariaNgNativeElectronService.getVersion(),
            ariaNgVersion: ariaNgNativeElectronService.getAriaNgVersion(),
            isCurrentLatestVersion: false,
            runtimeEnvironment: ariaNgNativeElectronService.getRuntimeEnvironment(),
            runtimeEnvironmentCollapsed: true,
            languages: ariaNgLanguages,
            titlePreview: getFinalTitle(),
            availableTime: ariaNgCommonService.getTimeOptions([1000, 2000, 3000, 5000, 10000, 30000, 60000], true),
            trueFalseOptions: [{name: 'Enabled', value: true}, {name: 'Disabled', value: false}],
            showRpcSecret: false,
            isInsecureProtocolDisabled: ariaNgSettingService.isInsecureProtocolDisabled(),
            settings: ariaNgSettingService.getAllOptions(),
            nativeSettings: getNativeSettings(),
            sessionSettings: ariaNgSettingService.getAllSessionOptions(),
            rpcSettings: ariaNgSettingService.getAllRpcSettings(),
            isSupportBlob: ariaNgFileService.isSupportBlob(),
            importSettings: null,
            exportSettings: null,
            exportSettingsCopied: false
        };

        $scope.context.titlePreview = getFinalTitle();
        $scope.context.showDebugMode = $scope.context.sessionSettings.debugMode || extendType === 'debug';

        $scope.changeGlobalTab = function () {
            $scope.context.currentTab = 'global';
            $rootScope.simulateScrollReload();
        };

        $scope.isCurrentGlobalTab = function () {
            return $scope.context.currentTab === 'global';
        };

        $scope.changeRpcTab = function (rpcIndex) {
            $scope.context.currentTab = 'rpc' + rpcIndex;
            $rootScope.simulateScrollReload();
        };

        $scope.isCurrentRpcTab = function (rpcIndex) {
            return $scope.context.currentTab === 'rpc' + rpcIndex;
        };

        $scope.getCurrentRpcTabIndex = function () {
            if ($scope.isCurrentGlobalTab()) {
                return -1;
            }

            return parseInt($scope.context.currentTab.substring(3));
        };

        $scope.checkUpdate = function () {
            return ariaNgVersionService.getTheLatestVersion()
                .then(function onSuccess(response) {
                    if (!response || !response.data || !response.data.tag_name) {
                        ariaNgLogService.warn('[AriaNgSettingsController.checkUpdate] data format of latest version is invalid', response);
                        ariaNgLocalizationService.showError('Failed to get latest version!');
                        return;
                    }

                    var latestVersion = response.data.tag_name;

                    if (ariaNgVersionService.compareVersion($scope.context.ariaNgNativeVersion, latestVersion) >= 0) {
                        ariaNgLocalizationService.showInfo('Check Update', 'You have installed the latest version!');
                        $scope.context.isCurrentLatestVersion = true;
                    } else {
                        ariaNgNativeElectronService.openProjectReleaseLink();
                    }
                }).catch(function onError(response) {
                    ariaNgLogService.error('[AriaNgSettingsController.checkUpdate] failed to get latest version', response);
                    ariaNgLocalizationService.showError('Failed to get latest version!');
                });
        };

        $scope.updateTitlePreview = function () {
            $scope.context.titlePreview = getFinalTitle();
        };

        $rootScope.swipeActions.extentLeftSwipe = function () {
            var tabIndex = -1;

            if (!$scope.isCurrentGlobalTab()) {
                tabIndex = parseInt($scope.getCurrentRpcTabIndex());
            }

            if (tabIndex < $scope.context.rpcSettings.length - 1) {
                $scope.changeRpcTab(tabIndex + 1);
                return true;
            } else {
                return false;
            }
        };

        $rootScope.swipeActions.extentRightSwipe = function () {
            var tabIndex = -1;

            if (!$scope.isCurrentGlobalTab()) {
                tabIndex = parseInt($scope.getCurrentRpcTabIndex());
            }

            if (tabIndex > 0) {
                $scope.changeRpcTab(tabIndex - 1);
                return true;
            } else if (tabIndex === 0) {
                $scope.changeGlobalTab();
                return true;
            } else {
                return false;
            }
        };

        $scope.isSupportNotification = function () {
            return ariaNgNotificationService.isSupportBrowserNotification() &&
                ariaNgSettingService.isCurrentRpcUseWebSocket($scope.context.settings.protocol);
        };

        $scope.setLanguage = function (value) {
            if (ariaNgSettingService.setLanguage(value)) {
                ariaNgLocalizationService.applyLanguage(value);
            }
            ariaNgNativeElectronService.sendLanguageChangeToMainProcess(value);
            $scope.updateTitlePreview();
        };

        $scope.setDebugMode = function (value) {
            ariaNgSettingService.setDebugMode(value);
        };

        $scope.setTitle = function (value) {
            ariaNgSettingService.setTitle(value);
        };

        $scope.setEnableBrowserNotification = function (value) {
            ariaNgSettingService.setBrowserNotification(value);

            if (value && !ariaNgNotificationService.hasBrowserPermission()) {
                ariaNgNotificationService.requestBrowserPermission(function (result) {
                    if (!result.granted) {
                        $scope.context.settings.browserNotification = false;
                        ariaNgLocalizationService.showError('You have disabled notification in your browser. You should change your browser\'s settings before you enable this function.');
                    }
                });
            }
        };

        $scope.setTitleRefreshInterval = function (value) {
            setNeedRefreshPage();
            ariaNgSettingService.setTitleRefreshInterval(value);
        };

        $scope.setGlobalStatRefreshInterval = function (value) {
            setNeedRefreshPage();
            ariaNgSettingService.setGlobalStatRefreshInterval(value);
        };

        $scope.setDownloadTaskRefreshInterval = function (value) {
            setNeedRefreshPage();
            ariaNgSettingService.setDownloadTaskRefreshInterval(value);
        };

        $scope.setRPCListDisplayOrder = function (value) {
            setNeedRefreshPage();
            ariaNgSettingService.setRPCListDisplayOrder(value);
        };

        $scope.setAfterCreatingNewTask = function (value) {
            ariaNgSettingService.setAfterCreatingNewTask(value);
        };

        $scope.setRemoveOldTaskAfterRetrying = function (value) {
            ariaNgSettingService.setRemoveOldTaskAfterRetrying(value);
        };

        $scope.setConfirmTaskRemoval = function (value) {
            ariaNgSettingService.setConfirmTaskRemoval(value);
        };

        $scope.setIncludePrefixWhenCopyingFromTaskDetails = function (value) {
            ariaNgSettingService.setIncludePrefixWhenCopyingFromTaskDetails(value);
        };

        $scope.setAfterRetryingTask = function (value) {
            ariaNgSettingService.setAfterRetryingTask(value);
        };

        $scope.setDefaultPosition = function (value) {
            ariaNgNativeElectronService.setDefaultPosition(value);
        }

        $scope.setAfterMainWindowClosed = function (value) {
            if (value === 'minimize-to-tray') {
                ariaNgNativeElectronService.setMinimizedToTray(true);
            } else if (value === 'exit-application') {
                ariaNgNativeElectronService.setMinimizedToTray(false);
            }
        };

        $scope.showImportSettingsModal = function () {
            $scope.context.importSettings = null;
            angular.element('#import-settings-modal').modal();
        };

        $('#import-settings-modal').on('hide.bs.modal', function (e) {
            $scope.context.importSettings = null;
        });

        $scope.openAriaNgConfigFile = function () {
            ariaNgFileService.openFileContent({
                scope: $scope,
                fileFilter: '.json',
                fileType: 'text'
            }, function (result) {
                $scope.context.importSettings = result.content;
            }, function (error) {
                ariaNgLocalizationService.showError(error);
            }, angular.element('#import-file-holder'));
        };

        $scope.importSettings = function (settings) {
            var settingsObj = null;

            try {
                settingsObj = JSON.parse(settings);
            } catch (e) {
                ariaNgLogService.error('[AriaNgSettingsController.importSettings] parse settings json error', e);
                ariaNgLocalizationService.showError('Invalid settings data format!');
                return;
            }

            if (!angular.isObject(settingsObj) || angular.isArray(settingsObj)) {
                ariaNgLogService.error('[AriaNgSettingsController.importSettings] settings json is not object');
                ariaNgLocalizationService.showError('Invalid settings data format!');
                return;
            }

            if (settingsObj) {
                ariaNgLocalizationService.confirm('Confirm Import', 'Are you sure you want to import all settings?', 'warning', function () {
                    ariaNgSettingService.importAllOptions(settingsObj);
                    $window.location.reload();
                });
            }
        };

        $scope.showExportSettingsModal = function () {
            $scope.context.exportSettings = $filter('json')(ariaNgSettingService.exportAllOptions());
            $scope.context.exportSettingsCopied = false;
            angular.element('#export-settings-modal').modal();
        };

        $('#export-settings-modal').on('hide.bs.modal', function (e) {
            $scope.context.exportSettings = null;
            $scope.context.exportSettingsCopied = false;
        });

        $scope.copyExportSettings = function () {
            clipboard.copyText($scope.context.exportSettings, {
                container: angular.element('#export-settings-modal')[0]
            });
            $scope.context.exportSettingsCopied = true;
        };

        $scope.addNewRpcSetting = function () {
            setNeedRefreshPage();

            var newRpcSetting = ariaNgSettingService.addNewRpcSetting();
            $scope.context.rpcSettings.push(newRpcSetting);

            $scope.changeRpcTab($scope.context.rpcSettings.length - 1);
        };

        $scope.updateRpcSetting = function (setting, field) {
            setNeedRefreshPage();
            ariaNgSettingService.updateRpcSetting(setting, field);
        };

        $scope.removeRpcSetting = function (setting) {
            var rpcName = (setting.rpcAlias ? setting.rpcAlias : setting.rpcHost + ':' + setting.rpcPort);

            ariaNgLocalizationService.confirm('Confirm Remove', 'Are you sure you want to remove rpc setting "{{rpcName}}"?', 'warning', function () {
                setNeedRefreshPage();

                var currentIndex = $scope.getCurrentRpcTabIndex();
                var index = $scope.context.rpcSettings.indexOf(setting);
                ariaNgSettingService.removeRpcSetting(setting);
                $scope.context.rpcSettings.splice(index, 1);

                if (currentIndex >= $scope.context.rpcSettings.length) {
                    $scope.changeRpcTab($scope.context.rpcSettings.length - 1);
                } else if (currentIndex <= 0 || currentIndex <= index) {
                    ; // Do Nothing
                } else { // currentIndex > index
                    $scope.changeRpcTab(currentIndex - 1);
                }
            }, false, {
                textParams: {
                    rpcName: rpcName
                }
            });
        };

        $scope.setDefaultRpcSetting = function (setting) {
            if (setting.isDefault) {
                return;
            }

            ariaNgSettingService.setDefaultRpcSetting(setting);
            $window.location.reload();
        };

        $scope.resetSettings = function () {
            ariaNgLocalizationService.confirm('Confirm Reset', 'Are you sure you want to reset all settings?', 'warning', function () {
                ariaNgSettingService.resetSettings();
                $window.location.reload();
            });
        };

        $scope.clearHistory = function () {
            ariaNgLocalizationService.confirm('Confirm Clear', 'Are you sure you want to clear all settings history?', 'warning', function () {
                aria2SettingService.clearSettingsHistorys();
                $window.location.reload();
            });
        };

        $scope.reloadApp = function () {
            ariaNgNativeElectronService.reload();
        };

        angular.element('[data-toggle="popover"]').popover();

        $rootScope.loadPromise = $timeout(function () {}, 100);
    }]);
}());
