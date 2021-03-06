'use strict';

angular.module('simulateScrollModule', [])

.directive('ngSimulateScroll', function () {
    return {
        restrict: 'A',
        scope:{
            ngSimulateScroll:'='
        },
        link: function (scope, element) {
            var defaults = {
                scrollMinHeight : 28, //最小高度
                scrollWidth : 10, //宽度
                scrollColor : '#C3D1DA', //颜色
                hoverColor : '#D3DEE6', //hover颜色
                activeColor : '#ACBCC7', //active颜色
                autoHide : false, //鼠标离开滚动区域自动隐藏
                opacity : .8, //透明度
                borderRadius : 0, //圆角
                margin:0, //边距
                position:'right', //位置
                duration:0, //动画持续时间毫秒
            };

            var o = angular.extend(defaults, scope.ngSimulateScroll);

            var content = $(element).addClass('simulate-scrollbar');

            if ($('head style.simulate-scrollbar-style').length == 0){
                var style = `
                .simulate-scrollbar{
                    position:${content.css('position')=='absolute'?'absolute':'relative'};
                    overflow-y:scroll;
                }
                .simulate-scrollbar::-webkit-scrollbar{display:none}
                .simulate-scrollbar scrollbar{
                    position:absolute;
                    top:0;
                    ${o.position=='right'?('right:'+o.margin+'px'):('left:'+o.margin+'px')};
                    width:${o.scrollWidth}px;
                    height: 0;
                    background:${o.scrollColor};
                    opacity:${o.autoHide ? 0 : o.opacity};
                    transition-property: opacity , height;
                    transition-duration: ${o.duration}ms;
                    transition-timing-function: ease;
                    border-radius: ${o.borderRadius}px;
                    z-index: 2000;
                }
                .simulate-scrollbar scrollbar:hover{background:${o.hoverColor}}
                .simulate-scrollbar scrollbar:active{background:${o.activeColor}}
                .simulate-scrollbar:hover scrollbar{opacity:${o.opacity}}
                .simulate-scrollbar-mask{position: fixed;top: 0;left: 0;width: 100%;height: 100%;z-index: 1999;}`;
                $('head').append('<style class="simulate-scrollbar-style">'+style+'</style>');
            }

            if (content.find('scrollbar').length==0){
                content.append('<scrollbar></scrollbar>');
            }

            var scroll = content.find('scrollbar');

            content.on('scroll',function () {
                updateScroll();
            })

            content.on('domResize',function () {
                updateScroll();
            })

            scroll.on('mousedown',function (e) {
                if (e.originalEvent.button!=0)return;
                var top = scroll.position().top;
                var pageY = e.pageY;
                $('body').append('<div class="simulate-scrollbar-mask"></div>');
                $(document).on('mousemove.simulatescroll',function (e) {
                    var currTop = top + e.pageY - pageY;
                    var scrollTop = currTop / (content.height() - scroll.height()) * (content.prop('scrollHeight') - content.height());
                    content.scrollTop(scrollTop);
                })

                $(document).on('mouseup.simulatescroll',function () {
                    $(document).off('.simulatescroll');
                    $('.simulate-scrollbar-mask').remove();
                })
                return false;
            })
            scroll.on('selectstart.simulatescroll',function (e) {
                e.stopPropagation();
                e.preventDefault();
                return false;
            })

            function updateScroll(){
                var sHeight = content.prop('scrollHeight');
                var sTop = content.scrollTop();
                var cHeight = content.height();
                var scrollHeight = cHeight / sHeight * cHeight;
                var offset = (scrollHeight < o.scrollMinHeight) ? o.scrollMinHeight - scrollHeight : 0;
                var eleTop = sTop + ( sTop * (cHeight - scrollHeight - offset) / (sHeight - cHeight) );
                scroll.css({
                    top: `${eleTop}px`,
                    height: ((cHeight>=sHeight)? 0 : `${scrollHeight}px`),
                    'min-height': ((cHeight>=sHeight)? 0 : `${o.scrollMinHeight}px`),
                    transition:''
                });
            }

            scope.ngSimulateScroll.simulateScrollReload = function () {
                scroll.css({height:0,'min-height':0,transition:'all 0s'});
                setTimeout(function () {
                    !!content.scrollTop() ? content.scrollTop(0) : updateScroll();
                },200)
            }
        }
    }
});
