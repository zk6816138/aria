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
        minimum: 400
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
    }
};

const userSettingsStore = new Store({userSettingsSchema});

let config = {
    lang: userSettingsStore.get('lang'),
    width: userSettingsStore.get('width') || 950,
    height: userSettingsStore.get('height') || 600,
    x: userSettingsStore.get('x'),
    y: userSettingsStore.get('y'),
    maximized: !!userSettingsStore.get('maximized'),
    defaultPosition: userSettingsStore.get('defaultPosition') || 'last-position',
    minimizedToTray: userSettingsStore.get('minimizedToTray', true),
    save: function (item) {
        if (item && this[item] != undefined) {
            userSettingsStore.set(item, this[item]);
        }
    }
};

module.exports = config;
