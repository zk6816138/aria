(function () {
    'use strict';

    angular.module('ariaNg').controller('MainController', ['$rootScope', '$scope', '$route', '$window', '$location', '$document', '$interval', 'clipboard', 'aria2RpcErrors', 'ariaNgCommonService', 'ariaNgNotificationService', 'ariaNgLocalizationService', 'ariaNgSettingService', 'ariaNgMonitorService', 'ariaNgTitleService', 'aria2TaskService', 'aria2SettingService', 'ariaNgNativeElectronService','$filter','$user', '$timeout', function ($rootScope, $scope, $route, $window, $location, $document, $interval, clipboard, aria2RpcErrors, ariaNgCommonService, ariaNgNotificationService, ariaNgLocalizationService, ariaNgSettingService, ariaNgMonitorService, ariaNgTitleService, aria2TaskService, aria2SettingService, ariaNgNativeElectronService,$filter,$user,$timeout) {
        var pageTitleRefreshPromise = null;
        var globalStatRefreshPromise = null;

        var refreshPageTitle = function () {
            var title = ariaNgTitleService.getFinalTitleByGlobalStat({
                globalStat: $scope.globalStat,
                currentRpcProfile: getCurrentRPCProfile()
            });

            $document[0].title = title;
            ariaNgNativeElectronService.setTrayToolTip(title);
        };

        var refreshGlobalStat = function (silent, callback) {
            return aria2SettingService.getGlobalStat(function (response) {
                if (!response.success && response.data.message === aria2RpcErrors.Unauthorized.message) {
                    $interval.cancel(globalStatRefreshPromise);
                    return;
                }

                if (response.success) {
                    $scope.globalStat = response.data;
                    var sendData = {
                        downloadSpeed: $filter('readableVolume')($scope.globalStat.downloadSpeed)+'/s',
                        uploadSpeed: $filter('readableVolume')($scope.globalStat.uploadSpeed)+'/s',
                        numActive: $scope.globalStat.numActive,
                        originalSpeed: $scope.globalStat.downloadSpeed
                    }
                    ariaNgNativeElectronService.sendDownloadSpeedToMainProcess(sendData);
                    ariaNgMonitorService.recordGlobalStat(response.data);
                }

                if (callback) {
                    callback(response);
                }
            }, silent);
        };

        var getCurrentRPCProfile = function () {
            if (!$scope.rpcSettings || $scope.rpcSettings.length < 1) {
                return null;
            }

            for (var i = 0; i < $scope.rpcSettings.length; i++) {
                var rpcSetting = $scope.rpcSettings[i];
                if (rpcSetting.isDefault) {
                    return rpcSetting;
                }
            }

            return null;
        };

        if (ariaNgSettingService.getBrowserNotification()) {
            ariaNgNotificationService.requestBrowserPermission();
        }

        $scope.ariaNgVersion = ariaNgNativeElectronService.getVersion();

        $scope.globalStatusContext = {
            isEnabled: ariaNgSettingService.getGlobalStatRefreshInterval() > 0,
            data: ariaNgMonitorService.getGlobalStatsData()
        };

        $scope.enableDebugMode = function () {
            return ariaNgSettingService.isEnableDebugMode();
        };

        $scope.quickSettingContext = null;

        $scope.rpcSettings = ariaNgSettingService.getAllRpcSettings();
        $scope.currentRpcProfile = getCurrentRPCProfile();
        $scope.isCurrentRpcUseWebSocket = ariaNgSettingService.isCurrentRpcUseWebSocket();

        $scope.isTaskSelected = function () {
            return $rootScope.taskContext.getSelectedTaskIds().length > 0;
        };

        $scope.isSelectedTasksAllHaveUrl = function () {
            var selectedTasks = $rootScope.taskContext.getSelectedTasks();

            if (selectedTasks.length < 1) {
                return false;
            }

            for (var i = 0; i < selectedTasks.length; i++) {
                if (!selectedTasks[i].singleUrl) {
                    return false;
                }
            }

            return true;
        };

        $scope.isSelectedTasksAllHaveInfoHash = function () {
            var selectedTasks = $rootScope.taskContext.getSelectedTasks();

            if (selectedTasks.length < 1) {
                return false;
            }

            for (var i = 0; i < selectedTasks.length; i++) {
                if (!selectedTasks[i].bittorrent || !selectedTasks[i].infoHash) {
                    return false;
                }
            }

            return true;
        };

        $scope.isSpecifiedTaskSelected = function () {
            var selectedTasks = $rootScope.taskContext.getSelectedTasks();

            if (selectedTasks.length < 1) {
                return false;
            }

            for (var i = 0; i < selectedTasks.length; i++) {
                for (var j = 0; j < arguments.length; j++) {
                    if (selectedTasks[i].status === arguments[j]) {
                        return true;
                    }
                }
            }

            return false;
        };

        $scope.isSpecifiedTaskShowing = function () {
            var tasks = $rootScope.taskContext.list;

            if (tasks.length < 1) {
                return false;
            }

            for (var i = 0; i < tasks.length; i++) {
                for (var j = 0; j < arguments.length; j++) {
                    if (tasks[i].status === arguments[j]) {
                        return true;
                    }
                }
            }

            return false;
        };

        $scope.changeTasksState = function (state) {
            var gids = $rootScope.taskContext.getSelectedTaskIds();

            if (!gids || gids.length < 1) {
                return;
            }

            var invoke = null;

            if (state === 'start') {
                invoke = aria2TaskService.startTasks;
            } else if (state === 'pause') {
                invoke = aria2TaskService.pauseTasks;
            } else {
                return;
            }

            $rootScope.loadPromise = invoke(gids, function (response) {
                if (response.hasError && gids.length > 1) {
                    ariaNgLocalizationService.showError('Failed to change some tasks state.');
                }

                if (!response.hasSuccess) {
                    return;
                }

                refreshGlobalStat(true);

                if (!response.hasError && state === 'start') {
                    if ($location.path() === '/waiting') {
                        $location.path('/downloading');
                    } else {
                        $route.reload();
                    }
                } else if (!response.hasError && state === 'pause') {
                    if ($location.path() === '/downloading') {
                        $location.path('/waiting');
                    } else {
                        $route.reload();
                    }
                }
            }, (gids.length > 1));
        };

        ariaNgNativeElectronService.onMainProcessTaskState(function (e, arg) {
            var type = arg == 'start' ? 'waiting' : 'downloading';
            return  aria2TaskService.getTaskList(type,false, function (resp) {
                var selected = {};
                resp.data.forEach((item)=>{
                    if (item.status!='waiting'){
                        selected[item.gid] = true;
                    }
                })
                $rootScope.taskContext.selected = selected;
                $scope.changeTasksState(arg);
            },true)
        });

        $scope.retryTask = function (task) {
            ariaNgLocalizationService.confirm('Confirm Retry', 'Are you sure you want to retry the selected task? AriaNg will create same task after clicking OK.', 'info', function () {
                $rootScope.loadPromise = aria2TaskService.retryTask(task.gid, function (response) {
                    if (!response.success) {
                        ariaNgLocalizationService.showError('Failed to retry this task.');
                        return;
                    }

                    refreshGlobalStat(true);

                    var actionAfterRetryingTask = ariaNgSettingService.getAfterRetryingTask();

                    if (response.success && response.data) {
                        if (actionAfterRetryingTask === 'task-list-downloading') {
                            if ($location.path() !== '/downloading') {
                                $location.path('/downloading');
                            } else {
                                $route.reload();
                            }
                        } else if (actionAfterRetryingTask === 'task-detail') {
                            $location.path('/task/detail/' + response.data);
                        } else {
                            $route.reload();
                        }
                    }
                }, false);
            });
        };

        $scope.hasRetryableTask = function () {
            return $rootScope.taskContext.hasRetryableTask();
        };

        $scope.hasCompletedTask = function () {
            return $rootScope.taskContext.hasCompletedTask();
        };

        $scope.isSelectedTaskRetryable = function () {
            var selectedTasks = $rootScope.taskContext.getSelectedTasks();

            if (selectedTasks.length < 1) {
                return false;
            }

            for (var i = 0; i < selectedTasks.length; i++) {
                if (!$rootScope.isTaskRetryable(selectedTasks[i])) {
                    return false;
                }
            }

            return true;
        };

        $scope.isOpenTaskDir = function(){
            var location = $location.path().substring(1);
            if (location=='stopped' && !$scope.isSelectedTaskRetryable()){
                return true;
            }
            return false;
        }

        $scope.openTasksDir = function(){
            var tasks = $rootScope.taskContext.getSelectedTasks();
            ariaNgNativeElectronService.openFileInDirectory(tasks[0].files[0].path, '');
        }

        $scope.retryTasks = function () {
            var tasks = $rootScope.taskContext.getSelectedTasks();

            if (!tasks || tasks.length < 1) {
                return;
            } else if (tasks.length === 1) {
                return $scope.retryTask(tasks[0]);
            }

            var retryableTasks = [];
            var skipCount = 0;

            for (var i = 0; i < tasks.length; i++) {
                if ($rootScope.isTaskRetryable(tasks[i])) {
                    retryableTasks.push(tasks[i]);
                } else {
                    skipCount++;
                }
            }

            ariaNgLocalizationService.confirm('Confirm Retry', 'Are you sure you want to retry the selected task? AriaNg will create same task after clicking OK.', 'info', function () {
                $rootScope.loadPromise = aria2TaskService.retryTasks(retryableTasks, function (response) {
                    refreshGlobalStat(true);

                    ariaNgLocalizationService.showInfo('Operation Result', '{{successCount}} tasks have been retried and {{failedCount}} tasks are failed.', function () {
                        var actionAfterRetryingTask = ariaNgSettingService.getAfterRetryingTask();

                        if (response.hasSuccess) {
                            if (actionAfterRetryingTask === 'task-list-downloading') {
                                if ($location.path() !== '/downloading') {
                                    $location.path('/downloading');
                                } else {
                                    $route.reload();
                                }
                            } else {
                                $route.reload();
                            }
                        }
                    }, {
                        textParams: {
                            successCount: response.successCount,
                            failedCount: response.failedCount,
                            skipCount: skipCount
                        }
                    });
                }, false);
            }, true);
        };

        $scope.removeTasks = function () {
            var tasks = $rootScope.taskContext.getSelectedTasks();

            if (!tasks || tasks.length < 1) {
                return;
            }

            var removeTasks = function () {
                $rootScope.loadPromise = aria2TaskService.removeTasks(tasks, function (response) {
                    if (response.hasError && tasks.length > 1) {
                        ariaNgLocalizationService.showError('Failed to remove some task(s).');
                    }

                    if (!response.hasSuccess) {
                        return;
                    }

                    refreshGlobalStat(true);

                    if (!response.hasError) {
                        if ($location.path() !== '/stopped') {
                            $location.path('/stopped');
                        } else {
                            $route.reload();
                        }
                    }
                }, (tasks.length > 1));
            };

            if (ariaNgSettingService.getConfirmTaskRemoval()) {
                ariaNgLocalizationService.confirm('Confirm Remove', 'Are you sure you want to remove the selected task?', 'warning', removeTasks);
            } else {
                removeTasks();
            };
        };

        $scope.clearStoppedTasks = function () {
            ariaNgLocalizationService.confirm('Confirm Clear', 'Are you sure you want to clear stopped tasks?', 'warning', function () {
                $rootScope.loadPromise = aria2TaskService.clearStoppedTasks(function (response) {
                    if (!response.success) {
                        return;
                    }

                    refreshGlobalStat(true);

                    if ($location.path() !== '/stopped') {
                        $location.path('/stopped');
                    } else {
                        $route.reload();
                    }
                });
            });
        };

        $scope.isAllTasksSelected = function () {
            return $rootScope.taskContext.isAllSelected();
        };

        $scope.selectAllTasks = function () {
            $rootScope.taskContext.selectAll();
        };

        $scope.selectAllFailedTasks = function () {
            $rootScope.taskContext.selectAllFailed();
        };

        $scope.selectAllCompletedTasks = function () {
            $rootScope.taskContext.selectAllCompleted();
        };

        $scope.copySelectedTasksDownloadLink = function () {
            var selectedTasks = $rootScope.taskContext.getSelectedTasks();
            var result = '';

            for (var i = 0; i < selectedTasks.length; i++) {
                if (i > 0) {
                    result += '\n';
                }

                result += selectedTasks[i].singleUrl;
            }

            if (result.length > 0) {
                clipboard.copyText(result);
            }
        };

        $scope.copySelectedTasksMagnetLink = function () {
            var selectedTasks = $rootScope.taskContext.getSelectedTasks();
            var result = '';

            for (var i = 0; i < selectedTasks.length; i++) {
                if (i > 0) {
                    result += '\n';
                }

                result += 'magnet:?xt=urn:btih:' + selectedTasks[i].infoHash;
            }

            if (result.length > 0) {
                clipboard.copyText(result);
            }
        };

        $scope.changeDisplayOrder = function (type, autoSetReverse) {
            var oldType = ariaNgCommonService.parseOrderType(ariaNgSettingService.getDisplayOrder());
            var newType = ariaNgCommonService.parseOrderType(type);

            if (autoSetReverse && newType.type === oldType.type) {
                newType.reverse = !oldType.reverse;
            }

            ariaNgSettingService.setDisplayOrder(newType.getValue());
        };

        $scope.isSetDisplayOrder = function (type) {
            var orderType = ariaNgCommonService.parseOrderType(ariaNgSettingService.getDisplayOrder());
            var targetType = ariaNgCommonService.parseOrderType(type);

            return orderType.equals(targetType);
        };

        $scope.showQuickSettingDialog = function (type, title) {
            $scope.quickSettingContext = {
                type: type,
                title: title
            };
        };

        $scope.switchRpcSetting = function (setting) {
            if (setting.isDefault) {
                return;
            }

            ariaNgSettingService.setDefaultRpcSetting(setting);
            $window.location.reload();
        };

        $scope.minimizeWindow = function () {
            ariaNgNativeElectronService.minimizeWindow();
        };

        $scope.skinCenter = function(){
            ariaNgNativeElectronService.sendSkinCenterStatusToMainProcess()
        }

        $scope.maximizeOrRestoreWindow = function () {
            ariaNgNativeElectronService.maximizeOrRestoreWindow();
        };

        $scope.exitApp = function () {
            ariaNgNativeElectronService.exitApp();
        };

        $scope.openProjectLink = function () {
            ariaNgNativeElectronService.openProjectLink();
        };

        if (ariaNgSettingService.getTitleRefreshInterval() > 0) {
            pageTitleRefreshPromise = $interval(function () {
                refreshPageTitle();
            }, ariaNgSettingService.getTitleRefreshInterval());
        }

        if (ariaNgSettingService.getGlobalStatRefreshInterval() > 0) {
            globalStatRefreshPromise = $interval(function () {
                refreshGlobalStat(true);
            }, ariaNgSettingService.getGlobalStatRefreshInterval());
        }

        $scope.$on('$destroy', function () {
            if (pageTitleRefreshPromise) {
                $interval.cancel(pageTitleRefreshPromise);
            }

            if (globalStatRefreshPromise) {
                $interval.cancel(globalStatRefreshPromise);
            }
        });

        refreshGlobalStat(true, function () {
            refreshPageTitle();
        });

        //自动登录
        var token = $user.userInfo('token');
        var autoLogin = $user.userInfo('autoLogin');
        if (token && autoLogin){
            //todo 验证token,获取登录状态,判断是否为自动登录
            $timeout(function (){
                ariaNgNativeElectronService.sendMainToLoginToMainProcess('auto-login');
            },1500)
        }

        //打开登录窗口
        $scope.openLoginWindow = function () {
            if ($rootScope.loginStatus == 'Not Logged') {
                ariaNgNativeElectronService.sendMainToLoginToMainProcess('login-window=show');
            }
            else if ($rootScope.loginStatus == 'Logged') {//点击头像,更换头像
                $user.chooseImage().then(function (resp) {
                    ariaNgNativeElectronService.sendMainToAvatarToMainProcess({type:'avatar-window=show',data: resp});
                })
            }
        }

        //取消登录
        $scope.cancelLogin = function (){
            $rootScope.loginStatus = 'Not Logged';
            ariaNgNativeElectronService.sendMainToLoginToMainProcess('cancelLogin');
        }

        //切换账号
        $scope.switchAccount = function(){
            $rootScope.loginStatus = 'Not Logged';
            $user.isSwitchAccount(true);
            ariaNgNativeElectronService.sendMainToLoginToMainProcess('login-window=show');
        }

        //退出登录
        $scope.logout = function(){
            $rootScope.loginStatus = 'Not Logged';
            $user.http({
                url: 'user/logout',
                method: 'post',
                data: {token:$user.userInfo('token')}
            }).then(function (resp) {
                if (resp.code == 500){
                    ariaNgLocalizationService.notifyInPage(resp.msg,'',{type: 'error',delay: 5000});
                }
                else if (resp.code == 0){
                    $user.userInfo('account','');
                    $user.userInfo('pwdLength','');
                    $user.userInfo('token','');
                }
            })
        }

        //接受主进程发送的登录窗口消息
        ariaNgNativeElectronService.onMainProcessLoginToMain(function (e, resp) {
            if (resp.indexOf('login-status') == 0){
                $rootScope.loginStatus = resp.split('=')[1];
                if ($rootScope.loginStatus == 'Logged'){
                    $scope.account = $user.userInfo('account');
                    $scope.avatar = ['male.png','female.png'].indexOf($user.userInfo('avatar')) >=0 ? ('../assets/user/'+ $user.userInfo('avatar')) : ($user.getImgUrl() + $user.userInfo('avatar'));
                    $scope.lastLoginTime = $user.userInfo('last_login_time');
                }
                $rootScope.$apply();
            }
            else if (resp.indexOf('login-message:=') == 0){
                ariaNgLocalizationService.notifyInPage(resp.split(':=')[1],'',{type: 'error',delay: 5000});
            }
            else if (resp == 'isSwitchAccount' && $rootScope.loginStatus != 'Logged'){
                $rootScope.loginStatus = 'Logged';
                $rootScope.$apply();
            }
        })

        //接受头像窗口消息
        ariaNgNativeElectronService.onMainProcessAvatarToMain(function (e, resp) {
            if (resp.type.indexOf('message-') == 0){
                ariaNgLocalizationService.notifyInPage(resp.data,'',{type: resp.type.split('-')[1],delay: 5000});
            }
            else if (resp.type == 'upload-success'){
                $scope.avatar = $user.getImgUrl() + $user.userInfo('avatar');
            }
        })

    }]);
}());
