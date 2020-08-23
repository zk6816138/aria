 var app = angular.module('float',[])

    .controller('floatCtrl',function ($scope,$rootScope) {
        var options={color:['#1296DB'],title:{show:false},legend:{show:false},tooltip:{show:false},grid:{containLabel:false,left:0,right:0,top:0,bottom:-1},xAxis:{show:false,type:'category',inverse:true,boundaryGap:false,},yAxis:{show:false,type:'value'},series:{type:'line',showSymbol:false,smooth:false,animation:false,lineStyle:{normal:{width:1}},areaStyle:{normal:{opacity:1}},data:(function(){var arr=[];for(var i=0;i<46;i++){arr.push(0);}return arr;})()}};
        var electron = nodeRequire('electron');
        var ipcRenderer = electron.ipcRenderer;
        var remote = electron.remote;
        var config = remote.require('./config');

        var speedEchart = null;
        $scope.text1 = 0
        $scope.text2 = 'B/s';
        $scope.numActive = 0;

        var theme = localStorage.getItem('AriaNg.Theme');
        if (theme){
            $scope.mainTheme = JSON.parse(theme);
        }
        else {
            $scope.mainTheme = 'default' ;
        }

        var floatMainColor = localStorage.getItem('AriaNg.CustomTheme.FloatMainColor') || JSON.stringify('55,64,79');
        $scope.customColor = JSON.parse(floatMainColor);

        var colors = {default:'#2B85E9',atrovirens:'#48B4CA',blue:'#3F8BD6',brown:'#DBC036',red:'#CF4242',violet:'#8E40DC'};
        options.color = [colors[$scope.mainTheme]||'#2B85E9'];

        ipcRenderer.on('download-speed', function (e,resp) {
            if (!config.showFloat)return;
            if (speedEchart == null){
                speedEchart = echarts.init(document.getElementById('speed-echart'));
            }
            $scope.numActive = resp.numActive;
            if ($scope.numActive>0){
                var arr = resp.downloadSpeed.split(' ');
                $scope.text1 = arr[0].replace(/,/g,'');
                $scope.text2 = arr[1];

                var data = options.series.data;
                data.pop();
                data.unshift(parseInt(resp.originalSpeed));

                speedEchart.setOption(options);
            }
            else {
                if (speedEchart == null)return;

                $scope.text1 = 0
                $scope.text2 = 'B/s';
                for (var i in options.series.data) {
                    options.series.data[i] = 0;
                }
                speedEchart.setOption(options);
                speedEchart = null;
            }
            $scope.$apply();
        });

        ipcRenderer.on('selected-theme', function (e,resp) {
            $scope.mainTheme = resp;
            options.color = [colors[$scope.mainTheme]];
            $scope.$apply();
        })

        ipcRenderer.on('color-change', function (e,resp) {
            $scope.customColor = resp.color.replace('rgb(','').replace(')','');
            localStorage.setItem('AriaNg.CustomTheme.FloatMainColor',JSON.stringify($scope.customColor));
            $scope.$apply();
        })
    })
