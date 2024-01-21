"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withXcodeTarget = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var withXcodeTarget = function (config, _a) {
    var extensionName = _a.extensionName, controllerName = _a.controllerName;
    // @ts-ignore
    return (0, config_plugins_1.withXcodeProject)(config, function (config) {
        var _a, _b;
        var pbxProject = config.modResults;
        var target = pbxProject.addTarget(extensionName, 'app_extension', extensionName);
        pbxProject.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
        pbxProject.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
        var pbxGroupKey = pbxProject.pbxCreateGroup(extensionName, extensionName);
        pbxProject.addFile("".concat(extensionName, "/Info.plist"), pbxGroupKey);
        pbxProject.addSourceFile("".concat(extensionName, "/").concat(controllerName, ".swift"), { target: target.uuid }, pbxGroupKey);
        var configurations = pbxProject.pbxXCBuildConfigurationSection();
        for (var key in configurations) {
            if (typeof configurations[key].buildSettings !== 'undefined') {
                var buildSettingsObj = configurations[key].buildSettings;
                if (typeof buildSettingsObj.PRODUCT_NAME !== 'undefined' &&
                    buildSettingsObj.PRODUCT_NAME === "\"".concat(extensionName, "\"")) {
                    buildSettingsObj.CLANG_ENABLE_MODULES = 'YES';
                    buildSettingsObj.INFOPLIST_FILE = "\"".concat(extensionName, "/Info.plist\"");
                    buildSettingsObj.CODE_SIGN_ENTITLEMENTS = "\"".concat(extensionName, "/").concat(extensionName, ".entitlements\"");
                    buildSettingsObj.CODE_SIGN_STYLE = 'Automatic';
                    buildSettingsObj.CURRENT_PROJECT_VERSION = "\"".concat((_a = config.ios) === null || _a === void 0 ? void 0 : _a.buildNumber, "\"");
                    buildSettingsObj.GENERATE_INFOPLIST_FILE = 'YES';
                    buildSettingsObj.MARKETING_VERSION = "\"".concat(config.version, "\"");
                    buildSettingsObj.PRODUCT_BUNDLE_IDENTIFIER = "\"".concat((_b = config.ios) === null || _b === void 0 ? void 0 : _b.bundleIdentifier, ".").concat(extensionName, "\"");
                    buildSettingsObj.SWIFT_EMIT_LOC_STRINGS = 'YES';
                    buildSettingsObj.SWIFT_VERSION = '5.0';
                    buildSettingsObj.TARGETED_DEVICE_FAMILY = "\"1,2\"";
                }
            }
        }
        return config;
    });
};
exports.withXcodeTarget = withXcodeTarget;
