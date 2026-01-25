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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { PROD_DEFAULT_FEED } from '#/lib/constants';
import { logger } from '#/logger';
import { usePreferencesQuery, useRemoveFeedMutation, useReplaceForYouWithDiscoverFeedMutation, } from '#/state/queries/preferences';
import { useSetSelectedFeed } from '#/state/shell/selected-feed';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
export function FeedShutdownMsg(_a) {
    var _this = this;
    var _b, _c;
    var feedUri = _a.feedUri;
    var t = useTheme();
    var _ = useLingui()._;
    var setSelectedFeed = useSetSelectedFeed();
    var preferences = usePreferencesQuery().data;
    var _d = useRemoveFeedMutation(), removeFeed = _d.mutateAsync, isRemovePending = _d.isPending;
    var _e = useReplaceForYouWithDiscoverFeedMutation(), replaceFeedWithDiscover = _e.mutateAsync, isReplacePending = _e.isPending;
    var feedConfig = (_b = preferences === null || preferences === void 0 ? void 0 : preferences.savedFeeds) === null || _b === void 0 ? void 0 : _b.find(function (f) { return f.value === feedUri && f.pinned; });
    var discoverFeedConfig = (_c = preferences === null || preferences === void 0 ? void 0 : preferences.savedFeeds) === null || _c === void 0 ? void 0 : _c.find(function (f) { return f.value === PROD_DEFAULT_FEED('whats-hot'); });
    var hasFeedPinned = Boolean(feedConfig);
    var hasDiscoverPinned = Boolean(discoverFeedConfig === null || discoverFeedConfig === void 0 ? void 0 : discoverFeedConfig.pinned);
    var onRemoveFeed = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (!feedConfig) return [3 /*break*/, 2];
                    return [4 /*yield*/, removeFeed(feedConfig)];
                case 1:
                    _a.sent();
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Removed from your feeds"], ["Removed from your feeds"])))));
                    _a.label = 2;
                case 2:
                    if (hasDiscoverPinned) {
                        setSelectedFeed("feedgen|".concat(PROD_DEFAULT_FEED('whats-hot')));
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["There was an issue updating your feeds, please check your internet connection and try again."], ["There was an issue updating your feeds, please check your internet connection and try again."])))), 'exclamation-circle');
                    logger.error('Failed to update feeds', { message: err_1 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [removeFeed, feedConfig, _, hasDiscoverPinned, setSelectedFeed]);
    var onReplaceFeed = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, replaceFeedWithDiscover({
                            forYouFeedConfig: feedConfig,
                            discoverFeedConfig: discoverFeedConfig,
                        })];
                case 1:
                    _a.sent();
                    setSelectedFeed("feedgen|".concat(PROD_DEFAULT_FEED('whats-hot')));
                    Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["The feed has been replaced with Discover."], ["The feed has been replaced with Discover."])))));
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["There was an issue updating your feeds, please check your internet connection and try again."], ["There was an issue updating your feeds, please check your internet connection and try again."])))), 'exclamation-circle');
                    logger.error('Failed to update feeds', { message: err_2 });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, [
        replaceFeedWithDiscover,
        discoverFeedConfig,
        feedConfig,
        setSelectedFeed,
        _,
    ]);
    var isProcessing = isReplacePending || isRemovePending;
    return (_jsxs(View, { style: [
            a.py_3xl,
            a.px_2xl,
            a.gap_xl,
            t.atoms.border_contrast_low,
            a.border_t,
        ], children: [_jsx(Text, { style: [a.text_5xl, a.font_semi_bold, t.atoms.text, a.text_center], children: ":(" }), _jsx(Text, { style: [a.text_md, a.leading_snug, t.atoms.text, a.text_center], children: _jsxs(Trans, { children: ["This feed is no longer online. We are showing", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["The Discover feed"], ["The Discover feed"])))), to: "/profile/bsky.app/feed/whats-hot", style: [a.text_md], children: "Discover" }), ' ', "instead."] }) }), hasFeedPinned ? (_jsxs(View, { style: [a.flex_row, a.justify_center, a.gap_sm], children: [_jsxs(Button, { variant: "outline", color: "primary", size: "small", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Remove feed"], ["Remove feed"])))), disabled: isProcessing, onPress: onRemoveFeed, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Remove feed" }) }), isRemovePending && _jsx(ButtonIcon, { icon: Loader })] }), !hasDiscoverPinned && (_jsxs(Button, { variant: "solid", color: "primary", size: "small", label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Replace with Discover"], ["Replace with Discover"])))), disabled: isProcessing, onPress: onReplaceFeed, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Replace with Discover" }) }), isReplacePending && _jsx(ButtonIcon, { icon: Loader })] }))] })) : undefined] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
