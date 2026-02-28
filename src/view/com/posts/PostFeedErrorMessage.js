var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { AppBskyFeedGetAuthorFeed, AtUri, } from '@atproto/api';
import { msg as msgLingui } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { usePalette } from '#/lib/hooks/usePalette';
import { cleanError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { useRemoveFeedMutation } from '#/state/queries/preferences';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as Prompt from '#/components/Prompt';
import { EmptyState } from '../util/EmptyState';
import { ErrorMessage } from '../util/error/ErrorMessage';
import { Button } from '../util/forms/Button';
import { Text } from '../util/text/Text';
import * as Toast from '../util/Toast';
export var KnownError;
(function (KnownError) {
    KnownError["Block"] = "Block";
    KnownError["FeedgenDoesNotExist"] = "FeedgenDoesNotExist";
    KnownError["FeedgenMisconfigured"] = "FeedgenMisconfigured";
    KnownError["FeedgenBadResponse"] = "FeedgenBadResponse";
    KnownError["FeedgenOffline"] = "FeedgenOffline";
    KnownError["FeedgenUnknown"] = "FeedgenUnknown";
    KnownError["FeedSignedInOnly"] = "FeedSignedInOnly";
    KnownError["FeedTooManyRequests"] = "FeedTooManyRequests";
    KnownError["Unknown"] = "Unknown";
})(KnownError || (KnownError = {}));
export function PostFeedErrorMessage(_a) {
    var feedDesc = _a.feedDesc, error = _a.error, onPressTryAgain = _a.onPressTryAgain, savedFeedConfig = _a.savedFeedConfig;
    var _l = useLingui()._;
    var knownError = React.useMemo(function () { return detectKnownError(feedDesc, error); }, [feedDesc, error]);
    if (typeof knownError !== 'undefined' &&
        knownError !== KnownError.Unknown &&
        feedDesc.startsWith('feedgen')) {
        return (_jsx(FeedgenErrorMessage, { feedDesc: feedDesc, knownError: knownError, rawError: error, savedFeedConfig: savedFeedConfig }));
    }
    if (knownError === KnownError.Block) {
        return (_jsx(EmptyState, { icon: WarningIcon, iconSize: "2xl", message: _l(msgLingui(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Posts hidden"], ["Posts hidden"])))), style: { paddingVertical: 40 } }));
    }
    return (_jsx(ErrorMessage, { message: cleanError(error), onPressTryAgain: onPressTryAgain }));
}
function FeedgenErrorMessage(_a) {
    var _this = this;
    var feedDesc = _a.feedDesc, knownError = _a.knownError, rawError = _a.rawError, savedFeedConfig = _a.savedFeedConfig;
    var pal = usePalette('default');
    var _l = useLingui()._;
    var navigation = useNavigation();
    var msg = React.useMemo(function () {
        var _a;
        return (_a = {},
            _a[KnownError.Unknown] = '',
            _a[KnownError.Block] = '',
            _a[KnownError.FeedgenDoesNotExist] = _l(msgLingui(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Hmm, we're having trouble finding this feed. It may have been deleted."], ["Hmm, we're having trouble finding this feed. It may have been deleted."])))),
            _a[KnownError.FeedgenMisconfigured] = _l(msgLingui(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Hmm, the feed server appears to be misconfigured. Please let the feed owner know about this issue."], ["Hmm, the feed server appears to be misconfigured. Please let the feed owner know about this issue."])))),
            _a[KnownError.FeedgenBadResponse] = _l(msgLingui(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Hmm, the feed server gave a bad response. Please let the feed owner know about this issue."], ["Hmm, the feed server gave a bad response. Please let the feed owner know about this issue."])))),
            _a[KnownError.FeedgenOffline] = _l(msgLingui(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Hmm, the feed server appears to be offline. Please let the feed owner know about this issue."], ["Hmm, the feed server appears to be offline. Please let the feed owner know about this issue."])))),
            _a[KnownError.FeedSignedInOnly] = _l(msgLingui(templateObject_6 || (templateObject_6 = __makeTemplateObject(["This content is not viewable without a Bluesky account."], ["This content is not viewable without a Bluesky account."])))),
            _a[KnownError.FeedgenUnknown] = _l(msgLingui(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Hmm, some kind of issue occurred when contacting the feed server. Please let the feed owner know about this issue."], ["Hmm, some kind of issue occurred when contacting the feed server. Please let the feed owner know about this issue."])))),
            _a[KnownError.FeedTooManyRequests] = _l(msgLingui(templateObject_8 || (templateObject_8 = __makeTemplateObject(["This feed is currently receiving high traffic and is temporarily unavailable. Please try again later."], ["This feed is currently receiving high traffic and is temporarily unavailable. Please try again later."])))),
            _a)[knownError];
    }, [_l, knownError]);
    var _b = feedDesc.split('|'), __ = _b[0], uri = _b[1];
    var ownerDid = safeParseFeedgenUri(uri)[0];
    var removePromptControl = Prompt.usePromptControl();
    var removeFeed = useRemoveFeedMutation().mutateAsync;
    var onViewProfile = React.useCallback(function () {
        navigation.navigate('Profile', { name: ownerDid });
    }, [navigation, ownerDid]);
    var onPressRemoveFeed = React.useCallback(function () {
        removePromptControl.open();
    }, [removePromptControl]);
    var onRemoveFeed = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!savedFeedConfig)
                        return [2 /*return*/];
                    return [4 /*yield*/, removeFeed(savedFeedConfig)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    Toast.show(_l(msgLingui(templateObject_9 || (templateObject_9 = __makeTemplateObject(["There was an issue removing this feed. Please check your internet connection and try again."], ["There was an issue removing this feed. Please check your internet connection and try again."])))), 'exclamation-circle');
                    logger.error('Failed to remove feed', { message: err_1 });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, [removeFeed, _l, savedFeedConfig]);
    var cta = React.useMemo(function () {
        switch (knownError) {
            case KnownError.FeedSignedInOnly: {
                return null;
            }
            case KnownError.FeedgenDoesNotExist:
            case KnownError.FeedgenMisconfigured:
            case KnownError.FeedgenBadResponse:
            case KnownError.FeedgenOffline:
            case KnownError.FeedgenUnknown: {
                return (_jsxs(View, { style: { flexDirection: 'row', alignItems: 'center', gap: 10 }, children: [knownError === KnownError.FeedgenDoesNotExist &&
                            savedFeedConfig && (_jsx(Button, { type: "inverted", label: _l(msgLingui(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Remove feed"], ["Remove feed"])))), onPress: onRemoveFeed })), _jsx(Button, { type: "default-light", label: _l(msgLingui(templateObject_11 || (templateObject_11 = __makeTemplateObject(["View profile"], ["View profile"])))), onPress: onViewProfile })] }));
            }
        }
    }, [knownError, onViewProfile, onRemoveFeed, _l, savedFeedConfig]);
    return (_jsxs(_Fragment, { children: [_jsxs(View, { style: [
                    pal.border,
                    pal.viewLight,
                    {
                        borderTopWidth: 1,
                        paddingHorizontal: 20,
                        paddingVertical: 18,
                        gap: 12,
                    },
                ], children: [_jsx(Text, { style: pal.text, children: msg }), (rawError === null || rawError === void 0 ? void 0 : rawError.message) && (_jsx(Text, { style: pal.textLight, children: _jsxs(Trans, { children: ["Message from server: ", rawError.message] }) })), cta] }), _jsx(Prompt.Basic, { control: removePromptControl, title: _l(msgLingui(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Remove feed?"], ["Remove feed?"])))), description: _l(msgLingui(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Remove this feed from your saved feeds"], ["Remove this feed from your saved feeds"])))), onConfirm: onPressRemoveFeed, confirmButtonCta: _l(msgLingui(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Remove"], ["Remove"])))), confirmButtonColor: "negative" })] }));
}
function safeParseFeedgenUri(uri) {
    try {
        var urip = new AtUri(uri);
        return [urip.hostname, urip.rkey];
    }
    catch (_a) {
        return ['', ''];
    }
}
function detectKnownError(feedDesc, error) {
    if (!error) {
        return undefined;
    }
    if (error instanceof AppBskyFeedGetAuthorFeed.BlockedActorError ||
        error instanceof AppBskyFeedGetAuthorFeed.BlockedByActorError) {
        return KnownError.Block;
    }
    // check status codes
    if ((error === null || error === void 0 ? void 0 : error.status) === 429) {
        return KnownError.FeedTooManyRequests;
    }
    // convert error to string and continue
    if (typeof error !== 'string') {
        error = error.toString();
    }
    if (error.includes(KnownError.FeedSignedInOnly)) {
        return KnownError.FeedSignedInOnly;
    }
    if (!feedDesc.startsWith('feedgen')) {
        return KnownError.Unknown;
    }
    if (error.includes('could not find feed')) {
        return KnownError.FeedgenDoesNotExist;
    }
    if (error.includes('feed unavailable')) {
        return KnownError.FeedgenOffline;
    }
    if (error.includes('invalid did document')) {
        return KnownError.FeedgenMisconfigured;
    }
    if (error.includes('could not resolve did document')) {
        return KnownError.FeedgenMisconfigured;
    }
    if (error.includes('invalid feed generator service details in did document')) {
        return KnownError.FeedgenMisconfigured;
    }
    if (error.includes('invalid response')) {
        return KnownError.FeedgenBadResponse;
    }
    return KnownError.FeedgenUnknown;
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14;
