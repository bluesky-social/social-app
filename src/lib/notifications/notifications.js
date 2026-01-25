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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getBadgeCountAsync, setBadgeCountAsync } from 'expo-notifications';
import debounce from 'lodash.debounce';
import { BLUESKY_NOTIF_SERVICE_HEADERS, PUBLIC_APPVIEW_DID, PUBLIC_STAGING_APPVIEW_DID, } from '#/lib/constants';
import { logger as notyLogger } from '#/lib/notifications/util';
import { isNetworkError } from '#/lib/strings/errors';
import { useAgent, useSession } from '#/state/session';
import BackgroundNotificationHandler from '#/../modules/expo-background-notification-handler';
import { useAgeAssurance } from '#/ageAssurance';
import { useAnalytics } from '#/analytics';
import { IS_DEV, IS_NATIVE } from '#/env';
/**
 * @private
 * Registers the device's push notification token with the Bluesky server.
 */
function _registerPushToken(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var payload, error_1;
        var _c, _d;
        var agent = _b.agent, currentAccount = _b.currentAccount, token = _b.token, _e = _b.extra, extra = _e === void 0 ? {} : _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 2, , 3]);
                    payload = {
                        serviceDid: ((_c = currentAccount.service) === null || _c === void 0 ? void 0 : _c.includes('staging'))
                            ? PUBLIC_STAGING_APPVIEW_DID
                            : PUBLIC_APPVIEW_DID,
                        platform: Platform.OS,
                        token: token.data,
                        appId: 'xyz.blueskyweb.app',
                        ageRestricted: (_d = extra.ageRestricted) !== null && _d !== void 0 ? _d : false,
                    };
                    notyLogger.debug("registerPushToken: registering", __assign({}, payload));
                    return [4 /*yield*/, agent.app.bsky.notification.registerPush(payload, {
                            headers: BLUESKY_NOTIF_SERVICE_HEADERS,
                        })];
                case 1:
                    _f.sent();
                    notyLogger.debug("registerPushToken: success");
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _f.sent();
                    if (!isNetworkError(error_1)) {
                        notyLogger.error("registerPushToken: failed", { safeMessage: error_1 });
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * @private
 * Debounced version of `_registerPushToken` to prevent multiple calls.
 */
var _registerPushTokenDebounced = debounce(_registerPushToken, 100);
/**
 * Hook to register the device's push notification token with the Bluesky. If
 * the user is not logged in, this will do nothing.
 *
 * Use this instead of using `_registerPushToken` or
 * `_registerPushTokenDebounced` directly.
 */
export function useRegisterPushToken() {
    var agent = useAgent();
    var currentAccount = useSession().currentAccount;
    return useCallback(function (_a) {
        var token = _a.token, isAgeRestricted = _a.isAgeRestricted;
        if (!currentAccount)
            return;
        return _registerPushTokenDebounced({
            agent: agent,
            currentAccount: currentAccount,
            token: token,
            extra: {
                ageRestricted: isAgeRestricted,
            },
        });
    }, [agent, currentAccount]);
}
/**
 * Retreive the device's push notification token, if permissions are granted.
 */
function getPushToken() {
    return __awaiter(this, void 0, void 0, function () {
        var granted;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Notifications.getPermissionsAsync()];
                case 1:
                    granted = (_a.sent()).granted;
                    notyLogger.debug("getPushToken", { granted: granted });
                    if (granted) {
                        return [2 /*return*/, Notifications.getDevicePushTokenAsync()];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Hook to get the device push token and register it with the Bluesky server.
 * Should only be called after a user has logged-in, since registration is an
 * authed endpoint.
 *
 * N.B. A previous regression in `expo-notifications` caused
 * `addPushTokenListener` to not fire on Android after calling
 * `getPushToken()`. Therefore, as insurance, we also call
 * `registerPushToken` here.
 *
 * Because `registerPushToken` is debounced, even if the the listener _does_
 * fire, it's OK to also call `registerPushToken` below since only a single
 * call will be made to the server (ideally). This does race the listener (if
 * it fires), so there's a possibility that multiple calls will be made, but
 * that is acceptable.
 *
 * @see https://github.com/expo/expo/issues/28656
 * @see https://github.com/expo/expo/issues/29909
 * @see https://github.com/bluesky-social/social-app/pull/4467
 */
export function useGetAndRegisterPushToken() {
    var _this = this;
    var aa = useAgeAssurance();
    var registerPushToken = useRegisterPushToken();
    return useCallback(function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (_a) {
            var token;
            var _b = _a === void 0 ? {} : _a, isAgeRestrictedOverride = _b.isAgeRestricted;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!IS_NATIVE || IS_DEV)
                            return [2 /*return*/];
                        return [4 /*yield*/, getPushToken()];
                    case 1:
                        token = _c.sent();
                        notyLogger.debug("useGetAndRegisterPushToken", {
                            token: token !== null && token !== void 0 ? token : 'undefined',
                        });
                        if (token) {
                            /**
                             * The listener should have registered the token already, but just in
                             * case, call the debounced function again.
                             */
                            registerPushToken({
                                token: token,
                                isAgeRestricted: isAgeRestrictedOverride !== null && isAgeRestrictedOverride !== void 0 ? isAgeRestrictedOverride : aa.state.access !== aa.Access.Full,
                            });
                        }
                        return [2 /*return*/, token];
                }
            });
        });
    }, [registerPushToken, aa]);
}
/**
 * Hook to register the device's push notification token with the Bluesky
 * server, as well as listen for push token updates, should they occurr.
 *
 * Registered via the shell, which wraps the navigation stack, meaning if we
 * have a current account, this handling will be registered and ready to go.
 */
export function useNotificationsRegistration() {
    var _this = this;
    var currentAccount = useSession().currentAccount;
    var registerPushToken = useRegisterPushToken();
    var getAndRegisterPushToken = useGetAndRegisterPushToken();
    var aa = useAgeAssurance();
    useEffect(function () {
        /**
         * We want this to init right away _after_ we have a logged in user, and
         * _after_ we've loaded their age assurance state.
         */
        if (!currentAccount)
            return;
        notyLogger.debug("useNotificationsRegistration");
        /**
         * Init push token, if permissions are granted already. If they weren't,
         * they'll be requested by the `useRequestNotificationsPermission` hook
         * below.
         */
        getAndRegisterPushToken();
        /**
         * Register the push token with the Bluesky server, whenever it changes.
         * This is also fired any time `getDevicePushTokenAsync` is called.
         *
         * Since this is registered immediately after `getAndRegisterPushToken`, it
         * should also detect that getter and be fired almost immediately after this.
         *
         * According to the Expo docs, there is a chance that the token will change
         * while the app is open in some rare cases. This will fire
         * `registerPushToken` whenever that happens.
         *
         * @see https://docs.expo.dev/versions/latest/sdk/notifications/#addpushtokenlistenerlistener
         */
        var subscription = Notifications.addPushTokenListener(function (token) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                registerPushToken({
                    token: token,
                    isAgeRestricted: aa.state.access !== aa.Access.Full,
                });
                notyLogger.debug("addPushTokenListener callback", { token: token });
                return [2 /*return*/];
            });
        }); });
        return function () {
            subscription.remove();
        };
    }, [currentAccount, getAndRegisterPushToken, registerPushToken, aa]);
}
export function useRequestNotificationsPermission() {
    var _this = this;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var getAndRegisterPushToken = useGetAndRegisterPushToken();
    return function (context) { return __awaiter(_this, void 0, void 0, function () {
        var permissions, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Notifications.getPermissionsAsync()];
                case 1:
                    permissions = _a.sent();
                    if (!IS_NATIVE ||
                        (permissions === null || permissions === void 0 ? void 0 : permissions.status) === 'granted' ||
                        ((permissions === null || permissions === void 0 ? void 0 : permissions.status) === 'denied' && !permissions.canAskAgain)) {
                        return [2 /*return*/];
                    }
                    if (context === 'AfterOnboarding') {
                        return [2 /*return*/];
                    }
                    if (context === 'Home' && !currentAccount) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, Notifications.requestPermissionsAsync()];
                case 2:
                    res = _a.sent();
                    ax.metric("notifications:request", {
                        context: context,
                        status: res.status,
                    });
                    if (res.granted) {
                        if (currentAccount) {
                            /**
                             * If we have an account in scope, we can safely call
                             * `getAndRegisterPushToken`.
                             */
                            getAndRegisterPushToken();
                        }
                        else {
                            /**
                             * Right after login, `currentAccount` in this scope will be undefined,
                             * but calling `getPushToken` will result in `addPushTokenListener`
                             * listeners being called, which will handle the registration with the
                             * Bluesky server.
                             */
                            getPushToken();
                        }
                    }
                    return [2 /*return*/];
            }
        });
    }); };
}
export function decrementBadgeCount(by) {
    return __awaiter(this, void 0, void 0, function () {
        var count;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!IS_NATIVE)
                        return [2 /*return*/];
                    return [4 /*yield*/, getBadgeCountAsync()];
                case 1:
                    count = _a.sent();
                    count -= by;
                    if (count < 0) {
                        count = 0;
                    }
                    return [4 /*yield*/, BackgroundNotificationHandler.setBadgeCountAsync(count)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, setBadgeCountAsync(count)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function resetBadgeCount() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, BackgroundNotificationHandler.setBadgeCountAsync(0)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, setBadgeCountAsync(0)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function unregisterPushToken(agents) {
    return __awaiter(this, void 0, void 0, function () {
        var token, _i, agents_1, agent, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!IS_NATIVE)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, getPushToken()];
                case 2:
                    token = _b.sent();
                    if (!token) return [3 /*break*/, 7];
                    _i = 0, agents_1 = agents;
                    _b.label = 3;
                case 3:
                    if (!(_i < agents_1.length)) return [3 /*break*/, 6];
                    agent = agents_1[_i];
                    return [4 /*yield*/, agent.app.bsky.notification.unregisterPush({
                            serviceDid: agent.serviceUrl.hostname.includes('staging')
                                ? PUBLIC_STAGING_APPVIEW_DID
                                : PUBLIC_APPVIEW_DID,
                            platform: Platform.OS,
                            token: token.data,
                            appId: 'xyz.blueskyweb.app',
                        }, {
                            headers: BLUESKY_NOTIF_SERVICE_HEADERS,
                        })];
                case 4:
                    _b.sent();
                    notyLogger.debug("Push token unregistered for ".concat((_a = agent.session) === null || _a === void 0 ? void 0 : _a.handle));
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 8];
                case 7:
                    notyLogger.debug('Tried to unregister push token, but could not find one');
                    _b.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_2 = _b.sent();
                    notyLogger.debug('Failed to unregister push token', { message: error_2 });
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
