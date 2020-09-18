var electron = nodeRequire('electron');
var remote = electron.remote;
var app = angular.module('folderWindow',['pascalprecht.translate','folderSelectModule'])

    .controller('folderCtrl',function ($scope,$translate,$folderSelectService,$timeout) {
        var ipcRenderer = electron.ipcRenderer;

        $scope.currentFolder = null;
        $scope.currentName = null;
        $scope.altKey = false;

        angular.element(document).on('keydown',function (e) {
            if (e.altKey){
                $scope.altKey = true;
                $scope.$apply();
            }
        })

        $scope.ok = function () {
            console.log($scope.currentFolder);
            console.log($scope.currentName);
        }

        $scope.cancel = function () {
            remote.getCurrentWindow().hide();
            $timeout(function () {
                remote.getCurrentWindow().destroy();
            },200)
        }

        ipcRenderer.on('send-folder-window-message', function (e, resp) {
            if (resp.type == 'short'){
                if (resp.value == 'f'){
                    angular.element('.path input')[0].focus();
                    angular.element('.path input')[0].select();
                }
                else if (resp.value == 'f'){

                }
                $scope.$apply();
            }
        })
    })

    .config(function ($translateProvider) {
        // var langs = remote.require('../app/langs/languages').avatar;
        // for (var k in langs){
        //     $translateProvider.translations(k, langs[k]);
        // }
    })
