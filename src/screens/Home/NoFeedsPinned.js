var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { TID } from '@atproto/common-web';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { DISCOVER_SAVED_FEED, TIMELINE_SAVED_FEED } from '#/lib/constants';
import { useOverwriteSavedFeedsMutation } from '#/state/queries/preferences';
import { CenteredView } from '#/view/com/util/Views';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useHeaderOffset } from '#/components/hooks/useHeaderOffset';
import { ListSparkle_Stroke2_Corner0_Rounded as ListSparkle } from '#/components/icons/ListSparkle';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
export function NoFeedsPinned(_a) {
    var _this = this;
    var preferences = _a.preferences;
    var _ = useLingui()._;
    var headerOffset = useHeaderOffset();
    var _b = useOverwriteSavedFeedsMutation(), isPending = _b.isPending, overwriteSavedFeeds = _b.mutateAsync;
    var addRecommendedFeeds = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var skippedTimeline, skippedDiscover, remainingSavedFeeds, _i, _a, savedFeed, toSave;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    skippedTimeline = false;
                    skippedDiscover = false;
                    remainingSavedFeeds = [];
                    // remove first instance of both timeline and discover, since we're going to overwrite them
                    for (_i = 0, _a = preferences.savedFeeds; _i < _a.length; _i++) {
                        savedFeed = _a[_i];
                        if (savedFeed.type === 'timeline' && !skippedTimeline) {
                            skippedTimeline = true;
                        }
                        else if (savedFeed.value === DISCOVER_SAVED_FEED.value &&
                            !skippedDiscover) {
                            skippedDiscover = true;
                        }
                        else {
                            remainingSavedFeeds.push(savedFeed);
                        }
                    }
                    toSave = __spreadArray([
                        __assign(__assign({}, DISCOVER_SAVED_FEED), { pinned: true, id: TID.nextStr() }),
                        __assign(__assign({}, TIMELINE_SAVED_FEED), { pinned: true, id: TID.nextStr() })
                    ], remainingSavedFeeds, true);
                    return [4 /*yield*/, overwriteSavedFeeds(toSave)];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [overwriteSavedFeeds, preferences.savedFeeds]);
    return (_jsx(CenteredView, { sideBorders: true, style: [a.h_full_vh], children: _jsxs(View, { style: [
                a.align_center,
                a.h_full_vh,
                a.py_3xl,
                a.px_xl,
                {
                    paddingTop: headerOffset + a.py_3xl.paddingTop,
                },
            ], children: [_jsxs(View, { style: [a.align_center, a.gap_sm, a.pb_xl], children: [_jsx(Text, { style: [a.text_xl, a.font_semi_bold], children: _jsx(Trans, { children: "Whoops!" }) }), _jsx(Text, { style: [a.text_md, a.text_center, a.leading_snug, { maxWidth: 340 }], children: _jsx(Trans, { children: "Looks like you unpinned all your feeds. But don't worry, you can add some below \uD83D\uDE04" }) })] }), _jsxs(View, { style: [a.flex_row, a.gap_md, a.justify_center, a.flex_wrap], children: [_jsxs(Button, { disabled: isPending, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Apply default recommended feeds"], ["Apply default recommended feeds"])))), size: "large", variant: "solid", color: "primary", onPress: addRecommendedFeeds, children: [_jsx(ButtonIcon, { icon: Plus, position: "left" }), _jsx(ButtonText, { children: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Add recommended feeds"], ["Add recommended feeds"])))) })] }), _jsxs(Link, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Browse other feeds"], ["Browse other feeds"])))), to: "/feeds", size: "large", variant: "solid", color: "secondary", children: [_jsx(ButtonIcon, { icon: ListSparkle, position: "left" }), _jsx(ButtonText, { children: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Browse other feeds"], ["Browse other feeds"])))) })] })] })] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
