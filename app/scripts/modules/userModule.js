'use strict';
angular.module('userModule', [])

.factory('$user', function ($http) {
    const apiUrl = 'http://aria.zzqwer.com/';
    var getOption = function (key) {
        var options = JSON.parse(localStorage.getItem('AriaNg.Options')) || {};
        return options[key] || '';
    }
    var getUserInfo = function (key) {
        var user = JSON.parse(localStorage.getItem('AriaNg.UserInfo')) || {};
        return user[key] || '';
    }
    return{
        http: function (opts) {
            return new Promise(function (resolve, reject) {
                $http({
                    url: (opts.url.indexOf('http') >= 0) ? opts.url : (apiUrl + opts.url),
                    method: opts.method || 'get',
                    headers: opts.headers || {
                        'Token': getUserInfo('token'),
                        'Client-Language': getOption('language'),
                        'Auto-Login': getUserInfo('autoLogin'),
                        'Remember-Password': getUserInfo('rememberPassword')
                    },
                    data: opts.data || {}
                }).then((resp)=>{
                    resolve(resp.data);
                },(err)=>{
                    //todo 处理token出错,自动退出登录
                    reject(err);
                })
            })
        },
        userInfo: function (key,value) {
            if (value !== undefined){
                var user = JSON.parse(localStorage.getItem('AriaNg.UserInfo')) || {};
                user[key] = value;
                localStorage.setItem('AriaNg.UserInfo',JSON.stringify(user));
            }
            else {
                return getUserInfo(key);
            }
        },
        saveUserInfo: function (obj) {
            var user = JSON.parse(localStorage.getItem('AriaNg.UserInfo')) || {};
            angular.extend(user, obj);
            localStorage.setItem('AriaNg.UserInfo',JSON.stringify(user));
        }
    }
})
