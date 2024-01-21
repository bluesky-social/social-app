"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withExtensionViewController = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var path = require("path");
var fs = require("fs");
var withExtensionViewController = function (config, _a) {
    var controllerName = _a.controllerName, extensionName = _a.extensionName;
    return (0, config_plugins_1.withXcodeProject)(config, function (config) {
        var controllerPath = path.join(config.modRequest.projectRoot, 'extensions', extensionName, "".concat(controllerName, ".swift"));
        var targetPath = path.join(config.modRequest.platformProjectRoot, extensionName, "".concat(controllerName, ".swift"));
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.copyFileSync(controllerPath, targetPath);
        return config;
    });
};
exports.withExtensionViewController = withExtensionViewController;
