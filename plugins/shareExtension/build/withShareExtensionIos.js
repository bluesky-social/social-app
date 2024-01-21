"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_plugins_1 = require("@expo/config-plugins");
var withAppEntitlements_1 = require("./withAppEntitlements");
var withExtensionEntitlements_1 = require("./withExtensionEntitlements");
var SHARE_EXTENSION_NAME = 'Share-with-Bluesky';
// const SHARE_EXTENSION_CONTROLLER_NAME = 'ShareViewController'
// const EXTENSIONS_DIRECTORY = '/extensions'
//
// const IOS_TARGET_DIRECTORY = './ios/'
var withShareExtensionIos = function (config) {
    return (0, config_plugins_1.withPlugins)(config, [
        withAppEntitlements_1.withAppEntitlements,
        [withExtensionEntitlements_1.withExtensionEntitlements, { extensionName: SHARE_EXTENSION_NAME }],
    ]);
};
exports.default = withShareExtensionIos;
