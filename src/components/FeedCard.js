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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AtUri, RichText as RichTextApi, } from '@atproto/api';
import { msg, Plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { sanitizeHandle } from '#/lib/strings/handles';
import { logger } from '#/logger';
import { precacheFeedFromGeneratorView } from '#/state/queries/feed';
import { useAddSavedFeedsMutation, usePreferencesQuery, useRemoveFeedMutation, } from '#/state/queries/preferences';
import { useSession } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, select, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText, } from '#/components/Button';
import { Live_Stroke2_Corner0_Rounded as LiveIcon } from '#/components/icons/Live';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Link as InternalLink } from '#/components/Link';
import { Loader } from '#/components/Loader';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';
import { useActiveLiveEventFeedUris } from '#/features/liveEvents/context';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from './icons/Trash';
export function Default(props) {
    var view = props.view;
    return (_jsx(Link, __assign({}, props, { children: _jsxs(Outer, { children: [_jsxs(Header, { children: [_jsx(Avatar, { src: view.avatar }), _jsx(TitleAndByline, { title: view.displayName, creator: view.creator, uri: view.uri }), _jsx(SaveButton, { view: view, pin: true })] }), _jsx(Description, { description: view.description }), _jsx(Likes, { count: view.likeCount || 0 })] }) })));
}
export function Link(_a) {
    var view = _a.view, children = _a.children, props = __rest(_a, ["view", "children"]);
    var queryClient = useQueryClient();
    var href = React.useMemo(function () {
        return createProfileFeedHref({ feed: view });
    }, [view]);
    React.useEffect(function () {
        precacheFeedFromGeneratorView(queryClient, view);
    }, [view, queryClient]);
    return (_jsx(InternalLink, __assign({ label: view.displayName, to: href, style: [a.flex_col] }, props, { children: children })));
}
export function Outer(_a) {
    var children = _a.children;
    return _jsx(View, { style: [a.w_full, a.gap_sm], children: children });
}
export function Header(_a) {
    var children = _a.children;
    return _jsx(View, { style: [a.flex_row, a.align_center, a.gap_sm], children: children });
}
export function Avatar(_a) {
    var src = _a.src, _b = _a.size, size = _b === void 0 ? 40 : _b;
    return _jsx(UserAvatar, { type: "algo", size: size, avatar: src });
}
export function AvatarPlaceholder(_a) {
    var _b = _a.size, size = _b === void 0 ? 40 : _b;
    var t = useTheme();
    return (_jsx(View, { style: [
            t.atoms.bg_contrast_25,
            {
                width: size,
                height: size,
                borderRadius: 8,
            },
        ] }));
}
export function TitleAndByline(_a) {
    var title = _a.title, creator = _a.creator, uri = _a.uri;
    var t = useTheme();
    var activeLiveEvents = useActiveLiveEventFeedUris();
    var liveColor = useMemo(function () {
        return select(t.name, {
            dark: t.palette.negative_600,
            dim: t.palette.negative_600,
            light: t.palette.negative_500,
        });
    }, [t]);
    return (_jsxs(View, { style: [a.flex_1], children: [uri && activeLiveEvents.has(uri) && (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_2xs], children: [_jsx(LiveIcon, { size: "xs", fill: liveColor }), _jsx(Text, { style: [
                            a.text_2xs,
                            a.font_medium,
                            a.leading_snug,
                            { color: liveColor },
                        ], children: _jsx(Trans, { children: "Happening now" }) })] })), _jsx(Text, { emoji: true, style: [a.text_md, a.font_semi_bold, a.leading_snug], numberOfLines: 1, children: title }), creator && (_jsx(Text, { style: [a.leading_snug, t.atoms.text_contrast_medium], numberOfLines: 1, children: _jsxs(Trans, { children: ["Feed by ", sanitizeHandle(creator.handle, '@')] }) }))] }));
}
export function TitleAndBylinePlaceholder(_a) {
    var creator = _a.creator;
    var t = useTheme();
    return (_jsxs(View, { style: [a.flex_1, a.gap_xs], children: [_jsx(View, { style: [
                    a.rounded_xs,
                    t.atoms.bg_contrast_50,
                    {
                        width: '60%',
                        height: 14,
                    },
                ] }), creator && (_jsx(View, { style: [
                    a.rounded_xs,
                    t.atoms.bg_contrast_25,
                    {
                        width: '40%',
                        height: 10,
                    },
                ] }))] }));
}
export function Description(_a) {
    var description = _a.description, rest = __rest(_a, ["description"]);
    var rt = React.useMemo(function () {
        if (!description)
            return;
        var rt = new RichTextApi({ text: description || '' });
        rt.detectFacetsWithoutResolution();
        return rt;
    }, [description]);
    if (!rt)
        return null;
    return _jsx(RichText, __assign({ value: rt, disableLinks: true }, rest));
}
export function DescriptionPlaceholder() {
    var t = useTheme();
    return (_jsxs(View, { style: [a.gap_xs], children: [_jsx(View, { style: [a.rounded_xs, a.w_full, t.atoms.bg_contrast_50, { height: 12 }] }), _jsx(View, { style: [a.rounded_xs, a.w_full, t.atoms.bg_contrast_50, { height: 12 }] }), _jsx(View, { style: [
                    a.rounded_xs,
                    a.w_full,
                    t.atoms.bg_contrast_50,
                    { height: 12, width: 100 },
                ] })] }));
}
export function Likes(_a) {
    var count = _a.count;
    var t = useTheme();
    return (_jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_medium, a.font_semi_bold], children: _jsxs(Trans, { children: ["Liked by ", _jsx(Plural, { value: count || 0, one: "# user", other: "# users" })] }) }));
}
export function SaveButton(_a) {
    var view = _a.view, pin = _a.pin, props = __rest(_a, ["view", "pin"]);
    var hasSession = useSession().hasSession;
    if (!hasSession)
        return null;
    return _jsx(SaveButtonInner, __assign({ view: view, pin: pin }, props));
}
function SaveButtonInner(_a) {
    var _this = this;
    var view = _a.view, pin = _a.pin, _b = _a.text, text = _b === void 0 ? true : _b, buttonProps = __rest(_a, ["view", "pin", "text"]);
    var _ = useLingui()._;
    var preferences = usePreferencesQuery().data;
    var _c = useAddSavedFeedsMutation(), isAddSavedFeedPending = _c.isPending, saveFeeds = _c.mutateAsync;
    var _d = useRemoveFeedMutation(), isRemovePending = _d.isPending, removeFeed = _d.mutateAsync;
    var uri = view.uri;
    var type = view.uri.includes('app.bsky.feed.generator') ? 'feed' : 'list';
    var savedFeedConfig = React.useMemo(function () {
        var _a;
        return (_a = preferences === null || preferences === void 0 ? void 0 : preferences.savedFeeds) === null || _a === void 0 ? void 0 : _a.find(function (feed) { return feed.value === uri; });
    }, [preferences === null || preferences === void 0 ? void 0 : preferences.savedFeeds, uri]);
    var removePromptControl = Prompt.usePromptControl();
    var isPending = isAddSavedFeedPending || isRemovePending;
    var toggleSave = React.useCallback(function (e) { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    e.stopPropagation();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!savedFeedConfig) return [3 /*break*/, 3];
                    return [4 /*yield*/, removeFeed(savedFeedConfig)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, saveFeeds([
                        {
                            type: type,
                            value: uri,
                            pinned: pin || false,
                        },
                    ])];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    Toast.show(_(msg({ message: 'Feeds updated!', context: 'toast' })));
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    logger.error(err_1, { message: "FeedCard: failed to update feeds", pin: pin });
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Failed to update feeds"], ["Failed to update feeds"])))), 'xmark');
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); }, [_, pin, saveFeeds, removeFeed, uri, savedFeedConfig, type]);
    var onPrompRemoveFeed = React.useCallback(function (e) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            e.preventDefault();
            e.stopPropagation();
            removePromptControl.open();
            return [2 /*return*/];
        });
    }); }, [removePromptControl]);
    return (_jsxs(_Fragment, { children: [_jsx(Button, __assign({ disabled: isPending, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Add this feed to your feeds"], ["Add this feed to your feeds"])))), size: "small", variant: "solid", color: savedFeedConfig ? 'secondary' : 'primary', onPress: savedFeedConfig ? onPrompRemoveFeed : toggleSave }, buttonProps, { children: savedFeedConfig ? (_jsxs(_Fragment, { children: [isPending ? (_jsx(ButtonIcon, { size: "md", icon: Loader })) : (!text && _jsx(ButtonIcon, { size: "md", icon: TrashIcon })), text && (_jsx(ButtonText, { children: _jsx(Trans, { children: "Unpin Feed" }) }))] })) : (_jsxs(_Fragment, { children: [_jsx(ButtonIcon, { size: "md", icon: isPending ? Loader : PinIcon }), text && (_jsx(ButtonText, { children: _jsx(Trans, { children: "Pin Feed" }) }))] })) })), _jsx(Prompt.Basic, { control: removePromptControl, title: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Remove from your feeds?"], ["Remove from your feeds?"])))), description: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Are you sure you want to remove this from your feeds?"], ["Are you sure you want to remove this from your feeds?"])))), onConfirm: toggleSave, confirmButtonCta: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Remove"], ["Remove"])))), confirmButtonColor: "negative" })] }));
}
export function createProfileFeedHref(_a) {
    var feed = _a.feed;
    var urip = new AtUri(feed.uri);
    var handleOrDid = feed.creator.handle || feed.creator.did;
    return "/profile/".concat(handleOrDid, "/feed/").concat(urip.rkey);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
