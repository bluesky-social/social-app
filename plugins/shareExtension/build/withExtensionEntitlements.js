"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withExtensionEntitlements = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var plist_1 = require("@expo/plist");
var path = require("path");
var fs = require("fs");
var withExtensionEntitlements = function (config, _a) {
    var extensionName = _a.extensionName;
    // eslint-disable-next-line @typescript-eslint/no-shadow
    return (0, config_plugins_1.withInfoPlist)(config, function (config) {
        var _a;
        var extensionEntitlementsPath = path.join(config.modRequest.platformProjectRoot, extensionName, "".concat(extensionName, ".entitlements"));
        var shareExtensionEntitlements = {
            'com.apple.security.application-groups': [
                "group.".concat((_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier),
            ],
        };
        fs.mkdirSync(path.dirname(extensionEntitlementsPath), {
            recursive: true,
        });
        fs.writeFileSync(extensionEntitlementsPath, plist_1.default.build(shareExtensionEntitlements));
        return config;
    });
};
exports.withExtensionEntitlements = withExtensionEntitlements;
