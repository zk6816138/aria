var app = angular.module('loginWindow',['validFormModule','pascalprecht.translate','userModule'])

    .controller('loginCtrl',function ($scope, $timeout,$translate,$user) {
        var options = JSON.parse(localStorage.getItem('AriaNg.Options'));
        $scope.currentLanguage = options ? options.language : 'zh_Hans';
        $translate.use($scope.currentLanguage);

        var electron = nodeRequire('electron');
        var remote = electron.remote;
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
            }
            else {
                $scope.rememberPassword = $scope.autoLogin = 0;
                $user.userInfo('rememberPassword', 0);
                $user.userInfo('autoLogin', 0);
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
    })

    .config(function ($translateProvider) {
        $translateProvider.translations('en', {
            'Login': 'Login',
            'Close': 'Close',
            'Register': 'Register',
            'Account': 'Account',
            'Password': 'Password',
            'Remember Password': 'Remember Password',
            'Auto Login': 'Auto Login',
            'Confirm': 'Confirm',
            'Enter Your Account': 'Enter Your Account',
            'Enter Your Password': 'Enter Your Password',
            'Enter Password Again': 'Enter Password Again',
            'The Account Must Be A Mixed Of 6-20 Letters And Numbers': 'The Account Must Be A Mixed Of 6-20 Letters And Numbers',
            'The Password Must Be A Mixed Of 6-20 Letters And Numbers': 'The Password Must Be A Mixed Of 6-20 Letters And Numbers',
            'The Confirm Password Must Be A Mixed Of 6-20 Letters And Numbers': 'The Confirm Password Must Be A Mixed Of 6-20 Letters And Numbers',
            'Those Passwords Did Not Match': 'Those Passwords Did Not Match'
        });
        $translateProvider.translations('zh_Hans', {
            'Login': '登　录',
            'Close': '关闭',
            'Register': '注　册',
            'Account': '账　号',
            'Password': '密　码',
            'Remember Password': '记住密码',
            'Auto Login': '自动登录',
            'Confirm': '确　认',
            'Enter Your Account': '请输入您的账号',
            'Enter Your Password': '请输入您的密码',
            'Enter Password Again': '请再次输入密码',
            'The Account Must Be A Mixed Of 6-20 Letters And Numbers': '账号必须是 6-20 位字母和数字组合',
            'The Password Must Be A Mixed Of 6-20 Letters And Numbers': '密码必须是 6-20 位字母和数字组合',
            'The Confirm Password Must Be A Mixed Of 6-20 Letters And Numbers': '确认密码必须是 6-20 位字母和数字组合',
            'Those Passwords Did Not Match': '两次密码不一致'
        });
        $translateProvider.translations('zh_Hant', {
            'Login': '登　錄',
            'Close': '關閉',
            'Register': '注　冊',
            'Account': '賬　號',
            'Password': '密　碼',
            'Remember Password': '記住密碼',
            'Auto Login': '自動登錄',
            'Confirm': '確　認',
            'Enter Your Account': '請輸入您的賬號',
            'Enter Your Password': '請輸入您的密碼',
            'Enter Password Again': '請再次輸入密碼',
            'The Account Must Be A Mixed Of 6-20 Letters And Numbers': '賬號必須是 6-20 位字母和數字組合',
            'The Password Must Be A Mixed Of 6-20 Letters And Numbers': '密碼必須是 6-20 位字母和數字組合',
            'The Confirm Password Must Be A Mixed Of 6-20 Letters And Numbers': '確認密碼必須是 6-20 位字母和數字組合',
            'Those Passwords Did Not Match': '兩次密碼不一致'
        });
    })

