"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAppEntitlements = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var withAppEntitlements = function (config) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    return (0, config_plugins_1.withEntitlementsPlist)(config, function (config) {
        config.modResults['com.apple.security.application-groups'] = [
            "group.".concat(config.ios.bundleIdentifier),
        ];
        return config;
    });
};
exports.withAppEntitlements = withAppEntitlements;
