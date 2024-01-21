"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_plugins_1 = require("@expo/config-plugins");
var withAppEntitlements_1 = require("./withAppEntitlements");
var withExtensionEntitlements_1 = require("./withExtensionEntitlements");
var withExtensionInfoPlist_1 = require("./withExtensionInfoPlist");
var SHARE_EXTENSION_NAME = 'Share-with-Bluesky';
var SHARE_EXTENSION_CONTROLLER_NAME = 'ShareViewController';
// const EXTENSIONS_DIRECTORY = '/extensions'
//
// const IOS_TARGET_DIRECTORY = './ios/'
var withShareExtensionIos = function (config) {
    return (0, config_plugins_1.withPlugins)(config, [
        withAppEntitlements_1.withAppEntitlements,
        [
            withExtensionEntitlements_1.withExtensionEntitlements,
            {
                extensionName: SHARE_EXTENSION_NAME,
            },
        ],
        [
            withExtensionInfoPlist_1.withExtensionInfoPlist,
            {
                extensionName: SHARE_EXTENSION_NAME,
                controllerName: SHARE_EXTENSION_CONTROLLER_NAME,
            },
        ],
    ]);
};
exports.default = withShareExtensionIos;
