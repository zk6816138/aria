var app = angular.module('avatarWindow',['pascalprecht.translate','userModule'])

    .controller('avatarCtrl',function ($scope,$timeout,$translate,$user) {
        var options = JSON.parse(localStorage.getItem('AriaNg.Options'));
        $scope.currentLanguage = options ? options.language : 'zh_Hans';
        $translate.use($scope.currentLanguage);

        var electron = nodeRequire('electron');
        var remote = electron.remote;
        var ipcRenderer = electron.ipcRenderer;
        var core = remote.require('./core');

        // w,h图片宽高;b图片base64;c裁剪区域宽高;t,l裁剪区域top,left;x,y裁剪区图片transform
        $scope.data = {w:null,h:null,b:null,c:null,t:null,l:null,x:null,y:null};

        $scope.canvasData = {w:null,h:null};

        $scope.isLoading = false;

        ipcRenderer.on('language-change', function (e,resp) {
            $translate.use(resp);
            $scope.currentLanguage = resp;
        })

        //接受主进程发送的主窗口消息
        ipcRenderer.on('main-to-avatar', function (e, resp) {
            if(resp.type.indexOf('avatar-window') == 0){
                var type = resp.type.split('=')[1];
                if (type == 'show'){
                    $scope.init(resp.data);
                    $scope.show();
                    $scope.$apply();
                }
                else {
                    $scope.close()
                }
            }
        })
        //发送给主进程
        $scope.sendToMain = function(data){
            ipcRenderer.send('avatar-to-main', data);
        }

        //初始化裁剪框
        $scope.init = function(data){
            var size = $user.setPicSize({w:data.width,h:data.height});

            $scope.data.w = size.w;
            $scope.data.h = size.h;
            $scope.data.b = data.base64;

            if (data.width >= data.height){
                $scope.data.c = $scope.data.h;
                $scope.data.t = 0;
                $scope.data.l = parseInt($scope.data.w / 2 - $scope.data.h / 2);
                $scope.data.x = `-${$scope.data.l}px`;
                $scope.data.y = 0;

                $scope.canvasData.w = $scope.canvasData.h = $scope.data.h;
            }
            else {
                $scope.data.c = $scope.data.w;
                $scope.data.t = parseInt($scope.data.h / 2 - $scope.data.w / 2);
                $scope.data.l = 0;
                $scope.data.x = 0;
                $scope.data.y = `-${$scope.data.t}px`;

                $scope.canvasData.w = $scope.canvasData.h = $scope.data.w;
            }

            var clip = angular.element('.clip').css({cursor:'grab'});

            if (data.width == data.height){
                clip.css({cursor:'not-allowed'}).off('mousedown');
                return;
            }

            clip.off('mousedown').on('mousedown', function (e) {
                if (e.button == 0){
                    var startX = e.pageX;
                    var startY = e.pageY;
                    var position = (data.width >= data.height) ? $scope.data.l : $scope.data.t;
                    clip.css({cursor:'grabbing'});
                    angular.element(document).on('mousemove.clip',function (e) {
                        if (data.width > data.height){ //只能横向移动
                            var left =  position + (e.pageX - startX);
                            if (left <= 0){
                                left = 0;
                            }
                            if (left >= ($scope.data.w - $scope.data.c)) {
                                left = ($scope.data.w - $scope.data.c);
                            }
                            $scope.data.x = `-${left}px`;
                            $scope.data.l = left;
                        }
                        else { //只能垂直移动
                            var top =  position + (e.pageY - startY);
                            if (top <= 0){
                                top = 0;
                            }
                            if (top >= ($scope.data.h - $scope.data.c)) {
                                top = ($scope.data.h - $scope.data.c);
                            }
                            $scope.data.y = `-${top}px`;
                            $scope.data.t = top;
                        }
                        $scope.$apply();
                    })
                    angular.element(document).on('mouseup.clip',function () {
                        $(document).off('.clip');
                        clip.css({cursor:'grab'});
                    })
                }

            })
        }

        //裁剪并上传
        $scope.upload = function(){
            if (!$scope.data.b || $scope.isLoading) return;
            $scope.isLoading = true;
            var canvas = angular.element('#canvas')[0]; //canvas的dom对象
            var ctx = canvas.getContext("2d");
            var img = new Image();
            img.src = $scope.data.b;
            img.onload = function () {
                ctx.drawImage(img,-$scope.data.l,-$scope.data.t,$scope.data.w,$scope.data.h);
                $user.http({
                    url: 'user/avatar',
                    method: 'post',
                    data: {data: canvas.toDataURL("image/jpeg")}
                }).then(function (resp) {
                    $scope.isLoading = false;
                    $scope.sendToMain({type: resp.code==0?'message-success':'message-error',data: resp.msg});
                    if (resp.code == 0){
                        $user.userInfo('avatar',resp.data.avatar)
                        $scope.sendToMain({type:'upload-success'});
                        $scope.close();
                    }
                    $scope.$apply();
                })
            }
        }

        //选择本地图片
        $scope.choose = function(){
            $user.chooseImage().then(function (resp) {
                $scope.data = {w:null,h:null,b:null,c:null,t:null,l:null,x:null,y:null};
                $scope.init(resp);
                $scope.$apply();
            })
        }

        $scope.show = function(){
            if (!core.avatarWindow.isVisible()){
                core.avatarWindow.showWindow();
            }
        }

        $scope.close = function () {
            if (!core.avatarWindow.isVisible()) return;
            angular.element('.wrapper').addClass('wrapper-close');

            $timeout(function () {
                core.avatarWindow.closeWindow();
                angular.element('.wrapper').removeClass('wrapper-close');
            },300)
        }
    })

    .config(function ($translateProvider) {
        $translateProvider.translations('en', {
            'Close': 'Close',
            'Select Image': 'Select Image',
            'Clip And Upload': 'Clip And Upload'
        });
        $translateProvider.translations('zh_Hans', {
            'Close': '关闭',
            'Select Image': '选择图片',
            'Clip And Upload': '裁剪并上传'
        });
        $translateProvider.translations('zh_Hant', {
            'Close': '關閉',
            'Select Image': '選擇圖片',
            'Clip And Upload': '裁剪並上傳'
        });
    })
