var electron = nodeRequire('electron');
var remote = electron.remote;
var app = angular.module('loginWindow',['validFormModule','pascalprecht.translate','userModule'])

    .controller('loginCtrl',function ($scope, $timeout,$translate,$user) {
        var options = JSON.parse(localStorage.getItem('AriaNg.Options'));
        $scope.currentLanguage = options ? options.language : 'zh_Hans';
        $translate.use($scope.currentLanguage);

        var ipcRenderer = electron.ipcRenderer;
        var config = remote.require('./config');
        var core = remote.require('./core');

        $scope.tabIndex = 0;
        $scope.rememberPassword =  $user.userInfo('rememberPassword') ? 1 : 0;
        $scope.autoLogin =  $user.userInfo('autoLogin') ? 1 : 0;
        $scope.isCancelLogin = false;

        $scope.loginData = {account:'',password:''};
        $scope.registerData = {account:'',password:'',confirmPassword:''};

        core.loginWindow.on('show', () => {
            initForm();
            $scope.$apply();
        })

        var initForm = function () {
            if (!!$scope.rememberPassword && !!$user.userInfo('account') && !!$user.userInfo('pwdLength')) {
                $scope.loginData.account = $user.userInfo('account');
                $scope.loginData.password = '*'.padStart($user.userInfo('pwdLength'),'*');
                $scope.avatar = $user.getImgUrl() + $user.userInfo('avatar');
            }
            else {
                $scope.rememberPassword = $scope.autoLogin = 0;
                $user.userInfo('rememberPassword', 0);
                $user.userInfo('autoLogin', 0);
                $scope.avatar = '../assets/user/avatar_hover.png';
            }
            angular.element('#login-account').focus();
        }

        initForm();

        var message = function(msg){
            ipcRenderer.send('login-to-main', `login-message:=${msg}`);
        }

        $scope.loginOption = function (type) {
            $scope[type] = $scope[type] === 0 ? 1 : 0;
            if (type == 'rememberPassword' && $scope[type] === 0) {
                $scope.autoLogin = 0;
                $user.userInfo('autoLogin', 0);
            }

            if (type == 'autoLogin' && $scope[type] === 1) {
                $scope.rememberPassword = 1;
                $user.userInfo('rememberPassword', 1);
            }

            $user.userInfo(type, $scope[type]);
        }

        var theme = localStorage.getItem('AriaNg.Theme');
        if (theme){
            $scope.mainTheme = JSON.parse(theme);
        }
        else {
            $scope.mainTheme = 'default';
        }

        $scope.customColors = {};
        var customColors = config.getCustomColors();
        customColors.forEach((item)=>{
            var store = localStorage.getItem(`AriaNg.CustomTheme.${item.name}`);
            $scope.customColors[item.name] = store ? JSON.parse(store) : item.default;
        })

        ipcRenderer.on('language-change', function (e,resp) {
            $translate.use(resp);
            $scope.currentLanguage = resp;
        })

        ipcRenderer.on('selected-theme', function (e,resp) {
            $scope.mainTheme = resp;
            $scope.$apply();
        })

        ipcRenderer.on('color-change', function (e,resp) {
            $scope.customColors[resp.name] = resp.color;
            $scope.$apply();
        })

        var isAction = false;
        $scope.queueList = [];
        function waitForAction() {
            if ($scope.queueList.length != 0) {
                var time;
                var type = $scope.queueList.pop();
                if (type == 'show') {
                    $scope.show();
                    time = 200;
                } else if (type == 'close-true') {
                    $scope.close(true);
                    time = 300;
                } else {
                    $scope.close();
                    time = 300;
                }
                $timeout(function () {
                    waitForAction();
                }, time)
            } else {
                isAction = false;
            }
        }

        $scope.loginWindow = function (val) {
            $scope.queueList.unshift(val);
        }

        $scope.$watch('queueList', function () {
            if (isAction) return;
            isAction = true;
            waitForAction();
        }, true)

        //接受主进程发送的主窗口消息
        ipcRenderer.on('main-to-login', function (e, resp) {
            $scope.$apply(function (){
                if (resp == 'auto-login'){
                    login({account:$user.userInfo('account')});
                }
                else if(resp.indexOf('login-window') == 0){
                    var type = resp.split('=')[1];
                    $scope.loginWindow(type);
                }
                else if (resp == 'cancelLogin') {
                    $scope.isCancelLogin = true;
                }
                else if (resp == 'enter'){
                    angular.element('.form-wrap form').eq($scope.tabIndex).submit();
                }
            });
        })
        //发送给主进程
        $scope.sendToMain = function(data){
            ipcRenderer.send('login-to-main', data);
        }

        var login = function(data){
            if ($user.isSwitchAccount() && !$scope.noCheck){
                data.token = $user.userInfo('token');
            }
            $scope.loginWindow('close');
            $scope.sendToMain('login-status=Logging');
            $scope.isCancelLogin = false;
            $user.http({
                url: 'user/login',
                method: 'post',
                data: data
            }).then(function (resp) {
                if ($scope.isCancelLogin)return;
                if (resp.code == 0) {
                    $user.saveUserInfo(resp.data);
                    $scope.clearData();
                    if (data.password && ($scope.rememberPassword || $scope.autoLogin)){
                        $user.userInfo('pwdLength',data.password.length);
                    }
                    $scope.sendToMain('login-status=Logged');
                }

                if (resp.code == 500){
                    message(resp.msg);
                    $scope.sendToMain('login-status=Not Logged');
                    $scope.loginWindow('show');
                }
            }, function (err) {
                if ($scope.isCancelLogin)return;
                message(err.statusText);
                    $scope.sendToMain('login-status=Not Logged');
                    $scope.loginWindow('show');
                })
        }

        $scope.show = function(){
            if (!core.loginWindow.isVisible()){
                core.loginWindow.showWindow();
            }
        }

        $scope.close = function (flag=false) {
            if (!core.loginWindow.isVisible()) return;
            angular.element('.wrapper').addClass('wrapper-close');
            if ($user.isSwitchAccount()){
                $scope.sendToMain('isSwitchAccount');
            }
            $timeout(function () {
                core.loginWindow.closeWindow();
                if (flag) {
                    $scope.clearData();
                }
                angular.element('.wrapper').removeClass('wrapper-close');
            },300)
        }

        $scope.clearData = function(){
            $scope.tabIndex = 0;
            $scope.loginData = {account:'',password:''};
            $scope.registerData = {account:'',password:'',confirmPassword:''};
        }

        $scope.$watch('loginData',function (n) {
            if (n.account == $user.userInfo('account') &&
                n.password == ('*'.padStart($user.userInfo('pwdLength'),'*')) && !!$scope.rememberPassword){
                $scope.noCheck = true;
            }
            else {
                $scope.noCheck = false;
                if (n.password == ('*'.padStart($user.userInfo('pwdLength'),'*'))) {
                    $scope.loginData.password = '';
                }
            }
        },true)

        $scope.pattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/;
        $scope.loginSubmit = function() {
            if (!!$scope.rememberPassword &&
                $scope.loginData.account == $user.userInfo('account') &&
                $scope.loginData.password == ('*'.padStart($user.userInfo('pwdLength'),'*'))
            ){
                login({account:$scope.loginData.account});
            }
            else {
                login($scope.loginData);
            }
        }

        $scope.registerSubmit = function() {
            if ($scope.registerData.password != $scope.registerData.confirmPassword){
                angular.element('#reg-confirm-password').tooltip({text:'Those Passwords Did Not Match'});
            }

            var data = {
                account: $scope.registerData.account,
                password: $scope.registerData.password
            }
            if ($user.isSwitchAccount()){
                data.token = $user.userInfo('token');
            }
            $scope.loginWindow('close');
            $user.http({
                url: 'user/register',
                method: 'post',
                data: data
            }).then(function (resp) {
                if (resp.code == 0) {
                    $user.saveUserInfo(resp.data);
                    $scope.clearData();
                    if (data.password && ($scope.rememberPassword || $scope.autoLogin)){
                        $user.userInfo('pwdLength',data.password.length);
                    }
                    $scope.sendToMain('login-status=Logged');
                }

                if (resp.code == 500){
                    message(resp.msg);
                    $scope.sendToMain('login-status=Not Logged');
                    $scope.loginWindow('show');
                }
            },function (err) {
                message(err.statusText);
                $scope.sendToMain('login-status=Not Logged');
                $scope.loginWindow('show');
            })
        }

        $scope.spacePress = function (e,type) {
            if (e.keyCode == 32){
                $scope.loginOption(type);
            }
        }
    })

    .config(function ($translateProvider) {
        var langs = remote.require('../app/langs/languages').login;
        for (var k in langs){
            $translateProvider.translations(k, langs[k]);
        }
    })

