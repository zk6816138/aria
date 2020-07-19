var options = {
    color:['#1296DB'],
    title:{show:false},
    legend:{show:false},
    tooltip:{show:false},
    grid:{
        containLabel:false,
        left:0,
        right:0,
        top:0,
        bottom:-1
    },
    xAxis:{
        show:false,
        type:'category',
        inverse:true,
        boundaryGap: false,
    },
    yAxis:{
        show:false,
        type: 'value'
    },
    series: {
        type: 'line',
        showSymbol: false,
        smooth: false,
        animation: false,
        lineStyle: {
            normal: {
                width: 1
            }
        },
        areaStyle: {
            normal: {
                opacity: 1
            }
        },
        data: (function () {
            var arr = [];
            for (var i=0;i<46;i++){
                arr.push(0);
            }
            return arr;
        })()
    }
}

$(function () {
    var electron = window.nodeRequire ? nodeRequire('electron') : {};
    var ipcRenderer = electron.ipcRenderer || {};
    var remote = electron.remote || {};
    var config = remote.require('./config') || {};

    var speedEchart = echarts.init(document.getElementById('speed-echart'));

    ipcRenderer.on('download-speed', function (e,resp) {
        if (!config.showFloat)return;
        if (resp.numActive>0){
            if (!$('section').hasClass('downloading')) {
                $('section').addClass('downloading');
            }

            var arr = resp.downloadSpeed.split(' ');
            $('.speed-wrapper .s1').text(arr[0].replace(',',''));
            $('.speed-wrapper .s2').text(arr[1]);

            var data = options.series.data;
            data.pop();
            data.unshift(parseInt(resp.originalSpeed));

            speedEchart.setOption(options);
        }
        else {
            if ($('section').hasClass('downloading')) {
                $('section').removeClass('downloading');

                for (var i in options.series.data) {
                    options.series.data[i] = 0;
                }
                speedEchart.setOption(options);
            }
        }
    });


})
