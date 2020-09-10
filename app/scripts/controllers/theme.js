var electron = nodeRequire('electron');
var remote = electron.remote;
var app = angular.module('theme', ['ui.colorpicker','pascalprecht.translate'])

    .controller('themeCtrl',function ($rootScope,$scope, $translate, $timeout) {
        $timeout(function () {
            angular.element('.wrapper').addClass('wrapper-open');
            $timeout(function () {
                $scope.ipcRenderer.send('theme-window-loaded');
            },300)
        },0)

        var options = JSON.parse(localStorage.getItem('AriaNg.Options'));
        $translate.use(options ? options.language : 'zh_Hans');

        $scope.colors = remote.require('./config').getCustomColors();
        $scope.ipcRenderer = electron.ipcRenderer;
        $scope.confirmShow = false;
        $rootScope.currentColor = JSON.parse(localStorage.getItem('AriaNg.CustomTheme.MainColor')) || '';

        $scope.ipcRenderer.on('language-change', function (e,resp) {
            $translate.use(resp);
        })

        $scope.ipcRenderer.on('theme-window-close', function () {
            $scope.close();
        })

        $scope.selectedIndex = null;
        $scope.tabIndex = null;

        $scope.$on('current-theme',function (e,arg) {
            $scope.currentTheme = arg;
            if ($scope.currentTheme == 'custom-theme'){
                $scope.selectedIndex = null;
                $scope.tabIndex = 1;
                angular.element('.header .reset').show();
            }
            else {
                $scope.tabIndex = 0;
                angular.element('.header .reset').hide();
            }
        })

        $scope.selectTheme = function(item) {
            $scope.selectedIndex = $scope.themeList.indexOf(item);
            localStorage.setItem('AriaNg.Theme',JSON.stringify(item.value));
            $scope.ipcRenderer.send('selected-theme',item.value);
            $scope.$emit('current-theme',item.value);
        }

        $scope.selectTab = function(index){
            $scope.tabIndex = index;
            if (index == 0){
                angular.element('.header .reset').fadeOut(500);
                $scope.ipcRenderer.send('selected-theme',$scope.currentTheme);
            }
            else {
                angular.element('.header .reset').fadeIn(500);
                $scope.ipcRenderer.send('selected-theme','custom-theme');
            }
        }

        $scope.close = function () {
            if (angular.element('.colorpicker-mask.open').length > 0){
                angular.element('.colorpicker-mask.open').trigger('click');
            }
            else if (angular.element('.confirm-mask.open').length > 0) {
                angular.element('.confirm-mask.open').trigger('click');
            }
            else {
                angular.element('.wrapper').removeClass('wrapper-open').addClass('wrapper-close');
                $timeout(function () {
                    remote.getCurrentWindow().destroy();
                },250)
            }
        }

        $scope.reset = function () {
            $scope.colors.forEach((item)=>{
                if (item.color != item.default){
                    item.color = item.default;
                    $scope.ipcRenderer.send('color-change',{color:item.color,name:item.name});
                    localStorage.setItem(`AriaNg.CustomTheme.${item.name}`,JSON.stringify(item.color));
                }
            })
            localStorage.setItem('AriaNg.Theme',JSON.stringify('custom-theme'));
            $scope.$emit('current-theme','custom-theme');
            $rootScope.currentColor = $scope.colors[0].default;
        }

        $timeout(function () {
            angular.element('.content-body .content').css({transition: 'transform .5s ease'});
        },500)
    })

    .controller('customCtrl',function ($rootScope,$scope) {
        $scope.colors.forEach((item)=>{
            var store = localStorage.getItem(`AriaNg.CustomTheme.${item.name}`);
            item.color = store ? JSON.parse(store) : item.default;
        })

        $scope.$on('color-change',function (e,resp) {
            $scope.ipcRenderer.send('color-change',resp);
            localStorage.setItem('AriaNg.Theme',JSON.stringify('custom-theme'));
            localStorage.setItem(`AriaNg.CustomTheme.${resp.name}`,JSON.stringify(resp.color));
            $scope.$emit('current-theme','custom-theme');
            if (resp.name == 'MainColor'){
                $rootScope.currentColor = resp.color;
            }
        })
    })

    .directive('themeList', function () {
        return{
            restrict: 'AEC',
            template:`
<div class="row" ng-repeat="row in themeList | limitTo:rowNum track by $index" ng-init="index=$index">
    <div class="item" ng-repeat="item in themeList | startIndex:[index,rowSize] track by $index" ng-class="{'selected':themeList.indexOf(item)==selectedIndex}">
        <a href="javascript:;" ng-style="{'background-color':(item.type=='color'?item.bg:'')}" ng-click="selectTheme(item)">
            <i class="iconfont icon-huojian" ng-class="item.type" ng-if="item.type=='color'"></i>
            <img ng-if="item.type=='img'" ng-class="item.type" ng-src="{{'../assets/bg/bkg_t'+item.bg+'.jpg'}}">
        </a>
    </div>
</div>
`,
            link:function (scope, element, attrs) {
                scope.themeList=[{type:'color',bg:'#3C4852',value:'default'},{type:'color',bg:'#247C93',value:'atrovirens'},{type:'color',bg:'#1C65A9',value:'blue'},{type:'color',bg:'#977D29',value:'brown'},{type:'color',bg:'#A9201C',value:'red'},{type:'color',bg:'#6234A2',value:'violet'},{type:'img',bg:'0',value:'theme-img0'},{type:'img',bg:'1',value:'theme-img1'},{type:'img',bg:'2',value:'theme-img2'},{type:'img',bg:'3',value:'theme-img3'},{type:'img',bg:'4',value:'theme-img4'},{type:'img',bg:'5',value:'theme-img5'}];
                scope.rowSize=4;
                var total=scope.themeList.length;
                scope.rowNum = parseInt(total/scope.rowSize);

                var theme = localStorage.getItem('AriaNg.Theme');
                if (theme){
                    var tmp = theme.replace(/\"/g,'');
                    for (var k in scope.themeList) {
                        if (scope.themeList[k].value == tmp){
                            scope.selectedIndex = scope.themeList.indexOf(scope.themeList[k]);
                            break;
                        }
                    }
                }
                else {
                    scope.selectedIndex = 0 ;
                }

                scope.$emit('current-theme',scope.selectedIndex!==null ? scope.themeList[scope.selectedIndex].value : 'custom-theme');
            }
        }
    })

    .directive('confirm', function () {
        return{
            restrict: 'E',
            template:`
<div class="confirm-mask" ng-click="confirmShow=false">
    <div class="confirm-wrapper">
        <i class="fa fa-lg fa-question-circle-o"></i>
        <div class="title" translate>Confirm Reset</div>
        <div class="content" translate>Do you want to reset all colors?</div>
        <div class="btns">
            <a href="javascript:;" class="btn cancel" ng-click="confirmShow=false" translate>Cancel</a> 
            <a href="javascript:;" class="btn ok" ng-click="confirmShow=false;reset()" translate>OK</a> 
        </div>
    </div>
</div>
            `,
            link: function (scope, element, attrs) {
                var confirm = angular.element(element);
                var mask = confirm.find('.confirm-mask');
                var wrap = confirm.find('.confirm-wrapper');
                confirm.css({display: scope.confirmShow?'block':'none'});
                scope.$watch('confirmShow',function (val) {
                    if (val){
                        confirm.show(0,function () {
                            mask.css({opacity: 1}).addClass('open');
                            wrap.css({transform:'translate(-50%, -50%)',opacity:1});
                        })
                    }
                    else {
                        confirm.hide(300);
                        mask.css({opacity: 0}).removeClass('open');
                        wrap.css({transform:'translate(-50%, -208%)',opacity:0});
                    }
                })
            }
        }
    })

    .filter('startIndex', function () {
        return function (list, arg) {
            var result = [];
            var start = arg[0] * arg[1];
            var end = arg[0] * arg[1] + arg[1];
            if (end>list.length){
                end=list.length;
            }

            for (var i=start;i<end;i++){
                result.push(list[i]);
            }

            return result;
        }
    })

    .config(function ($translateProvider) {
        var langs = remote.require('../app/langs/languages').theme;
        for (var k in langs){
            $translateProvider.translations(k, langs[k]);
        }
    })
