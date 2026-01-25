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
import { Platform } from 'react-native';
import { AtpAgent } from '@atproto/api';
import { useMutation } from '@tanstack/react-query';
import { wait } from '#/lib/async/wait';
import { DEV_ENV_APPVIEW, PUBLIC_APPVIEW, PUBLIC_APPVIEW_DID, } from '#/lib/constants';
import { isNetworkError } from '#/lib/hooks/useCleanError';
import { useAgent } from '#/state/session';
import { usePatchAgeAssuranceServerState } from '#/ageAssurance';
import { logger } from '#/ageAssurance/logger';
import { useAnalytics } from '#/analytics';
import { BLUESKY_PROXY_DID } from '#/env';
import { useGeolocation } from '#/geolocation';
var IS_DEV_ENV = BLUESKY_PROXY_DID !== PUBLIC_APPVIEW_DID;
var APPVIEW = IS_DEV_ENV ? DEV_ENV_APPVIEW : PUBLIC_APPVIEW;
export function useBeginAgeAssurance() {
    var ax = useAnalytics();
    var agent = useAgent();
    var geolocation = useGeolocation();
    var patchAgeAssuranceStateResponse = usePatchAgeAssuranceServerState();
    return useMutation({
        mutationFn: function (props) {
            return __awaiter(this, void 0, void 0, function () {
                var countryCode, regionCode, token, appView, data;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            countryCode = (_a = geolocation === null || geolocation === void 0 ? void 0 : geolocation.countryCode) === null || _a === void 0 ? void 0 : _a.toUpperCase();
                            regionCode = (_b = geolocation === null || geolocation === void 0 ? void 0 : geolocation.regionCode) === null || _b === void 0 ? void 0 : _b.toUpperCase();
                            if (!countryCode) {
                                throw new Error("Geolocation not available, cannot init age assurance.");
                            }
                            return [4 /*yield*/, agent.com.atproto.server.getServiceAuth({
                                    aud: BLUESKY_PROXY_DID,
                                    lxm: "app.bsky.ageassurance.begin",
                                })];
                        case 1:
                            token = (_c.sent()).data.token;
                            appView = new AtpAgent({ service: APPVIEW });
                            appView.sessionManager.session = __assign({}, agent.session);
                            appView.sessionManager.session.accessJwt = token;
                            appView.sessionManager.session.refreshJwt = '';
                            ax.metric('ageAssurance:api:begin', {
                                platform: Platform.OS,
                                countryCode: countryCode,
                                regionCode: regionCode,
                            });
                            return [4 /*yield*/, wait(2e3, appView.app.bsky.ageassurance.begin(__assign(__assign({}, props), { countryCode: countryCode, regionCode: regionCode })))
                                // Just keeps this in sync, not necessarily used right now
                            ];
                        case 2:
                            data = (_c.sent()).data;
                            // Just keeps this in sync, not necessarily used right now
                            patchAgeAssuranceStateResponse(data);
                            return [2 /*return*/];
                    }
                });
            });
        },
        onError: function (e) {
            if (!isNetworkError(e)) {
                logger.error("useBeginAgeAssurance failed", {
                    safeMessage: e,
                });
            }
        },
    });
}
