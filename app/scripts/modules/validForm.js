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
                    var clearHeight = Math.round(input.outerHeight()*0.4);
                    var clearMargin = 4;
                    var wrap = $compile(angular.element('<div class="valid-form-wrap" style="display: inline-block;position: relative"></div>'))(scope);
                    var svg = `<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg id="remove" width="128" height="128" style="width:100%;height:100%;display: block;" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1792 1792" enable-background="new 0 0 1792 1792" xml:space="preserve"><path fill="${color}" d="M1749.76 1339.47 q42.24 42.24 42.24 102.58 q0 60.34 -42.24 102.57 l-205.14 205.14 q-42.24 42.24 -102.57 42.24 q-60.34 0 -102.58 -42.24 l-443.47 -443.47 l-443.47 443.47 q-42.24 42.24 -102.57 42.24 q-60.34 0 -102.58 -42.24 l-205.14 -205.14 q-42.24 -42.24 -42.24 -102.57 q0 -60.34 42.24 -102.58 l443.47 -443.47 l-443.47 -443.47 q-42.24 -42.24 -42.24 -102.57 q0 -60.34 42.24 -102.58 l205.14 -205.14 q42.24 -42.24 102.58 -42.24 q60.33 0 102.57 42.24 l443.47 443.47 l443.47 -443.47 q42.24 -42.24 102.58 -42.24 q60.34 0 102.57 42.24 l205.14 205.14 q42.24 42.24 42.24 102.58 q0 60.33 -42.24 102.57 l-443.47 443.47 l443.47 443.47 Z"/></svg>`;
                    var clear = $compile(angular.element(`<div class="valid-form-clear" ng-show="modelValue.length > 0" ng-click="clearValue()">${svg}</div>`))(scope);
                    clear.css({
                        position: 'absolute',
                        width: `${clearHeight}px`,
                        height: `${clearHeight}px`,
                        top: '50%',
                        right: '1px',
                        transform: 'translateY(-50%)',
                        padding: `${clearMargin}px`,
                        'box-sizing': 'content-box'
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
                    if (!regexp.test(scope.modelValue) && !scope.validForm.noCheck) {
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
