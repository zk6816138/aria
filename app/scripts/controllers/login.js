var app = angular.module('loginWindow',['validFormModule','pascalprecht.translate'])

    .controller('loginCtrl',function ($scope, $timeout,$translate) {
        var options = JSON.parse(localStorage.getItem('AriaNg.Options'));
        $scope.currentLanguage = options ? options.language : 'zh_Hans';
        $translate.use($scope.currentLanguage);

        var electron = nodeRequire('electron');
        var remote = electron.remote;
        var ipcRenderer = electron.ipcRenderer;
        var config = remote.require('./config');

        $scope.tabIndex = 0;
        $scope.rememberPassword = localStorage.getItem('AriaNg.Login.rememberPassword') === 'true' ? true : false;
        $scope.autoLogin = localStorage.getItem('AriaNg.Login.autoLogin') === 'true' ? true : false;

        $scope.loginData = {account:'',password:''};
        $scope.registerData = {account:'',password:'',confirmPassword:''};

        $scope.loginOption = function (type) {
            $scope[type] = !$scope[type];
            localStorage.setItem(`AriaNg.Login.${type}`,$scope[type]);
        }

        var theme = localStorage.getItem('AriaNg.Theme');
        if (theme){
            $scope.mainTheme = JSON.parse(theme);
        }
        else {
            $scope.mainTheme = 'default' ;
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

        ipcRenderer.on('login-window-close', function () {
            $scope.close();
        })

        //接受主进程发送的主窗口消息
        ipcRenderer.on('main-to-login', function (e, resp) {

        })
        //发送给主进程
        $scope.sendToMain = function(data){
            ipcRenderer.send('login-to-main', data);
        }

        $scope.close = function () {
            angular.element('.wrapper').addClass('wrapper-close');

            $timeout(function () {
                remote.getCurrentWindow().hide();
                $scope.tabIndex = 0;
                $scope.loginData = {account:'',password:''};
                $scope.registerData = {account:'',password:'',confirmPassword:''};
                angular.element('.wrapper').removeClass('wrapper-close');
            },300)
        }

        $scope.pattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/;
        $scope.loginSubmit = function() {

            console.log('login')
        }

        $scope.registerSubmit = function() {
            if ($scope.registerData.password != $scope.registerData.confirmPassword){
                angular.element('#reg-confirm-password').tooltip({text:'Those Passwords Did Not Match'});
            }

            console.log(2)
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

