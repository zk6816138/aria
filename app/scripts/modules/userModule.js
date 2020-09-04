'use strict';
angular.module('userModule', [])

.factory('$user', function ($http) {
    const apiUrl = 'http://aria.zzqwer.com/'; //接口地址
    const imgUrl = 'http://aria.zzqwer.com/'; //图片地址
    var getOption = function (key) {
        var options = JSON.parse(localStorage.getItem('AriaNg.Options')) || {};
        return options[key] || '';
    }
    var getUserInfo = function (key) {
        var user = JSON.parse(localStorage.getItem('AriaNg.UserInfo')) || {};
        return user[key] || '';
    }
    var chooseImage = function () {
        return new Promise(function (resolve) {
            var input = angular.element('<input type="file" accept="image/*"/>');
            input.on('change',()=>{
                if (input[0].files[0]==undefined)return;
                resolve(input[0].files[0]);
            })
            input.click();
        })
    }
    var setHeaders = function () {
        return {
            'Token': getUserInfo('token'),
            'Client-Language': getOption('language'),
            'Auto-Login': getUserInfo('autoLogin'),
            'Remember-Password': getUserInfo('rememberPassword')
        }
    }
    return{
        http: function (opts) {
            return new Promise(function (resolve, reject) {
                $http({
                    url: (opts.url.indexOf('http') >= 0) ? opts.url : (apiUrl + opts.url),
                    method: opts.method || 'get',
                    headers: opts.headers || setHeaders(),
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
        },
        uploadAvatar: function (opts) { // 上传头像
            if (!opts.url){
                throw new Error('上传接口地址不能为空');
            }
            return new Promise(function (resolve, reject) {
                chooseImage().then(function (file) {
                    var formData = new FormData();
                    formData.append(opts.name||'avatar', file);
                    angular.element.ajax({
                        url: apiUrl + opts.url,
                        type: "POST",
                        data:formData,
                        contentType: false,
                        processData: false,
                        dataType:'json',
                        timeout: 30000,
                        headers: opts.headers || setHeaders(),
                        success: (resp)=>{
                            resolve(resp);
                        },
                        error:(err)=>{
                            reject(err);
                        }
                    })
                })
            })
        },
        getImgUrl: function () {
            return imgUrl;
        }
    }
})
