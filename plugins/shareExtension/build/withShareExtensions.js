"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_plugins_1 = require("@expo/config-plugins");
var withAppEntitlements_1 = require("./withAppEntitlements");
var withXcodeTarget_1 = require("./withXcodeTarget");
var withExtensionEntitlements_1 = require("./withExtensionEntitlements");
var withExtensionInfoPlist_1 = require("./withExtensionInfoPlist");
var withExtensionViewController_1 = require("./withExtensionViewController");
var withIntentFilters_1 = require("./withIntentFilters");
var SHARE_EXTENSION_NAME = 'Share-with-Bluesky';
var SHARE_EXTENSION_CONTROLLER_NAME = 'ShareViewController';
var withShareExtensions = function (config) {
    return (0, config_plugins_1.withPlugins)(config, [
        // IOS
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
            },
        ],
        [
            withExtensionViewController_1.withExtensionViewController,
            {
                extensionName: SHARE_EXTENSION_NAME,
                controllerName: SHARE_EXTENSION_CONTROLLER_NAME,
            },
        ],
        [
            withXcodeTarget_1.withXcodeTarget,
            {
                extensionName: SHARE_EXTENSION_NAME,
                controllerName: SHARE_EXTENSION_CONTROLLER_NAME,
            },
        ],
        // Android
        withIntentFilters_1.withIntentFilters,
    ]);
};
exports.default = withShareExtensions;
