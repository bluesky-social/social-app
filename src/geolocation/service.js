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
import { useEffect, useState } from 'react';
import EventEmitter from 'eventemitter3';
import { networkRetry } from '#/lib/async/retry';
import { FALLBACK_GEOLOCATION_SERVICE_RESPONSE, GEOLOCATION_SERVICE_URL, } from '#/geolocation/const';
import * as debug from '#/geolocation/debug';
import { logger } from '#/geolocation/logger';
import { device } from '#/storage';
var events = new EventEmitter();
var EVENT = 'geolocation-service-response-updated';
var emitGeolocationServiceResponseUpdate = function (data) {
    events.emit(EVENT, data);
};
var onGeolocationServiceResponseUpdate = function (listener) {
    events.on(EVENT, listener);
    return function () {
        events.off(EVENT, listener);
    };
};
function fetchGeolocationServiceData(url) {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (debug.enabled)
                        return [2 /*return*/, debug.resolve(debug.geolocation)];
                    return [4 /*yield*/, fetch(url)];
                case 1:
                    res = _a.sent();
                    if (!res.ok) {
                        throw new Error("fetchGeolocationServiceData failed ".concat(res.status));
                    }
                    return [2 /*return*/, res.json()];
            }
        });
    });
}
/**
 * Local promise used within this file only.
 */
var geolocationServicePromise;
/**
 * Begin the process of resolving geolocation config. This is called right away
 * at app start, and the promise is awaited later before proceeding with app
 * startup.
 */
export function resolve() {
    return __awaiter(this, void 0, void 0, function () {
        var cached, success;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!geolocationServicePromise) return [3 /*break*/, 4];
                    cached = device.get(['geolocationServiceResponse']);
                    if (!cached) return [3 /*break*/, 1];
                    logger.debug("resolve(): using cache");
                    return [3 /*break*/, 3];
                case 1:
                    logger.debug("resolve(): no cache");
                    return [4 /*yield*/, geolocationServicePromise];
                case 2:
                    success = (_a.sent()).success;
                    if (success) {
                        logger.debug("resolve(): resolved");
                    }
                    else {
                        logger.info("resolve(): failed");
                    }
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    logger.debug("resolve(): initiating");
                    /**
                     * THIS PROMISE SHOULD NEVER `reject()`! We want the app to proceed with
                     * startup, even if geolocation resolution fails.
                     */
                    geolocationServicePromise = new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                        function cacheResponseOrThrow(response) {
                            if (response) {
                                device.set(['geolocationServiceResponse'], response);
                                emitGeolocationServiceResponseUpdate(response);
                            }
                            else {
                                // endpoint should throw on all failures, this is insurance
                                throw new Error("fetchGeolocationServiceData returned no data");
                            }
                        }
                        var success, config, e_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    success = false;
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, 4, 5]);
                                    return [4 /*yield*/, fetchGeolocationServiceData(GEOLOCATION_SERVICE_URL)];
                                case 2:
                                    config = _a.sent();
                                    cacheResponseOrThrow(config);
                                    success = true;
                                    return [3 /*break*/, 5];
                                case 3:
                                    e_1 = _a.sent();
                                    logger.debug("resolve(): fetchGeolocationServiceData failed initial request", {
                                        safeMessage: e_1.message,
                                    });
                                    // retry 3 times, but don't await, proceed with default
                                    networkRetry(3, function () {
                                        return fetchGeolocationServiceData(GEOLOCATION_SERVICE_URL);
                                    })
                                        .then(function (config) {
                                        cacheResponseOrThrow(config);
                                    })
                                        .catch(function (e) {
                                        // complete fail closed
                                        logger.debug("resolve(): fetchGeolocationServiceData failed retries", {
                                            safeMessage: e.message,
                                        });
                                    });
                                    return [3 /*break*/, 5];
                                case 4:
                                    resolve({ success: success });
                                    return [7 /*endfinally*/];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
export function useGeolocationServiceResponse() {
    var _a = useState(function () {
        var initial = device.get(['geolocationServiceResponse']) ||
            FALLBACK_GEOLOCATION_SERVICE_RESPONSE;
        return initial;
    }), config = _a[0], setConfig = _a[1];
    useEffect(function () {
        return onGeolocationServiceResponseUpdate(function (config) {
            setConfig(config);
        });
    }, []);
    return config;
}
