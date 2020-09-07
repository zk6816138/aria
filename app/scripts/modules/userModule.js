'use strict';
angular.module('userModule', [])

.factory('$user', function ($http,$timeout) {
    const apiUrl = 'http://aria.zzqwer.com/'; //接口地址
    const imgUrl = 'http://aria.zzqwer.com/'; //图片地址
    const emptyImage = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; //1*1透明图片
    var getOption = function (key) {
        var options = JSON.parse(localStorage.getItem('AriaNg.Options')) || {};
        return options[key] || '';
    }
    var getUserInfo = function (key) {
        var user = JSON.parse(localStorage.getItem('AriaNg.UserInfo')) || {};
        return user[key] || '';
    }
    var _chooseImage = function () {
        return new Promise(function (resolve) {
            var input = angular.element('<input type="file" accept="image/*"/>');
            input.on('change',()=>{
                $timeout(function () {
                    if (input[0].files[0]==undefined)return;
                    resolve(input[0].files[0]);
                    input = null;
                })
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
        isSwitchAccount: function(flag){
            if (flag!==undefined){
                if (flag === true){
                    localStorage.setItem('isSwitchAccount',1);
                }
                else {
                    localStorage.removeItem('isSwitchAccount');
                }
            }
            else {
                var tmp = localStorage.getItem('isSwitchAccount');
                if (tmp == null){
                    return false;
                }
                else if (tmp == '1') {
                    localStorage.removeItem('isSwitchAccount');
                    return true;
                }
                return false;
            }
        },
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
        chooseImage: function(){
            return new Promise(function (resolve) {
                _chooseImage().then(function (file) {
                    var reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = function() {
                        $timeout(function () {
                            var img = angular.element(`<img src="${reader.result}"/>`);
                            img[0].onload = function(){
                                $timeout(function () {
                                    var tmp = {
                                        width:img[0].width,
                                        height:img[0].height,
                                        base64:reader.result
                                    }
                                    resolve(tmp);
                                    reader = null;
                                    img = null;
                                    tmp = null;
                                })
                            }
                        })
                    }
                });
            })
        },
        setPicSize: function(content) {
            let maxW = parseInt(angular.element('.img-wrap').css('width'));
            let maxH = parseInt(angular.element('.img-wrap').css('height'));
            if (content.w > maxW || content.h > maxH) {
                let scale = content.w / content.h;
                content.w = scale >= 1 ? maxW : maxH * scale;
                content.h = scale >= 1 ? maxW / scale : maxH;
            }
            return {w:parseInt(content.w),h:parseInt(content.h)};
        },
        getImgUrl: function () {
            return imgUrl;
        }
    }
})
