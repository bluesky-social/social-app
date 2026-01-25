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
import { ActivityIndicator, StyleSheet, View, } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { usePostViewTracking } from '#/lib/hooks/usePostViewTracking';
import { cleanError } from '#/lib/strings/errors';
import { s } from '#/lib/styles';
import { logger } from '#/logger';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useNotificationFeedQuery } from '#/state/queries/notifications/feed';
import { EmptyState } from '#/view/com/util/EmptyState';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { List } from '#/view/com/util/List';
import { NotificationFeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';
import { Bell_Stroke2_Corner0_Rounded as BellIcon } from '#/components/icons/Bell';
import { NotificationFeedItem } from './NotificationFeedItem';
var EMPTY_FEED_ITEM = { _reactKey: '__empty__' };
var LOAD_MORE_ERROR_ITEM = { _reactKey: '__load_more_error__' };
var LOADING_ITEM = { _reactKey: '__loading__' };
export function NotificationFeed(_a) {
    var _this = this;
    var filter = _a.filter, enabled = _a.enabled, scrollElRef = _a.scrollElRef, onPressTryAgain = _a.onPressTryAgain, onScrolledDownChange = _a.onScrolledDownChange, ListHeaderComponent = _a.ListHeaderComponent, refreshNotifications = _a.refreshNotifications;
    var initialNumToRender = useInitialNumToRender();
    var _b = React.useState(false), isPTRing = _b[0], setIsPTRing = _b[1];
    var _ = useLingui()._;
    var moderationOpts = useModerationOpts();
    var trackPostView = usePostViewTracking('Notifications');
    var _c = useNotificationFeedQuery({
        enabled: enabled && !!moderationOpts,
        filter: filter,
    }), data = _c.data, isFetching = _c.isFetching, isFetched = _c.isFetched, isError = _c.isError, error = _c.error, hasNextPage = _c.hasNextPage, isFetchingNextPage = _c.isFetchingNextPage, fetchNextPage = _c.fetchNextPage;
    // previously, this was `!isFetching && !data?.pages[0]?.items.length`
    // however, if the first page had no items (can happen in the mentions tab!)
    // it would flicker the empty state whenever it was loading.
    // therefore, we need to find if *any* page has items. in 99.9% of cases,
    // the `.find()` won't need to go any further than the first page -sfn
    var isEmpty = !isFetching && !(data === null || data === void 0 ? void 0 : data.pages.find(function (page) { return page.items.length > 0; }));
    var items = React.useMemo(function () {
        var arr = [];
        if (isFetched) {
            if (isEmpty) {
                arr = arr.concat([EMPTY_FEED_ITEM]);
            }
            else if (data) {
                for (var _i = 0, _a = data === null || data === void 0 ? void 0 : data.pages; _i < _a.length; _i++) {
                    var page = _a[_i];
                    arr = arr.concat(page.items);
                }
            }
            if (isError && !isEmpty) {
                arr = arr.concat([LOAD_MORE_ERROR_ITEM]);
            }
        }
        else {
            arr.push(LOADING_ITEM);
        }
        return arr;
    }, [isFetched, isError, isEmpty, data]);
    var onRefresh = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setIsPTRing(true);
                    return [4 /*yield*/, refreshNotifications()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2:
                    err_1 = _a.sent();
                    logger.error('Failed to refresh notifications feed', {
                        message: err_1,
                    });
                    return [3 /*break*/, 4];
                case 3:
                    setIsPTRing(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [refreshNotifications, setIsPTRing]);
    var onEndReached = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isFetching || !hasNextPage || isError)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchNextPage()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    logger.error('Failed to load more notifications', { message: err_2 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [isFetching, hasNextPage, isError, fetchNextPage]);
    var onPressRetryLoadMore = React.useCallback(function () {
        fetchNextPage();
    }, [fetchNextPage]);
    var renderItem = React.useCallback(function (_a) {
        var item = _a.item, index = _a.index;
        if (item === EMPTY_FEED_ITEM) {
            return (_jsx(EmptyState, { icon: BellIcon, message: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["No notifications yet!"], ["No notifications yet!"])))), style: styles.emptyState }));
        }
        else if (item === LOAD_MORE_ERROR_ITEM) {
            return (_jsx(LoadMoreRetryBtn, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["There was an issue fetching notifications. Tap here to try again."], ["There was an issue fetching notifications. Tap here to try again."])))), onPress: onPressRetryLoadMore }));
        }
        else if (item === LOADING_ITEM) {
            return _jsx(NotificationFeedLoadingPlaceholder, {});
        }
        return (_jsx(NotificationFeedItem, { highlightUnread: filter === 'all', item: item, moderationOpts: moderationOpts, hideTopBorder: index === 0 }));
    }, [moderationOpts, _, onPressRetryLoadMore, filter]);
    var FeedFooter = React.useCallback(function () {
        return isFetchingNextPage ? (_jsx(View, { style: styles.feedFooter, children: _jsx(ActivityIndicator, {}) })) : (_jsx(View, {}));
    }, [isFetchingNextPage]);
    return (_jsxs(View, { style: s.hContentRegion, children: [error && (_jsx(ErrorMessage, { message: cleanError(error), onPressTryAgain: onPressTryAgain })), _jsx(List, { testID: "notifsFeed", ref: scrollElRef, data: items, keyExtractor: function (item) { return item._reactKey; }, renderItem: renderItem, ListHeaderComponent: ListHeaderComponent, ListFooterComponent: FeedFooter, refreshing: isPTRing, onRefresh: onRefresh, onEndReached: onEndReached, onEndReachedThreshold: 2, onScrolledDownChange: onScrolledDownChange, onItemSeen: function (item) {
                    if ((item.type === 'reply' ||
                        item.type === 'mention' ||
                        item.type === 'quote') &&
                        item.subject) {
                        trackPostView(item.subject);
                    }
                }, contentContainerStyle: s.contentContainer, desktopFixedHeight: true, initialNumToRender: initialNumToRender, windowSize: 11, sideBorders: false, removeClippedSubviews: true })] }));
}
var styles = StyleSheet.create({
    feedFooter: { paddingTop: 20 },
    emptyState: { paddingVertical: 40 },
});
var templateObject_1, templateObject_2;
