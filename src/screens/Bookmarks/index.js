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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppBskyFeedDefs, } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useFocusEffect, useNavigation, } from '@react-navigation/native';
import { useCleanError } from '#/lib/hooks/useCleanError';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { usePostViewTracking } from '#/lib/hooks/usePostViewTracking';
import { useBookmarkMutation } from '#/state/queries/bookmarks/useBookmarkMutation';
import { useBookmarksQuery } from '#/state/queries/bookmarks/useBookmarksQuery';
import { useSetMinimalShellMode } from '#/state/shell';
import { Post } from '#/view/com/post/Post';
import { EmptyState } from '#/view/com/util/EmptyState';
import { List } from '#/view/com/util/List';
import { PostFeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { BookmarkDeleteLarge, BookmarkFilled } from '#/components/icons/Bookmark';
import { CircleQuestion_Stroke2_Corner2_Rounded as QuestionIcon } from '#/components/icons/CircleQuestion';
import * as Layout from '#/components/Layout';
import { ListFooter } from '#/components/Lists';
import * as Skele from '#/components/Skeleton';
import * as toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_IOS } from '#/env';
export function BookmarksScreen(_a) {
    var setMinimalShellMode = useSetMinimalShellMode();
    var ax = useAnalytics();
    useFocusEffect(useCallback(function () {
        setMinimalShellMode(false);
        ax.metric('bookmarks:view', {});
    }, [setMinimalShellMode, ax]));
    return (_jsxs(Layout.Screen, { testID: "bookmarksScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Saved Posts" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(BookmarksInner, {})] }));
}
function BookmarksInner() {
    var _this = this;
    var _a;
    var initialNumToRender = useInitialNumToRender();
    var cleanError = useCleanError();
    var _b = useState(false), isPTRing = _b[0], setIsPTRing = _b[1];
    var trackPostView = usePostViewTracking('Bookmarks');
    var _c = useBookmarksQuery(), data = _c.data, isLoading = _c.isLoading, isFetchingNextPage = _c.isFetchingNextPage, hasNextPage = _c.hasNextPage, fetchNextPage = _c.fetchNextPage, error = _c.error, refetch = _c.refetch;
    var cleanedError = useMemo(function () {
        var _a = cleanError(error), raw = _a.raw, clean = _a.clean;
        return clean || raw;
    }, [error, cleanError]);
    var onRefresh = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsPTRing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, refetch()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    setIsPTRing(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [refetch, setIsPTRing]);
    var onEndReached = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (isFetchingNextPage || !hasNextPage || error)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchNextPage()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [isFetchingNextPage, hasNextPage, error, fetchNextPage]);
    var items = useMemo(function () {
        var i = [];
        if (isLoading) {
            i.push({ type: 'loading', key: 'loading' });
        }
        else if (error || !data) {
            // handled in Footer
        }
        else {
            var bookmarks = data.pages.flatMap(function (p) { return p.bookmarks; });
            if (bookmarks.length > 0) {
                for (var _i = 0, bookmarks_1 = bookmarks; _i < bookmarks_1.length; _i++) {
                    var bookmark = bookmarks_1[_i];
                    if (AppBskyFeedDefs.isNotFoundPost(bookmark.item)) {
                        i.push({
                            type: 'bookmarkNotFound',
                            key: bookmark.item.uri,
                            bookmark: __assign(__assign({}, bookmark), { item: bookmark.item }),
                        });
                    }
                    if (AppBskyFeedDefs.isPostView(bookmark.item)) {
                        i.push({
                            type: 'bookmark',
                            key: bookmark.item.uri,
                            bookmark: __assign(__assign({}, bookmark), { item: bookmark.item }),
                        });
                    }
                }
            }
            else {
                i.push({ type: 'empty', key: 'empty' });
            }
        }
        return i;
    }, [isLoading, error, data]);
    var isEmpty = items.length === 1 && ((_a = items[0]) === null || _a === void 0 ? void 0 : _a.type) === 'empty';
    return (_jsx(List, { data: items, renderItem: renderItem, keyExtractor: keyExtractor, refreshing: isPTRing, onRefresh: onRefresh, onEndReached: onEndReached, onEndReachedThreshold: 4, onItemSeen: function (item) {
            if (item.type === 'bookmark') {
                trackPostView(item.bookmark.item);
            }
        }, ListFooterComponent: _jsx(ListFooter, { isFetchingNextPage: isFetchingNextPage, error: cleanedError, onRetry: fetchNextPage, style: [isEmpty && a.border_t_0] }), initialNumToRender: initialNumToRender, windowSize: 9, maxToRenderPerBatch: IS_IOS ? 5 : 1, updateCellsBatchingPeriod: 40, sideBorders: false }));
}
function BookmarkNotFound(_a) {
    var _this = this;
    var hideTopBorder = _a.hideTopBorder, post = _a.post;
    var t = useTheme();
    var _ = useLingui()._;
    var bookmark = useBookmarkMutation().mutateAsync;
    var cleanError = useCleanError();
    var remove = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1, _a, raw, clean;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, bookmark({ action: 'delete', uri: post.uri })];
                case 1:
                    _b.sent();
                    toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Removed from saved posts"], ["Removed from saved posts"])))), {
                        type: 'info',
                    });
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _b.sent();
                    _a = cleanError(e_1), raw = _a.raw, clean = _a.clean;
                    toast.show(clean || raw || e_1, {
                        type: 'error',
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(View, { style: [
            a.flex_row,
            a.align_start,
            a.px_xl,
            a.py_lg,
            a.gap_sm,
            !hideTopBorder && a.border_t,
            t.atoms.border_contrast_low,
        ], children: [_jsx(Skele.Circle, { size: 42, children: _jsx(QuestionIcon, { size: "lg", fill: t.atoms.text_contrast_low.color }) }), _jsxs(View, { style: [a.flex_1, a.gap_2xs], children: [_jsxs(View, { style: [a.flex_row, a.gap_xs], children: [_jsx(Skele.Text, { style: [a.text_md, { width: 80 }] }), _jsx(Skele.Text, { style: [a.text_md, { width: 100 }] })] }), _jsx(Text, { style: [
                            a.text_md,
                            a.leading_snug,
                            a.italic,
                            t.atoms.text_contrast_medium,
                        ], children: _jsx(Trans, { children: "This post was deleted by its author" }) })] }), _jsxs(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Remove from saved posts"], ["Remove from saved posts"])))), size: "tiny", color: "secondary", onPress: remove, children: [_jsx(ButtonIcon, { icon: BookmarkFilled }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Remove" }) })] })] }));
}
function BookmarkItem(_a) {
    var item = _a.item, hideTopBorder = _a.hideTopBorder;
    var ax = useAnalytics();
    return (_jsx(Post, { post: item.bookmark.item, hideTopBorder: hideTopBorder, onBeforePress: function () {
            ax.metric('bookmarks:post-clicked', {});
        } }));
}
function BookmarksEmpty() {
    var t = useTheme();
    var _ = useLingui()._;
    var navigation = useNavigation();
    return (_jsx(EmptyState, { icon: BookmarkDeleteLarge, message: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Nothing saved yet"], ["Nothing saved yet"])))), textStyle: [t.atoms.text_contrast_medium, a.font_medium], button: {
            label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Button to go back to the home timeline"], ["Button to go back to the home timeline"])))),
            text: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Go home"], ["Go home"])))),
            onPress: function () { return navigation.navigate('Home'); },
            size: 'small',
            color: 'secondary',
        }, style: [a.pt_3xl] }));
}
function renderItem(_a) {
    var item = _a.item, index = _a.index;
    switch (item.type) {
        case 'loading': {
            return _jsx(PostFeedLoadingPlaceholder, {});
        }
        case 'empty': {
            return _jsx(BookmarksEmpty, {});
        }
        case 'bookmark': {
            return _jsx(BookmarkItem, { item: item, hideTopBorder: index === 0 });
        }
        case 'bookmarkNotFound': {
            return (_jsx(BookmarkNotFound, { post: item.bookmark.item, hideTopBorder: index === 0 }));
        }
        default:
            return null;
    }
}
var keyExtractor = function (item) { return item.key; };
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
