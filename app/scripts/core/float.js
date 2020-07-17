$(function () {
    var electron = window.nodeRequire ? nodeRequire('electron') : {};
    var ipcRenderer = electron.ipcRenderer || {};
    var remote = electron.remote || {};
    var config = remote.require('./config') || {};

    ipcRenderer.on('download-speed', function (e,resp) {
        if (!config.showFloat)return;
        if (resp.numActive>0){
            if (!$('section').hasClass('downloading')) {
                $('section').addClass('downloading');
            }

            var arr = resp.downloadSpeed.split(' ');
            $('.speed-wrapper .s1').text(arr[0].replace(',',''));
            $('.speed-wrapper .s2').text(arr[1]);
        }
        else {
            if ($('section').hasClass('downloading')) {
                $('section').removeClass('downloading');
            }
        }
    });
})
