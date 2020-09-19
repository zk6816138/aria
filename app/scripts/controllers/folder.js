var electron = nodeRequire('electron');
var remote = electron.remote;
var app = angular.module('folderWindow',['pascalprecht.translate','folderSelectModule'])

    .controller('folderCtrl',function ($scope,$translate,$folderSelectService,$timeout) {
        var options = JSON.parse(localStorage.getItem('AriaNg.Options'));
        $scope.currentLanguage = 'zh_Hans';
        $translate.use($scope.currentLanguage);

        var ipcRenderer = electron.ipcRenderer;

        ipcRenderer.on('language-change', function (e,resp) {
            $translate.use(resp);
            $scope.currentLanguage = resp;
        })

        $scope.currentFolder = null;
        $scope.currentName = null;
        $scope.altKey = false;

        angular.element(document).on('keydown',function (e) {
            if (e.altKey){
                $scope.altKey = true;
                $scope.$apply();
            }
            else if (e.key == 'Enter'){
                var edit = angular.element('input.editing');
                if (edit.length > 0){
                    edit[0].blur();
                }
                else {
                    $scope.ok();
                }
            }
        })

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
                else if (resp.value == 'm'){
                    $scope.createFolder();
                }
                $scope.$apply();
            }
        })

        $scope.$on('close',function () {
            $scope.cancel();
        })
    })

    .config(function ($translateProvider) {
        var langs = remote.require('../app/langs/languages').folder;
        for (var k in langs){
            $translateProvider.translations(k, langs[k]);
        }
    })
