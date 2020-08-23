'use strict';
angular.module('validFormModule', [])

    .run(['$validFormService', function ($validFormService) {
        (function (e) {
            e.fn.extend({
                "tooltip": function (opts) {
                    $validFormService.tooltip(this,opts);
                    return this;
                }
            });
        })(angular.element);
    }])

    .directive('validForm',['$validFormService', '$timeout','$validFormData','$compile',function ($validFormService, $timeout,$validFormData,$compile) {
        return {
            restrict: 'A',
            scope: {
                validForm: '=',
                modelValue: '=ngModel'
            },
            template: ``,
            link: function (scope, elem, attrs) {
                var input = angular.element(elem);
                var form = input.parents('form');
                if (form.length == 0) return;

                var opts = {text: '', type: 'error', time: 3000, pattern: ''};
                angular.extend(opts, scope.validForm);

                if (attrs.ngClear || attrs.ngClear=='') {
                    var color = attrs.ngClear || '#ddd';
                    var clearHeight = input.outerHeight()*0.6;
                    var clearMargin = 3;
                    var wrap = $compile(angular.element('<div class="valid-form-wrap" style="display: inline-block;position: relative"></div>'))(scope);
                    var svg = `<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="128" height="128" style="width:100%;height:100%;display:block" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" enable-background="new 0 0 1024 1024" xml:space="preserve"><path fill="${color}" d="M512 0 q216.38 6.1 361.65 150.35 q144.25 144.25 150.35 361.65 q-6.1 217.4 -150.35 361.65 q-145.27 144.25 -361.65 150.35 q-217.4 -6.1 -362.67 -150.35 q-143.23 -144.25 -149.33 -361.65 q6.1 -217.4 149.33 -361.65 q145.27 -144.25 362.67 -150.35 ZM512 960 q192 -5.08 317.97 -130.03 q124.95 -125.97 130.03 -317.97 q-5.08 -192 -130.03 -317.97 q-125.97 -124.95 -317.97 -130.03 q-192 5.08 -317.46 130.54 q-125.46 125.46 -130.54 317.46 q5.08 192 130.03 317.97 q125.97 124.95 317.97 130.03 ZM727.37 297.65 q5.07 11.18 4.06 26.41 q-1.02 15.24 -11.18 26.42 l-165.58 165.58 l172.7 165.59 q9.14 10.16 9.14 23.37 q0 12.19 -9.14 22.35 q-5.08 5.07 -10.16 6.09 q-6.1 1.02 -15.24 1.02 q-9.14 0 -15.24 -1.02 q-6.1 -1.02 -11.17 -6.09 l-165.59 -166.61 l-160.51 166.61 q-5.08 5.07 -10.16 6.09 q-5.08 1.02 -15.24 1.02 q-9.14 0 -15.23 -1.02 q-6.1 -1.02 -10.16 -6.09 q-10.16 -10.16 -10.16 -22.35 q0 -13.21 10.16 -23.37 l165.58 -165.59 l-165.58 -172.69 q-10.16 -10.16 -10.16 -22.35 q0 -13.21 10.16 -23.37 q10.16 -8.13 22.35 -8.13 q13.2 0 22.35 8.13 l166.6 173.72 l172.7 -173.72 q10.16 -8.13 22.35 -8.13 q13.2 0 22.35 8.13 Z"/></svg>`;
                    var clear = $compile(angular.element(`<div class="valid-form-clear" ng-show="modelValue.length > 0" ng-click="clearValue()">${svg}</div>`))(scope);
                    clear.css({
                        position: 'absolute',
                        width: `${clearHeight}px`,
                        height: `${clearHeight}px`,
                        top: '50%',
                        right: '1px',
                        transform: 'translateY(-50%)',
                        margin: `0 ${clearMargin}px`,
                    });
                    input.wrap(wrap).after(clear).css({'padding-right': `${clearHeight + clearMargin * 2}px`});

                    scope.clearValue = function () {
                        scope.modelValue = '';
                        input.focus();
                    }

                    if (form.find('style').length == 0){
                        form.append(`<style>.valid-form-clear:hover path{fill:#eee}.valid-form-clear:active path{fill:#fff}</style>`);
                    }
                }

                var regexp = new RegExp(opts.pattern);
                form.on('submit.valid',function () {
                    angular.element(document).one('click.valid',function () {
                        clear();
                    });
                    if (!regexp.test(scope.modelValue)) {
                        $validFormService.tooltip(input,opts);
                    }
                    else {
                        clear();
                    }
                });

                var clear = function () {
                    if ($validFormData.tip != null){
                        $validFormData.tip.remove();
                        angular.element('.valid-form-tooltip').remove();
                        form.find('input').css({'border-color':''});
                        $validFormData.tip = null;
                    }
                    if ($validFormData.timer != null){
                        $timeout.cancel($validFormData.timer);
                        $validFormData.timer = null;
                    }
                }
            }
        }
    }])

    .value('$validFormData',{
        timer: null,
        tip: null
    })

    .factory('$validFormService', ['$timeout','$validFormData', '$filter', function ($timeout,$validFormData, $filter) {
        const sizes = {lineHeight: 22,arrowHeight: 6,margin: 3},
            colors = {notice: '#4EB2BF', error: '#DF5443', warn: '#F1B83B'};
        return {
            tooltip: (input,options) => {
                var opts = {text: '', type: 'error', time: 3000, pattern: ''};
                angular.extend(opts, options);

                var top = parseInt(input.offset().top);
                var left = parseInt(input.offset().left);
                var typeColor = colors[opts.type] || colors.error;

                input.css({transition: 'border-color 0.3s ease'});

                if ($validFormData.tip != null){
                    $validFormData.tip.remove();
                }
                angular.element('.valid-form-tooltip').remove();
                if ($validFormData.timer != null){
                    $timeout.cancel($validFormData.timer);
                    input.css({'border-color':''});
                }

                var text = opts.text;
                try{
                    text = $filter('translate')(text);
                }
                catch (e) {

                }

                var style = `<style>.valid-form-tooltip:before{content: "";position: absolute;left: 10px;bottom: -11.5px;border: ${sizes.arrowHeight}px solid transparent;border-top-color: ${typeColor};}</style>`;
                $validFormData.tip = angular.element(`<div class="valid-form-tooltip">${text}${style}</div>`);
                $validFormData.tip.css({
                    'min-height': `${sizes.lineHeight}px`,
                    opacity:0,
                    position:'fixed',
                    background: typeColor,
                    color:'#fff',
                    padding:'0 8px',
                    'line-height':`${sizes.lineHeight}px`,
                    'font-size':'12px',
                    'border-radius':'5px',
                    '-webkit-app-region': 'no-drag',
                });

                angular.element('body').append($validFormData.tip);

                $validFormData.tip.css({
                    left:left,
                    'max-width': parseInt(angular.element(window).width() - left) + 'px',
                })

                var lines = Math.floor($validFormData.tip.height() / sizes.lineHeight);
                $validFormData.tip.css({
                    top: (top - (sizes.lineHeight * lines) - sizes.arrowHeight - sizes.margin) + 'px',
                })

                $validFormData.tip.animate({opacity:1},300);
                input.focus().css({'border-color': (opts.type && opts.type == 'error') ? typeColor : ''});
                $validFormData.timer = $timeout(()=>{
                    $validFormData.tip.remove();
                    input.css({'border-color':''});
                    $validFormData.timer = null;
                    $validFormData.tip = null;
                },opts.time)

                throw new Error(opts.text);
            }
        }
    }]);
