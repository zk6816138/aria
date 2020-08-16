'use strict';

const Store = require('electron-store');

const userSettingsSchema = {
    lang: {
        type: 'string'
    },
    width: {
        type: 'number',
        minimum: 800
    },
    height: {
        type: 'number',
        minimum: 600
    },
    maximized: {
        type: 'boolean'
    },
    minimizedToTray: {
        type: 'boolean'
    },
    pos_x: {
        type: 'number'
    },
    pos_y: {
        type: 'number'
    },
    showFloat: {
        type: 'boolean'
    }
};

const customColors = [
    {name:'MainColor',default:'rgb(60,72,82)',title:'Sidebar(Main Color)',trans:false},
    {name:'SearchbarHoverColor',default:'rgba(238,238,238,1)',title:'Search Bar Mouse Enter',trans:true},
    {name:'MainHoverColor',default:'rgba(49,58,66,1)',title:'Sidebar Menu Mouse Enter',trans:true},
    {name:'TaskHoverColor',default:'rgba(230,244,252,1)',title:'Task Mouse Enter',trans:true},
    {name:'MainActiveColor',default:'rgba(37,44,48,1)',title:'Sidebar Menu Selected',trans:true},
    {name:'TaskSelectedColor',default:'rgba(210,239,255,1)',title:'Task Selected',trans:true},
    {name:'MenuNormalColor',default:'rgba(162,181,185,1)',title:'Sidebar Menu Word',trans:true},
    {name:'TaskBorderColor',default:'rgba(198,229,246,1)',title:'Task Border Mouse Enter',trans:true},
    {name:'MenuActiveColor',default:'rgba(83,153,232,1)',title:'Sidebar Menu Word Selected',trans:true},
    {name:'TaskArrowColor',default:'rgba(200,200,200,1)',title:'Task Arrow',trans:true},
    {name:'ToolbarHoverColor',default:'rgba(0,128,255,1)',title:'Toolbar Mouse Enter',trans:true},
    {name:'TaskProcessColor',default:'rgba(32,143,229,1)',title:'Task Progressbar',trans:true},
    {name:'ToolbarActiveColor',default:'rgba(1,95,199,1)',title:'Toolbar Selected',trans:true},
    {name:'TaskProcessBorderColor',default:'rgba(191,207,220,1)',title:'Task Progressbar Border',trans:true},
    {name:'SearchbarNormalColor',default:'rgba(220,220,220,1)',title:'Search Bar',trans:true},
    {name:'TaskMirrorColor',default:'rgba(159,220,255,0.6)',title:'Task Drag',trans:true}
];

const userSettingsStore = new Store({userSettingsSchema});

let config = {
    lang: userSettingsStore.get('lang'),
    width: userSettingsStore.get('width') || 1200,
    height: userSettingsStore.get('height') || 800,
    x: userSettingsStore.get('x'),
    y: userSettingsStore.get('y'),
    maximized: !!userSettingsStore.get('maximized'),
    defaultPosition: userSettingsStore.get('defaultPosition') || 'last-position',
    minimizedToTray: userSettingsStore.get('minimizedToTray', true),
    showFloat: userSettingsStore.get('showFloat',true),
    floatX: userSettingsStore.get('floatX'),
    floatY: userSettingsStore.get('floatY'),
    save: function (item) {
        if (item && this[item] != undefined) {
            userSettingsStore.set(item, this[item]);
        }
    },
    getCustomColors: function () {
        return customColors;
    }
};

module.exports = config;

