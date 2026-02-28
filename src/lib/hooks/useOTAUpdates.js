var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import React from 'react';
import { Alert, AppState } from 'react-native';
import { nativeBuildVersion } from 'expo-application';
import { checkForUpdateAsync, fetchUpdateAsync, isEnabled, reloadAsync, setExtraParamAsync, useUpdates, } from 'expo-updates';
import { isNetworkError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { IS_ANDROID, IS_IOS, IS_TESTFLIGHT } from '#/env';
var MINIMUM_MINIMIZE_TIME = 15 * 60e3;
function setExtraParams() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, setExtraParamAsync(IS_IOS ? 'ios-build-number' : 'android-build-number', 
                    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
                    // This just ensures it gets passed as a string
                    "".concat(nativeBuildVersion))];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, setExtraParamAsync('channel', IS_TESTFLIGHT ? 'testflight' : 'production')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function setExtraParamsPullRequest(channel) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, setExtraParamAsync(IS_IOS ? 'ios-build-number' : 'android-build-number', 
                    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
                    // This just ensures it gets passed as a string
                    "".concat(nativeBuildVersion))];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, setExtraParamAsync('channel', channel)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function updateTestflight() {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, setExtraParams()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, checkForUpdateAsync()];
                case 2:
                    res = _a.sent();
                    if (!res.isAvailable) return [3 /*break*/, 4];
                    return [4 /*yield*/, fetchUpdateAsync()];
                case 3:
                    _a.sent();
                    Alert.alert('Update Available', 'A new version of the app is available. Relaunch now?', [
                        {
                            text: 'No',
                            style: 'cancel',
                        },
                        {
                            text: 'Relaunch',
                            style: 'default',
                            onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, reloadAsync()];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                        },
                    ]);
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
export function useApplyPullRequestOTAUpdate() {
    var _this = this;
    var currentlyRunning = useUpdates().currentlyRunning;
    var _a = React.useState(false), pending = _a[0], setPending = _a[1];
    var currentChannel = currentlyRunning === null || currentlyRunning === void 0 ? void 0 : currentlyRunning.channel;
    var isCurrentlyRunningPullRequestDeployment = currentChannel === null || currentChannel === void 0 ? void 0 : currentChannel.startsWith('pull-request');
    var tryApplyUpdate = function (channel) { return __awaiter(_this, void 0, void 0, function () {
        var res;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPending(true);
                    return [4 /*yield*/, setExtraParamsPullRequest(channel)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, checkForUpdateAsync()];
                case 2:
                    res = _a.sent();
                    if (res.isAvailable) {
                        Alert.alert('Deployment Available', "A deployment of ".concat(channel, " is availalble. Applying this deployment may result in a bricked installation, in which case you will need to reinstall the app and may lose local data. Are you sure you want to proceed?"), [
                            {
                                text: 'No',
                                style: 'cancel',
                            },
                            {
                                text: 'Relaunch',
                                style: 'default',
                                onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, fetchUpdateAsync()];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, reloadAsync()];
                                            case 2:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); },
                            },
                        ]);
                    }
                    else {
                        Alert.alert('No Deployment Available', "No new deployments of ".concat(channel, " are currently available for your current native build."));
                    }
                    setPending(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var revertToEmbedded = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, updateTestflight()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    logger.error('Internal OTA Update Error', { error: "".concat(e_1) });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return {
        tryApplyUpdate: tryApplyUpdate,
        revertToEmbedded: revertToEmbedded,
        isCurrentlyRunningPullRequestDeployment: isCurrentlyRunningPullRequestDeployment,
        currentChannel: currentChannel,
        pending: pending,
    };
}
export function useOTAUpdates() {
    var _this = this;
    var shouldReceiveUpdates = isEnabled && !__DEV__;
    var appState = React.useRef('active');
    var lastMinimize = React.useRef(0);
    var ranInitialCheck = React.useRef(false);
    var timeout = React.useRef(undefined);
    var _a = useUpdates(), currentlyRunning = _a.currentlyRunning, isUpdatePending = _a.isUpdatePending;
    var currentChannel = currentlyRunning === null || currentlyRunning === void 0 ? void 0 : currentlyRunning.channel;
    var setCheckTimeout = React.useCallback(function () {
        timeout.current = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
            var res, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, setExtraParams()];
                    case 1:
                        _a.sent();
                        logger.debug('Checking for update...');
                        return [4 /*yield*/, checkForUpdateAsync()];
                    case 2:
                        res = _a.sent();
                        if (!res.isAvailable) return [3 /*break*/, 4];
                        logger.debug('Attempting to fetch update...');
                        return [4 /*yield*/, fetchUpdateAsync()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        logger.debug('No update available.');
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        err_1 = _a.sent();
                        if (!isNetworkError(err_1)) {
                            logger.error('OTA Update Error', { safeMessage: err_1 });
                        }
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        }); }, 10e3);
    }, []);
    var onIsTestFlight = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, updateTestflight()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    if (!isNetworkError(err_2)) {
                        logger.error('Internal OTA Update Error', { safeMessage: err_2 });
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, []);
    React.useEffect(function () {
        // We don't need to check anything if the current update is a PR update
        if (currentChannel === null || currentChannel === void 0 ? void 0 : currentChannel.startsWith('pull-request')) {
            return;
        }
        // We use this setTimeout to allow analytics to initialize before we check for an update
        // For Testflight users, we can prompt the user to update immediately whenever there's an available update. This
        // is suspect however with the Apple App Store guidelines, so we don't want to prompt production users to update
        // immediately.
        if (IS_TESTFLIGHT) {
            onIsTestFlight();
            return;
        }
        else if (!shouldReceiveUpdates || ranInitialCheck.current) {
            return;
        }
        setCheckTimeout();
        ranInitialCheck.current = true;
    }, [onIsTestFlight, currentChannel, setCheckTimeout, shouldReceiveUpdates]);
    // After the app has been minimized for 15 minutes, we want to either A. install an update if one has become available
    // or B check for an update again.
    React.useEffect(function () {
        // We also don't start this timeout if the user is on a pull request update
        if (!isEnabled || (currentChannel === null || currentChannel === void 0 ? void 0 : currentChannel.startsWith('pull-request'))) {
            return;
        }
        // TEMP: disable wake-from-background OTA loading on Android.
        // This is causing a crash when the thread view is open due to
        // `maintainVisibleContentPosition`. See repro repo for more details:
        // https://github.com/mozzius/ota-crash-repro
        // Old Arch only - re-enable once we're on the New Archictecture! -sfn
        if (IS_ANDROID)
            return;
        var subscription = AppState.addEventListener('change', function (nextAppState) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(appState.current.match(/inactive|background/) &&
                            nextAppState === 'active')) return [3 /*break*/, 4];
                        if (!(lastMinimize.current <= Date.now() - MINIMUM_MINIMIZE_TIME)) return [3 /*break*/, 3];
                        if (!isUpdatePending) return [3 /*break*/, 2];
                        return [4 /*yield*/, reloadAsync()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        setCheckTimeout();
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        lastMinimize.current = Date.now();
                        _a.label = 5;
                    case 5:
                        appState.current = nextAppState;
                        return [2 /*return*/];
                }
            });
        }); });
        return function () {
            clearTimeout(timeout.current);
            subscription.remove();
        };
    }, [isUpdatePending, currentChannel, setCheckTimeout]);
}
