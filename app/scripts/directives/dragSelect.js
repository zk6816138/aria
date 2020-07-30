(function () {
    'use strict';

    angular.module('ariaNg').directive('ngDragSelect', ['$rootScope','$location', function ($rootScope,$location) {
        return {
            restrict: 'A',
            link: function (scope, element) {
                $(element).on('mousedown.dragselect', function (e) {
                    var location = $location.path().substring(1);
                    if (e.target.id != 'content-body' || (location!='downloading' && location!='waiting' && location!='stopped'))return;

                    var border = $('<div class="drag-select-border"></div>');
                    var pageX = e.pageX;
                    var pageY = e.pageY;
                    var offset = $(this).offset();
                    var maxTop = offset.top; //最高顶部距离
                    var maxLeft = offset.left; //最大左边距离
                    var maxWidth = $(this).width();
                    var maxHeight = $(this).height();
                    var top = pageY, left = pageX, width = 0, height = 0;
                    border.css({left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`});
                    $('body').append(border);
                    $(document).on('mousemove.dragselect', function (e) {
                        var x = e.pageX;
                        var y = e.pageY;
                        var subX = x - pageX;
                        var subY = y - pageY;

                        if (subX > 0){
                            left = pageX;
                            width = x - left;
                            if (subY > 0) {//右下
                                top = pageY;
                                height = y - top;
                                if (height + pageY - maxTop >= maxHeight) {
                                    top = pageY;
                                    height = maxHeight - (pageY - maxTop);
                                }
                            }
                            else if (subY < 0){//右上
                                top = y;
                                height = pageY - y;
                                if (top <= maxTop) {
                                    top = maxTop;
                                    height = pageY - maxTop;
                                }
                            }
                            if (width + pageX - maxLeft >= maxWidth) {
                                left = pageX;
                                width = maxWidth - (pageX - maxLeft);
                            }
                        }
                        else if (subX < 0 ){
                            left = x;
                            width = pageX - x;
                            if (subY>0){//左下
                                top = pageY;
                                height = y - top;
                                if (height + pageY - maxTop >= maxHeight) {
                                    top = pageY;
                                    height = maxHeight - (pageY - maxTop);
                                }
                            }
                            else if (subY < 0){//左上
                                top = y;
                                height = pageY - y;
                                if (top <= maxTop) {
                                    top = maxTop;
                                    height = pageY - maxTop;
                                }
                            }
                            if (left <= maxLeft){
                                left = maxLeft;
                                width = pageX - maxLeft;
                            }
                        }

                        border.css({left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`});

                        //todo

                        return false;
                    })

                    $(document).on('mouseup', function (e) {
                        border.remove();
                        $(document).off('.dragselect');
                    })
                })
            }
        };
    }]);
}());
