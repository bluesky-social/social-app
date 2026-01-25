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
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { createPermissionHook } from 'expo-modules-core';
import { IS_NATIVE } from '#/env';
import * as debug from '#/geolocation/debug';
import { logger } from '#/geolocation/logger';
import { normalizeDeviceLocation } from '#/geolocation/util';
import { device } from '#/storage';
/**
 * Location.useForegroundPermissions on web just errors if the
 * navigator.permissions API is not available. We need to catch and ignore it,
 * since it's effectively denied.
 *
 * @see https://github.com/expo/expo/blob/72f1562ed9cce5ff6dfe04aa415b71632a3d4b87/packages/expo-location/src/Location.ts#L290-L293
 */
var useForegroundPermissions = createPermissionHook({
    getMethod: function () {
        return Location.getForegroundPermissionsAsync().catch(function (error) {
            logger.debug('useForegroundPermission: error getting location permissions', { safeMessage: error });
            return {
                status: Location.PermissionStatus.DENIED,
                granted: false,
                canAskAgain: false,
                expires: 0,
            };
        });
    },
    requestMethod: function () {
        return Location.requestForegroundPermissionsAsync().catch(function (error) {
            logger.debug('useForegroundPermission: error requesting location permissions', { safeMessage: error });
            return {
                status: Location.PermissionStatus.DENIED,
                granted: false,
                canAskAgain: false,
                expires: 0,
            };
        });
    },
});
export function getDeviceGeolocation() {
    return __awaiter(this, void 0, void 0, function () {
        var geocode, locations, location_1, normalized, e_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (debug.enabled && debug.deviceGeolocation)
                        return [2 /*return*/, debug.resolve(debug.deviceGeolocation)];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, Location.getCurrentPositionAsync()];
                case 2:
                    geocode = _c.sent();
                    return [4 /*yield*/, Location.reverseGeocodeAsync({
                            latitude: geocode.coords.latitude,
                            longitude: geocode.coords.longitude,
                        })];
                case 3:
                    locations = _c.sent();
                    location_1 = locations.at(0);
                    normalized = location_1 ? normalizeDeviceLocation(location_1) : undefined;
                    if ((normalized === null || normalized === void 0 ? void 0 : normalized.regionCode) && normalized.regionCode.length > 5) {
                        /*
                         * We want short codes only, and we're still seeing some full names here.
                         * 5 is just a heuristic for a region that is probably not formatted as a
                         * short code.
                         */
                        logger.error('getDeviceGeolocation: invalid regionCode', {
                            os: Platform.OS,
                            version: Platform.Version,
                            regionCode: normalized.regionCode,
                        });
                    }
                    return [2 /*return*/, {
                            countryCode: (_a = normalized === null || normalized === void 0 ? void 0 : normalized.countryCode) !== null && _a !== void 0 ? _a : undefined,
                            regionCode: (_b = normalized === null || normalized === void 0 ? void 0 : normalized.regionCode) !== null && _b !== void 0 ? _b : undefined,
                        }];
                case 4:
                    e_1 = _c.sent();
                    logger.error('getDeviceGeolocation: failed', { safeMessage: e_1 });
                    return [2 /*return*/, {
                            countryCode: undefined,
                            regionCode: undefined,
                        }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
export function useRequestDeviceGeolocation() {
    var _this = this;
    return useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var status;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Location.requestForegroundPermissionsAsync()];
                case 1:
                    status = _b.sent();
                    if (!status.granted) return [3 /*break*/, 3];
                    _a = {
                        granted: true
                    };
                    return [4 /*yield*/, getDeviceGeolocation()];
                case 2: return [2 /*return*/, (_a.location = _b.sent(),
                        _a)];
                case 3: return [2 /*return*/, {
                        granted: false,
                    }];
            }
        });
    }); }, []);
}
/**
 * Hook to get and sync the device geolocation from the device GPS and store it
 * using device storage. If permissions are not granted, it will clear any cached
 * storage value.
 */
export function useSyncDeviceGeolocationOnStartup(sync) {
    var synced = useRef(false);
    var status = useForegroundPermissions()[0];
    useEffect(function () {
        if (!IS_NATIVE)
            return;
        function get() {
            return __awaiter(this, void 0, void 0, function () {
                var location_2, hasCachedValue;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // no need to set this more than once per session
                            if (synced.current)
                                return [2 /*return*/];
                            logger.debug('useSyncDeviceGeolocationOnStartup: checking perms');
                            if (!(status === null || status === void 0 ? void 0 : status.granted)) return [3 /*break*/, 2];
                            return [4 /*yield*/, getDeviceGeolocation()];
                        case 1:
                            location_2 = _a.sent();
                            if (location_2) {
                                logger.debug('useSyncDeviceGeolocationOnStartup: got location');
                                sync(location_2);
                                synced.current = true;
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            hasCachedValue = device.get(['deviceGeolocation']) !== undefined;
                            /**
                             * If we have a cached value, but user has revoked permissions,
                             * quietly (will take effect lazily) clear this out.
                             */
                            if (hasCachedValue) {
                                logger.debug('useSyncDeviceGeolocationOnStartup: clearing cached location, perms revoked');
                                device.set(['deviceGeolocation'], undefined);
                            }
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
        get().catch(function (e) {
            logger.error('useSyncDeviceGeolocationOnStartup: failed to get location', {
                safeMessage: e,
            });
        });
    }, [status, sync]);
}
export function useIsDeviceGeolocationGranted() {
    var status = useForegroundPermissions()[0];
    return (status === null || status === void 0 ? void 0 : status.granted) === true;
}
