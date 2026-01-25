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
import { MMKV } from '@bsky.app/react-native-mmkv';
import { setPolyfills } from '@growthbook/growthbook';
import { GrowthBook } from '@growthbook/growthbook-react';
import { getNavigationMetadata } from '#/analytics/metadata';
import * as env from '#/env';
export { Features } from '#/analytics/features/types';
var CACHE = new MMKV({ id: 'bsky_features_cache' });
setPolyfills({
    localStorage: {
        getItem: function (key) {
            var value = CACHE.getString(key);
            return value != null ? JSON.parse(value) : null;
        },
        setItem: function (key, value) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                CACHE.set(key, value);
                return [2 /*return*/];
            });
        }); },
    },
});
var TIMEOUT_INIT = 500; // TODO should base on p99 or something
var TIMEOUT_PREFER_LOW_LATENCY = 250;
var TIMEOUT_PREFER_FRESH_GATES = 1500;
export var features = new GrowthBook({
    apiHost: env.GROWTHBOOK_API_HOST,
    clientKey: env.GROWTHBOOK_CLIENT_KEY,
});
/**
 * Initializer promise that must be awaited before using the GrowthBook
 * instance or rendering the `AnalyticsFeaturesContext`. Note: this may not be
 * fully initialized if it takes longer than `TIMEOUT_INIT` to initialize. In
 * that case, we may see a flash of uncustomized content until the
 * initialization completes.
 */
export var init = new Promise(function (y) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, features.init({ timeout: TIMEOUT_INIT })];
            case 1:
                _a.sent();
                y();
                return [2 /*return*/];
        }
    });
}); });
/**
 * Refresh feature gates from GrowthBook. Updates attributes based on the
 * provided account, if any.
 */
export function refresh(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var strategy = _b.strategy;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, features.refreshFeatures({
                        timeout: strategy === 'prefer-low-latency'
                            ? TIMEOUT_PREFER_LOW_LATENCY
                            : TIMEOUT_PREFER_FRESH_GATES,
                    })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Converts our metadata into GrowthBook attributes and sets them. GrowthBook
 * attributes are manually configured in the GrowthBook dashboard. So these
 * values need to match exactly. Therefore, let's add them here manually to and
 * not spread them to avoid mistakes.
 */
export function setAttributes(_a) {
    var _b;
    var base = _a.base, geolocation = _a.geolocation, session = _a.session, preferences = _a.preferences;
    features.setAttributes({
        deviceId: base.deviceId,
        sessionId: base.sessionId,
        platform: base.platform,
        appVersion: base.appVersion,
        countryCode: geolocation.countryCode,
        regionCode: geolocation.regionCode,
        did: session === null || session === void 0 ? void 0 : session.did,
        isBskyPds: session === null || session === void 0 ? void 0 : session.isBskyPds,
        appLanguage: preferences === null || preferences === void 0 ? void 0 : preferences.appLanguage,
        contentLanguages: preferences === null || preferences === void 0 ? void 0 : preferences.contentLanguages,
        currentScreen: (_b = getNavigationMetadata()) === null || _b === void 0 ? void 0 : _b.currentScreen,
    });
}
