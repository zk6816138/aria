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
    }
};

module.exports = config;
