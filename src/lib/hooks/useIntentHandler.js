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
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { parseLinkingUrl } from '#/lib/parseLinkingUrl';
import { useSession } from '#/state/session';
import { useCloseAllActiveElements } from '#/state/util';
import { useIntentDialogs } from '#/components/intents/IntentDialogs';
import { useAnalytics } from '#/analytics';
import { IS_IOS, IS_NATIVE } from '#/env';
import { Referrer } from '../../../modules/expo-bluesky-swiss-army';
import { useApplyPullRequestOTAUpdate } from './useOTAUpdates';
var VALID_IMAGE_REGEX = /^[\w.:\-_/]+\|\d+(\.\d+)?\|\d+(\.\d+)?$/;
// This needs to stay outside of react to persist between account switches
var previousIntentUrl = '';
export function useIntentHandler() {
    var _this = this;
    var incomingUrl = Linking.useLinkingURL();
    var ax = useAnalytics();
    var composeIntent = useComposeIntent();
    var verifyEmailIntent = useVerifyEmailIntent();
    var currentAccount = useSession().currentAccount;
    var tryApplyUpdate = useApplyPullRequestOTAUpdate().tryApplyUpdate;
    React.useEffect(function () {
        var handleIncomingURL = function (url) { return __awaiter(_this, void 0, void 0, function () {
            var referrerInfo, urlp, _a, intent, intentType, isIntent, params, code, channel;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!IS_IOS) return [3 /*break*/, 2];
                        // Close in-app browser if it's open (iOS only)
                        return [4 /*yield*/, WebBrowser.dismissBrowser().catch(function () { })];
                    case 1:
                        // Close in-app browser if it's open (iOS only)
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        referrerInfo = Referrer.getReferrerInfo();
                        if (referrerInfo && referrerInfo.hostname !== 'bsky.app') {
                            ax.metric('deepLink:referrerReceived', {
                                to: url,
                                referrer: referrerInfo === null || referrerInfo === void 0 ? void 0 : referrerInfo.referrer,
                                hostname: referrerInfo === null || referrerInfo === void 0 ? void 0 : referrerInfo.hostname,
                            });
                        }
                        urlp = parseLinkingUrl(url);
                        _a = urlp.pathname.split('/'), intent = _a[1], intentType = _a[2];
                        isIntent = intent === 'intent';
                        params = urlp.searchParams;
                        if (!isIntent)
                            return [2 /*return*/];
                        switch (intentType) {
                            case 'compose': {
                                composeIntent({
                                    text: params.get('text'),
                                    imageUrisStr: params.get('imageUris'),
                                    videoUri: params.get('videoUri'),
                                });
                                return [2 /*return*/];
                            }
                            case 'verify-email': {
                                code = params.get('code');
                                if (!code)
                                    return [2 /*return*/];
                                verifyEmailIntent(code);
                                return [2 /*return*/];
                            }
                            case 'age-assurance': {
                                // Handled in `#/ageAssurance/components/RedirectOverlay.tsx`
                                return [2 /*return*/];
                            }
                            case 'apply-ota': {
                                channel = params.get('channel');
                                if (!channel) {
                                    Alert.alert('Error', 'No channel provided to look for.');
                                }
                                else {
                                    tryApplyUpdate(channel);
                                }
                                return [2 /*return*/];
                            }
                            default: {
                                return [2 /*return*/];
                            }
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        if (incomingUrl) {
            if (previousIntentUrl === incomingUrl) {
                return;
            }
            handleIncomingURL(incomingUrl);
            previousIntentUrl = incomingUrl;
        }
    }, [
        incomingUrl,
        ax,
        composeIntent,
        verifyEmailIntent,
        currentAccount,
        tryApplyUpdate,
    ]);
}
export function useComposeIntent() {
    var closeAllActiveElements = useCloseAllActiveElements();
    var openComposer = useOpenComposer().openComposer;
    var hasSession = useSession().hasSession;
    return React.useCallback(function (_a) {
        var text = _a.text, imageUrisStr = _a.imageUrisStr, videoUri = _a.videoUri;
        if (!hasSession)
            return;
        closeAllActiveElements();
        // Whenever a video URI is present, we don't support adding images right now.
        if (videoUri) {
            var _b = videoUri.split('|'), uri = _b[0], width = _b[1], height = _b[2];
            openComposer({
                text: text !== null && text !== void 0 ? text : undefined,
                videoUri: { uri: uri, width: Number(width), height: Number(height) },
            });
            return;
        }
        var imageUris = imageUrisStr === null || imageUrisStr === void 0 ? void 0 : imageUrisStr.split(',').filter(function (part) {
            // For some security, we're going to filter out any image uri that is external. We don't want someone to
            // be able to provide some link like "bluesky://intent/compose?imageUris=https://IHaveYourIpNow.com/image.jpeg
            // and we load that image
            if (part.includes('https://') || part.includes('http://')) {
                return false;
            }
            // We also should just filter out cases that don't have all the info we need
            return VALID_IMAGE_REGEX.test(part);
        }).map(function (part) {
            var _a = part.split('|'), uri = _a[0], width = _a[1], height = _a[2];
            return { uri: uri, width: Number(width), height: Number(height) };
        });
        setTimeout(function () {
            openComposer({
                text: text !== null && text !== void 0 ? text : undefined,
                imageUris: IS_NATIVE ? imageUris : undefined,
            });
        }, 500);
    }, [hasSession, closeAllActiveElements, openComposer]);
}
function useVerifyEmailIntent() {
    var closeAllActiveElements = useCloseAllActiveElements();
    var _a = useIntentDialogs(), control = _a.verifyEmailDialogControl, setState = _a.setVerifyEmailState;
    return React.useCallback(function (code) {
        closeAllActiveElements();
        setState({
            code: code,
        });
        setTimeout(function () {
            control.open();
        }, 1000);
    }, [closeAllActiveElements, control, setState]);
}
