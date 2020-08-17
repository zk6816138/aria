(function () {
    'use strict';

    angular.module('ariaNg').directive('ngDragSelect', ['$rootScope','$location', function ($rootScope,$location) {
        return {
            restrict: 'A',
            link: function (scope, element) {
                $(element).on('mousedown.dragselect', function (e) {
                    var location = $location.path().substring(1);
                    if ((e.target.id != 'content-body' && e.target.tagName.toLowerCase() != 'section') || (location!='downloading' && location!='waiting' && location!='stopped')) return;

                    if (JSON.stringify($rootScope.taskContext.selected) != '{}'){
                        $rootScope.taskContext.selected = {};
                        scope.$apply();
                    }

                    $(element).trigger('click');

                    if (e.button!=0)return;
                    var border = $('<div class="drag-select-border"></div>');
                    var pageX = e.pageX;
                    var pageY = e.pageY;
                    var offset = $(this).offset();
                    var maxTop = offset.top; //最高顶部距离
                    var maxLeft = offset.left; //最大左边距离
                    var maxWidth = $(this).width();
                    var maxHeight = $(this).height();
                    var top = pageY, left = pageX, width = 0, height = 0;
                    var rectY=0,rectHeight=0;
                    border.css({left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`});
                    $('body').append(border);
                    $(element).find('div.task-table-body').addClass('no-background');
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

                        rectY = border.offset().top;
                        rectHeight = border.offset().top + border.height();
                        return false;
                    })

                    $(document).on('mouseup.dragselect', function (e) {
                        getSelectedId(rectY,rectHeight)
                        $(element).find('div.task-table-body').removeClass('no-background');
                        border.remove();
                        $(document).off('.dragselect');
                    })
                })

                function getSelectedId(top,height) {
                    var ids = {};
                    $(element).find('div.row').each(function () {
                        var t = $(this).offset().top;
                        var b = $(this).offset().top + $(this).height();
                        for (var i = t;i<=b;i++){
                            if (i > top && i < height){
                                var gid = $(this).attr('data-gid');
                                ids[gid] = true;
                                break;
                            }
                        }
                    })
                    if (JSON.stringify(ids)!='{}'){
                        $rootScope.taskContext.selected = ids;
                        scope.$apply();
                    }
                }
            }
        };
    }]);
}());
