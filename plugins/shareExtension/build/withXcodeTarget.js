"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withXcodeTarget = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var withXcodeTarget = function (config, _a) {
    var extensionName = _a.extensionName, controllerName = _a.controllerName;
    // @ts-ignore
    return (0, config_plugins_1.withXcodeProject)(config, function (config) {
        var _a, _b, _c;
        var proj = config.modResults;
        if (((_a = proj.getFirstProject().firstProject.targets) === null || _a === void 0 ? void 0 : _a.length) > 1)
            return true;
        var targetUuid = proj.generateUuid();
        var groupName = 'Embed Share Extensions';
        var commonBuildSettings = {
            ASSETCATALOG_COMPILER_APPICON_NAME: 'AppIcon',
            CLANG_ENABLE_MODULES: 'YES',
            CODE_SIGN_ENTITLEMENTS: "".concat(extensionName, "/").concat(extensionName, ".entitlements"),
            CURRENT_PROJECT_VERSION: "\"".concat((_b = config.ios) === null || _b === void 0 ? void 0 : _b.buildNumber, "\""),
            INFOPLIST_FILE: "".concat(extensionName, "/Info.plist"),
            MARKETING_VERSION: "\"".concat(config.version, "\""),
            PRODUCT_BUNDLE_IDENTIFIER: "".concat((_c = config.ios) === null || _c === void 0 ? void 0 : _c.bundleIdentifier, ".").concat(extensionName),
            PRODUCT_NAME: extensionName,
            TARGETED_DEVICE_FAMILY: '"1,2"',
            SWIFT_VERSION: '5.0',
            IPHONEOS_DEPLOYMENT_TARGET: '13.4',
            VERSIONING_SYSTEM: 'apple-generic',
        };
        var buildConfigurationsList = [
            {
                name: 'Debug',
                isa: 'XCBuildConfiguration',
                buildSettings: __assign({}, commonBuildSettings),
            },
            {
                name: 'Release',
                isa: 'XCBuildConfiguration',
                buildSettings: __assign({}, commonBuildSettings),
            },
        ];
        var xCConfigurationList = proj.addXCConfigurationList(buildConfigurationsList, 'Release', "Build configuration list for PBXNativeTarget \"".concat(extensionName, "\" "));
        var productFile = {
            basename: "".concat(extensionName, ".appex"),
            fileRef: proj.generateUuid(),
            uuid: proj.generateUuid(),
            groupName: groupName,
            explicitFileType: 'wrapper.application',
            settings: {
                ATTRIBUTES: ['RemoveHeadersOnCopy'],
            },
            includeIndex: 0,
            path: "".concat(extensionName, "/").concat(extensionName, ".appex"),
            sourceTree: 'BUILD_PRODUCTS_DIR',
        };
        proj.addToPbxFileReferenceSection(productFile);
        proj.addToPbxBuildFileSection(productFile);
        var target = {
            uuid: targetUuid,
            pbxNativeTarget: {
                isa: 'PBXNativeTarget',
                name: extensionName,
                productName: extensionName,
                productReference: productFile.fileRef,
                productType: "\"com.apple.product-type.app-extension\"",
                buildConfigurationList: xCConfigurationList.uuid,
                buildPhases: [],
                buildRules: [],
                dependencies: [],
            },
        };
        proj.addToPbxNativeTargetSection(target);
        proj.addToPbxProjectSection(target);
        // Add target attributes to project section
        if (!proj.pbxProjectSection()[proj.getFirstProject().uuid].attributes
            .TargetAttributes) {
            proj.pbxProjectSection()[proj.getFirstProject().uuid].attributes.TargetAttributes = {};
        }
        proj.pbxProjectSection()[proj.getFirstProject().uuid].attributes.TargetAttributes[target.uuid] = {
            CreatedOnToolsVersion: '13.4',
        };
        if (!proj.hash.project.objects.PBXTargetDependency) {
            proj.hash.project.objects.PBXTargetDependency = {};
        }
        if (!proj.hash.project.objects.PBXContainerItemProxy) {
            proj.hash.project.objects.PBXContainerItemProxy = {};
        }
        proj.addTargetDependency(proj.getFirstTarget().uuid, [target.uuid]);
        var buildPath = "\"".concat(extensionName, "/\"");
        /**
         * HELLO LOOK AT ME SEE ME SENPAI
         *
         * If pod installs ever break, it could be because of this. I'm not sure if this is actually the correct way to go
         * about this, as there are various RN bug reports and Expo bug reports about the file names here. For now, it works
         * fine though!!
         */
        // Sources build phase
        proj.addBuildPhase(["".concat(extensionName, "/").concat(controllerName, ".swift")], 'PBXSourcesBuildPhase', groupName, targetUuid, 'app_extension', buildPath);
        // Copy files build phase
        proj.addBuildPhase([productFile.path], 'PBXCopyFilesBuildPhase', groupName, proj.getFirstTarget().uuid, 'app_extension', buildPath);
        // Frameworks build phase
        proj.addBuildPhase([], 'PBXFrameworksBuildPhase', groupName, targetUuid, 'app_extension', buildPath);
        // Add PBX group
        var pbxGroupUuid = proj.addPbxGroup([
            "".concat(extensionName, "/Info.plist"),
            "".concat(extensionName, "/").concat(controllerName, ".swift"),
        ], extensionName, "\"\"").uuid;
        // Add PBXGroup to top level group
        var groups = proj.hash.project.objects.PBXGroup;
        if (pbxGroupUuid) {
            Object.keys(groups).forEach(function (key) {
                if (groups[key].name === undefined && groups[key].path === undefined) {
                    proj.addToPbxGroup(pbxGroupUuid, key);
                }
            });
        }
        return config;
    });
};
exports.withXcodeTarget = withXcodeTarget;
