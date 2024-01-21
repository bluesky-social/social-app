"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withExtensionInfoPlist = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var plist_1 = require("@expo/plist");
var path = require("path");
var fs = require("fs");
var withExtensionInfoPlist = function (config, _a) {
    var extensionName = _a.extensionName;
    return (0, config_plugins_1.withInfoPlist)(config, function (config) {
        var plistPath = path.join(config.modRequest.projectRoot, 'extensions', extensionName, 'Info.plist');
        var targetPath = path.join(config.modRequest.platformProjectRoot, extensionName, 'Info.plist');
        var extPlist = plist_1.default.parse(fs.readFileSync(plistPath).toString());
        extPlist.MainAppScheme = config.scheme;
        extPlist.CFBundleName = '$(PRODUCT_NAME)';
        extPlist.CFBundleDisplayName = 'Extension';
        extPlist.CFBundleIdentifier = '$(PRODUCT_BUNDLE_IDENTIFIER)';
        extPlist.CFBundleVersion = '$(CURRENT_PROJECT_VERSION)';
        extPlist.CFBundleExecutable = '$(EXECUTABLE_NAME)';
        extPlist.CFBundlePackageType = '$(PRODUCT_BUNDLE_PACKAGE_TYPE)';
        extPlist.CFBundleShortVersionString = '$(MARKETING_VERSION)';
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, plist_1.default.build(extPlist));
        return config;
    });
};
exports.withExtensionInfoPlist = withExtensionInfoPlist;
