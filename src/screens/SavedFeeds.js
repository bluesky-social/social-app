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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useAnimatedRef, useScrollViewOffset } from 'react-native-reanimated';
import { TID } from '@atproto/common-web';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RECOMMENDED_SAVED_FEEDS, TIMELINE_SAVED_FEED } from '#/lib/constants';
import { useHaptics } from '#/lib/haptics';
import { logger } from '#/logger';
import { useA11y } from '#/state/a11y';
import { useOverwriteSavedFeedsMutation, usePreferencesQuery, } from '#/state/queries/preferences';
import { useSetMinimalShellMode } from '#/state/shell';
import { FeedSourceCard } from '#/view/com/feeds/FeedSourceCard';
import * as Toast from '#/view/com/util/Toast';
import { NoFollowingFeed } from '#/screens/Feeds/NoFollowingFeed';
import { NoSavedFeedsOfAnyType } from '#/screens/Feeds/NoSavedFeedsOfAnyType';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { SortableList } from '#/components/DraggableList';
import { ArrowBottom_Stroke2_Corner0_Rounded as ArrowDownIcon, ArrowTop_Stroke2_Corner0_Rounded as ArrowUpIcon, } from '#/components/icons/Arrow';
import { FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline } from '#/components/icons/FilterTimeline';
import { FloppyDisk_Stroke2_Corner0_Rounded as SaveIcon } from '#/components/icons/FloppyDisk';
import { Pin_Filled_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Layout from '#/components/Layout';
import { InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
export function SavedFeeds(_a) {
    var preferences = usePreferencesQuery().data;
    var screenReaderEnabled = useA11y().screenReaderEnabled;
    if (!preferences) {
        return _jsx(View, {});
    }
    if (screenReaderEnabled) {
        return _jsx(SavedFeedsA11y, { preferences: preferences });
    }
    return _jsx(SavedFeedsInner, { preferences: preferences });
}
function SavedFeedsInner(_a) {
    var _this = this;
    var preferences = _a.preferences;
    var t = useTheme();
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var setMinimalShellMode = useSetMinimalShellMode();
    var _b = useOverwriteSavedFeedsMutation(), overwriteSavedFeeds = _b.mutateAsync, isOverwritePending = _b.isPending;
    var navigation = useNavigation();
    var scrollRef = useAnimatedRef();
    var scrollOffset = useScrollViewOffset(scrollRef);
    /*
     * Use optimistic data if exists and no error, otherwise fallback to remote
     * data
     */
    var _c = useState(function () { return preferences.savedFeeds || []; }), currentFeeds = _c[0], setCurrentFeeds = _c[1];
    var hasUnsavedChanges = currentFeeds !== preferences.savedFeeds;
    var pinnedFeeds = currentFeeds.filter(function (f) { return f.pinned; });
    var unpinnedFeeds = currentFeeds.filter(function (f) { return !f.pinned; });
    var noSavedFeedsOfAnyType = pinnedFeeds.length + unpinnedFeeds.length === 0;
    var noFollowingFeed = currentFeeds.every(function (f) { return f.type !== 'timeline'; }) && !noSavedFeedsOfAnyType;
    var _d = useState(false), isDragging = _d[0], setIsDragging = _d[1];
    useFocusEffect(useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    var onSaveChanges = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, overwriteSavedFeeds(currentFeeds)];
                case 1:
                    _a.sent();
                    Toast.show(_(msg({ message: 'Feeds updated!', context: 'toast' })));
                    if (navigation.canGoBack()) {
                        navigation.goBack();
                    }
                    else {
                        navigation.navigate('Feeds');
                    }
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["There was an issue contacting the server"], ["There was an issue contacting the server"])))), 'xmark');
                    logger.error('Failed to toggle pinned feed', { message: e_1 });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { align: "left", children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Feeds" }) }) }), _jsxs(Button, { testID: "saveChangesBtn", size: "small", color: hasUnsavedChanges ? 'primary' : 'secondary', onPress: onSaveChanges, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Save changes"], ["Save changes"])))), disabled: isOverwritePending || !hasUnsavedChanges, children: [_jsx(ButtonIcon, { icon: isOverwritePending ? Loader : SaveIcon }), _jsx(ButtonText, { children: gtMobile ? _jsx(Trans, { children: "Save changes" }) : _jsx(Trans, { children: "Save" }) })] })] }), _jsxs(Layout.Content, { ref: scrollRef, scrollEnabled: !isDragging, children: [noSavedFeedsOfAnyType && (_jsx(View, { style: [t.atoms.border_contrast_low, a.border_b], children: _jsx(NoSavedFeedsOfAnyType, { onAddRecommendedFeeds: function () {
                                return setCurrentFeeds(RECOMMENDED_SAVED_FEEDS.map(function (f) { return (__assign(__assign({}, f), { id: TID.nextStr() })); }));
                            } }) })), _jsx(SectionHeaderText, { children: _jsx(Trans, { children: "Pinned Feeds" }) }), preferences ? (!pinnedFeeds.length ? (_jsx(View, { style: [a.flex_1, a.p_lg], children: _jsx(Admonition, { type: "info", children: _jsx(Trans, { children: "You don't have any pinned feeds." }) }) })) : (_jsx(SortableList, { data: pinnedFeeds, keyExtractor: function (f) { return f.id; }, itemHeight: 68, scrollRef: scrollRef, scrollOffset: scrollOffset, onDragStart: function () { return setIsDragging(true); }, onDragEnd: function () { return setIsDragging(false); }, onReorder: function (reordered) {
                            setCurrentFeeds(__spreadArray(__spreadArray([], reordered, true), unpinnedFeeds, true));
                        }, renderItem: function (feed, dragHandle) { return (_jsx(PinnedFeedItem, { feed: feed, currentFeeds: currentFeeds, setCurrentFeeds: setCurrentFeeds, dragHandle: dragHandle })); } }))) : (_jsx(View, { style: [a.w_full, a.py_2xl, a.align_center], children: _jsx(Loader, { size: "xl" }) })), noFollowingFeed && (_jsx(View, { style: [t.atoms.border_contrast_low, a.border_b], children: _jsx(NoFollowingFeed, { onAddFeed: function () {
                                return setCurrentFeeds(function (feeds) { return __spreadArray(__spreadArray([], feeds, true), [
                                    __assign(__assign({}, TIMELINE_SAVED_FEED), { id: TID.next().toString() }),
                                ], false); });
                            } }) })), _jsx(SectionHeaderText, { children: _jsx(Trans, { children: "Saved Feeds" }) }), preferences ? (!unpinnedFeeds.length ? (_jsx(View, { style: [a.flex_1, a.p_lg], children: _jsx(Admonition, { type: "info", children: _jsx(Trans, { children: "You don't have any saved feeds." }) }) })) : (unpinnedFeeds.map(function (f) { return (_jsx(UnpinnedFeedItem, { feed: f, currentFeeds: currentFeeds, setCurrentFeeds: setCurrentFeeds }, f.id)); }))) : (_jsx(View, { style: [a.w_full, a.py_2xl, a.align_center], children: _jsx(Loader, { size: "xl" }) })), _jsx(View, { style: [a.px_lg, a.py_xl], children: _jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_medium, a.leading_snug], children: _jsxs(Trans, { children: ["Feeds are custom algorithms that users build with a little coding expertise.", ' ', _jsx(InlineLinkText, { to: "https://github.com/bluesky-social/feed-generator", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["See this guide"], ["See this guide"])))), disableMismatchWarning: true, style: [a.leading_snug], children: "See this guide" }), ' ', "for more information."] }) }) })] })] }));
}
function SavedFeedsA11y(_a) {
    var _this = this;
    var preferences = _a.preferences;
    var t = useTheme();
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var setMinimalShellMode = useSetMinimalShellMode();
    var _b = useOverwriteSavedFeedsMutation(), overwriteSavedFeeds = _b.mutateAsync, isOverwritePending = _b.isPending;
    var navigation = useNavigation();
    var _c = useState(function () { return preferences.savedFeeds || []; }), currentFeeds = _c[0], setCurrentFeeds = _c[1];
    var hasUnsavedChanges = currentFeeds !== preferences.savedFeeds;
    var pinnedFeeds = currentFeeds.filter(function (f) { return f.pinned; });
    var unpinnedFeeds = currentFeeds.filter(function (f) { return !f.pinned; });
    var noSavedFeedsOfAnyType = pinnedFeeds.length + unpinnedFeeds.length === 0;
    var noFollowingFeed = currentFeeds.every(function (f) { return f.type !== 'timeline'; }) && !noSavedFeedsOfAnyType;
    useFocusEffect(useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    var onSaveChanges = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, overwriteSavedFeeds(currentFeeds)];
                case 1:
                    _a.sent();
                    Toast.show(_(msg({ message: 'Feeds updated!', context: 'toast' })));
                    if (navigation.canGoBack()) {
                        navigation.goBack();
                    }
                    else {
                        navigation.navigate('Feeds');
                    }
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _a.sent();
                    Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["There was an issue contacting the server"], ["There was an issue contacting the server"])))), 'xmark');
                    logger.error('Failed to toggle pinned feed', { message: e_2 });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var onMoveUp = function (index) {
        var _a;
        var pinned = __spreadArray([], pinnedFeeds, true);
        _a = [pinned[index], pinned[index - 1]], pinned[index - 1] = _a[0], pinned[index] = _a[1];
        setCurrentFeeds(__spreadArray(__spreadArray([], pinned, true), unpinnedFeeds, true));
    };
    var onMoveDown = function (index) {
        var _a;
        var pinned = __spreadArray([], pinnedFeeds, true);
        _a = [pinned[index + 1], pinned[index]], pinned[index] = _a[0], pinned[index + 1] = _a[1];
        setCurrentFeeds(__spreadArray(__spreadArray([], pinned, true), unpinnedFeeds, true));
    };
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { align: "left", children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Feeds" }) }) }), _jsxs(Button, { testID: "saveChangesBtn", size: "small", color: hasUnsavedChanges ? 'primary' : 'secondary', onPress: onSaveChanges, label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Save changes"], ["Save changes"])))), disabled: isOverwritePending || !hasUnsavedChanges, children: [_jsx(ButtonIcon, { icon: isOverwritePending ? Loader : SaveIcon }), _jsx(ButtonText, { children: gtMobile ? _jsx(Trans, { children: "Save changes" }) : _jsx(Trans, { children: "Save" }) })] })] }), _jsxs(Layout.Content, { children: [noSavedFeedsOfAnyType && (_jsx(View, { style: [t.atoms.border_contrast_low, a.border_b], children: _jsx(NoSavedFeedsOfAnyType, { onAddRecommendedFeeds: function () {
                                return setCurrentFeeds(RECOMMENDED_SAVED_FEEDS.map(function (f) { return (__assign(__assign({}, f), { id: TID.nextStr() })); }));
                            } }) })), _jsx(SectionHeaderText, { children: _jsx(Trans, { children: "Pinned Feeds" }) }), !pinnedFeeds.length ? (_jsx(View, { style: [a.flex_1, a.p_lg], children: _jsx(Admonition, { type: "info", children: _jsx(Trans, { children: "You don't have any pinned feeds." }) }) })) : (pinnedFeeds.map(function (feed, i) { return (_jsx(PinnedFeedItem, { feed: feed, currentFeeds: currentFeeds, setCurrentFeeds: setCurrentFeeds, index: i, total: pinnedFeeds.length, onMoveUp: function () { return onMoveUp(i); }, onMoveDown: function () { return onMoveDown(i); } }, feed.id)); })), noFollowingFeed && (_jsx(View, { style: [t.atoms.border_contrast_low, a.border_b], children: _jsx(NoFollowingFeed, { onAddFeed: function () {
                                return setCurrentFeeds(function (feeds) { return __spreadArray(__spreadArray([], feeds, true), [
                                    __assign(__assign({}, TIMELINE_SAVED_FEED), { id: TID.next().toString() }),
                                ], false); });
                            } }) })), _jsx(SectionHeaderText, { children: _jsx(Trans, { children: "Saved Feeds" }) }), !unpinnedFeeds.length ? (_jsx(View, { style: [a.flex_1, a.p_lg], children: _jsx(Admonition, { type: "info", children: _jsx(Trans, { children: "You don't have any saved feeds." }) }) })) : (unpinnedFeeds.map(function (f) { return (_jsx(UnpinnedFeedItem, { feed: f, currentFeeds: currentFeeds, setCurrentFeeds: setCurrentFeeds }, f.id)); })), _jsx(View, { style: [a.px_lg, a.py_xl], children: _jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_medium, a.leading_snug], children: _jsxs(Trans, { children: ["Feeds are custom algorithms that users build with a little coding expertise.", ' ', _jsx(InlineLinkText, { to: "https://github.com/bluesky-social/feed-generator", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["See this guide"], ["See this guide"])))), disableMismatchWarning: true, style: [a.leading_snug], children: "See this guide" }), ' ', "for more information."] }) }) })] })] }));
}
function PinnedFeedItem(_a) {
    var feed = _a.feed, currentFeeds = _a.currentFeeds, setCurrentFeeds = _a.setCurrentFeeds, dragHandle = _a.dragHandle, index = _a.index, total = _a.total, onMoveUp = _a.onMoveUp, onMoveDown = _a.onMoveDown;
    var _ = useLingui()._;
    var t = useTheme();
    var playHaptic = useHaptics();
    var feedUri = feed.value;
    var onTogglePinned = function () {
        playHaptic();
        setCurrentFeeds(currentFeeds.map(function (f) {
            return f.id === feed.id ? __assign(__assign({}, feed), { pinned: !feed.pinned }) : f;
        }));
    };
    return (_jsxs(View, { style: [a.flex_row, t.atoms.bg], children: [feed.type === 'timeline' ? (_jsx(FollowingFeedCard, {})) : (_jsx(FeedSourceCard, { feedUri: feedUri, style: [a.pr_sm], showMinimalPlaceholder: true, hideTopBorder: true })), _jsxs(View, { style: [a.pr_sm, a.flex_row, a.align_center, a.gap_sm], children: [_jsx(Button, { testID: "feed-".concat(feed.type, "-togglePin"), label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Unpin feed"], ["Unpin feed"])))), onPress: onTogglePinned, size: "small", color: "primary_subtle", shape: "square", children: _jsx(ButtonIcon, { icon: PinIcon }) }), onMoveUp !== undefined ? (_jsxs(_Fragment, { children: [_jsx(Button, { testID: "feed-".concat(feed.type, "-moveUp"), label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Move feed up"], ["Move feed up"])))), onPress: onMoveUp, disabled: index === 0, size: "small", color: "secondary", shape: "square", children: _jsx(ButtonIcon, { icon: ArrowUpIcon }) }), _jsx(Button, { testID: "feed-".concat(feed.type, "-moveDown"), label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Move feed down"], ["Move feed down"])))), onPress: onMoveDown, disabled: index === total - 1, size: "small", color: "secondary", shape: "square", children: _jsx(ButtonIcon, { icon: ArrowDownIcon }) })] })) : (dragHandle)] })] }));
}
function UnpinnedFeedItem(_a) {
    var feed = _a.feed, currentFeeds = _a.currentFeeds, setCurrentFeeds = _a.setCurrentFeeds;
    var _ = useLingui()._;
    var t = useTheme();
    var playHaptic = useHaptics();
    var feedUri = feed.value;
    var onTogglePinned = function () {
        playHaptic();
        setCurrentFeeds(currentFeeds.map(function (f) {
            return f.id === feed.id ? __assign(__assign({}, feed), { pinned: !feed.pinned }) : f;
        }));
    };
    var onPressRemove = function () {
        playHaptic();
        setCurrentFeeds(currentFeeds.filter(function (f) { return f.id !== feed.id; }));
    };
    return (_jsxs(View, { style: [a.flex_row, a.border_b, t.atoms.border_contrast_low], children: [feed.type === 'timeline' ? (_jsx(FollowingFeedCard, {})) : (_jsx(FeedSourceCard, { feedUri: feedUri, showMinimalPlaceholder: true, hideTopBorder: true })), _jsxs(View, { style: [a.pr_lg, a.flex_row, a.align_center, a.gap_sm], children: [_jsx(Button, { testID: "feed-".concat(feedUri, "-toggleSave"), label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Remove from my feeds"], ["Remove from my feeds"])))), onPress: onPressRemove, size: "small", color: "secondary", variant: "ghost", shape: "square", children: _jsx(ButtonIcon, { icon: TrashIcon }) }), _jsx(Button, { testID: "feed-".concat(feed.type, "-togglePin"), label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Pin feed"], ["Pin feed"])))), onPress: onTogglePinned, size: "small", color: "secondary", shape: "square", children: _jsx(ButtonIcon, { icon: PinIcon }) })] })] }));
}
function SectionHeaderText(_a) {
    var children = _a.children;
    var t = useTheme();
    // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
    return (_jsx(View, { style: [
            a.flex_row,
            a.flex_1,
            a.px_lg,
            a.pt_2xl,
            a.pb_md,
            a.border_b,
            t.atoms.border_contrast_low,
        ], children: _jsx(Text, { style: [a.text_xl, a.font_bold, a.leading_snug], children: children }) }));
}
function FollowingFeedCard() {
    var t = useTheme();
    return (_jsxs(View, { style: [a.flex_row, a.align_center, a.flex_1, a.p_lg], children: [_jsx(View, { style: [
                    a.align_center,
                    a.justify_center,
                    a.rounded_sm,
                    a.mr_md,
                    {
                        width: 36,
                        height: 36,
                        backgroundColor: t.palette.primary_500,
                    },
                ], children: _jsx(FilterTimeline, { style: [
                        {
                            width: 22,
                            height: 22,
                        },
                    ], fill: t.palette.white }) }), _jsx(View, { style: [a.flex_1, a.flex_row, a.gap_sm, a.align_center], children: _jsx(Text, { style: [a.text_sm, a.font_semi_bold, a.leading_snug], children: _jsx(Trans, { context: "feed-name", children: "Following" }) }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11;
