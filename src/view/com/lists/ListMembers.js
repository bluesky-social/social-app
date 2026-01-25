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
import React, { useCallback } from 'react';
import { Dimensions, View, } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { cleanError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { useModalControls } from '#/state/modals';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useListMembersQuery } from '#/state/queries/list-members';
import { useSession } from '#/state/session';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { List } from '#/view/com/util/List';
import { ProfileCardFeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { ListFooter } from '#/components/Lists';
import * as ProfileCard from '#/components/ProfileCard';
var LOADING_ITEM = { _reactKey: '__loading__' };
var EMPTY_ITEM = { _reactKey: '__empty__' };
var ERROR_ITEM = { _reactKey: '__error__' };
var LOAD_MORE_ERROR_ITEM = { _reactKey: '__load_more_error__' };
export function ListMembers(_a) {
    var _this = this;
    var list = _a.list, style = _a.style, scrollElRef = _a.scrollElRef, onScrolledDownChange = _a.onScrolledDownChange, onPressTryAgain = _a.onPressTryAgain, renderHeader = _a.renderHeader, renderEmptyState = _a.renderEmptyState, testID = _a.testID, _b = _a.headerOffset, headerOffset = _b === void 0 ? 0 : _b, desktopFixedHeightOffset = _a.desktopFixedHeightOffset;
    var t = useTheme();
    var _ = useLingui()._;
    var _c = React.useState(false), isRefreshing = _c[0], setIsRefreshing = _c[1];
    var openModal = useModalControls().openModal;
    var currentAccount = useSession().currentAccount;
    var moderationOpts = useModerationOpts();
    var _d = useListMembersQuery(list), data = _d.data, isFetching = _d.isFetching, isFetched = _d.isFetched, isError = _d.isError, error = _d.error, refetch = _d.refetch, fetchNextPage = _d.fetchNextPage, hasNextPage = _d.hasNextPage, isFetchingNextPage = _d.isFetchingNextPage;
    var isEmpty = !isFetching && !(data === null || data === void 0 ? void 0 : data.pages[0].items.length);
    var isOwner = currentAccount && (data === null || data === void 0 ? void 0 : data.pages[0].list.creator.did) === currentAccount.did;
    var items = React.useMemo(function () {
        var items = [];
        if (isFetched) {
            if (isEmpty && isError) {
                items = items.concat([ERROR_ITEM]);
            }
            if (isEmpty) {
                items = items.concat([EMPTY_ITEM]);
            }
            else if (data) {
                for (var _i = 0, _a = data.pages; _i < _a.length; _i++) {
                    var page = _a[_i];
                    items = items.concat(page.items);
                }
            }
            if (!isEmpty && isError) {
                items = items.concat([LOAD_MORE_ERROR_ITEM]);
            }
        }
        else if (isFetching) {
            items = items.concat([LOADING_ITEM]);
        }
        return items;
    }, [isFetched, isEmpty, isError, data, isFetching]);
    // events
    // =
    var onRefresh = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsRefreshing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, refetch()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    logger.error('Failed to refresh lists', { message: err_1 });
                    return [3 /*break*/, 4];
                case 4:
                    setIsRefreshing(false);
                    return [2 /*return*/];
            }
        });
    }); }, [refetch, setIsRefreshing]);
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
                    logger.error('Failed to load more lists', { message: err_2 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [isFetching, hasNextPage, isError, fetchNextPage]);
    var onPressRetryLoadMore = React.useCallback(function () {
        fetchNextPage();
    }, [fetchNextPage]);
    var onPressEditMembership = React.useCallback(function (e, profile) {
        e.preventDefault();
        openModal({
            name: 'user-add-remove-lists',
            subject: profile.did,
            displayName: profile.displayName || profile.handle,
            handle: profile.handle,
        });
    }, [openModal]);
    // rendering
    // =
    var renderItem = React.useCallback(function (_a) {
        var item = _a.item;
        if (item === EMPTY_ITEM) {
            return renderEmptyState();
        }
        else if (item === ERROR_ITEM) {
            return (_jsx(ErrorMessage, { message: cleanError(error), onPressTryAgain: onPressTryAgain }));
        }
        else if (item === LOAD_MORE_ERROR_ITEM) {
            return (_jsx(LoadMoreRetryBtn, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["There was an issue fetching the list. Tap here to try again."], ["There was an issue fetching the list. Tap here to try again."])))), onPress: onPressRetryLoadMore }));
        }
        else if (item === LOADING_ITEM) {
            return _jsx(ProfileCardFeedLoadingPlaceholder, {});
        }
        var profile = item.subject;
        if (!moderationOpts)
            return null;
        return (_jsx(View, { style: [a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low], children: _jsx(ProfileCard.Link, { profile: profile, children: _jsxs(ProfileCard.Outer, { children: [_jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts }), _jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts }), isOwner && (_jsx(Button, { testID: "user-".concat(profile.handle, "-editBtn"), label: _(msg({ message: 'Edit', context: 'action' })), onPress: function (e) { return onPressEditMembership(e, profile); }, size: "small", variant: "solid", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { context: "action", children: "Edit" }) }) }))] }), _jsx(ProfileCard.Labels, { profile: profile, moderationOpts: moderationOpts }), _jsx(ProfileCard.Description, { profile: profile })] }) }) }));
    }, [
        renderEmptyState,
        error,
        onPressTryAgain,
        onPressRetryLoadMore,
        moderationOpts,
        isOwner,
        onPressEditMembership,
        _,
        t,
    ]);
    var renderFooter = useCallback(function () {
        if (isEmpty)
            return null;
        return (_jsx(ListFooter, { hasNextPage: hasNextPage, error: cleanError(error), isFetchingNextPage: isFetchingNextPage, onRetry: fetchNextPage, height: 180 + headerOffset }));
    }, [
        hasNextPage,
        error,
        isFetchingNextPage,
        fetchNextPage,
        isEmpty,
        headerOffset,
    ]);
    return (_jsx(View, { testID: testID, style: style, children: _jsx(List, { testID: testID ? "".concat(testID, "-flatlist") : undefined, ref: scrollElRef, data: items, keyExtractor: function (item) { var _a; return ((_a = item.subject) === null || _a === void 0 ? void 0 : _a.did) || item._reactKey; }, renderItem: renderItem, ListHeaderComponent: !isEmpty ? renderHeader : undefined, ListFooterComponent: renderFooter, refreshing: isRefreshing, onRefresh: onRefresh, headerOffset: headerOffset, contentContainerStyle: {
                minHeight: Dimensions.get('window').height * 1.5,
            }, onScrolledDownChange: onScrolledDownChange, onEndReached: onEndReached, onEndReachedThreshold: 0.6, removeClippedSubviews: true, desktopFixedHeight: desktopFixedHeightOffset || true }) }));
}
var templateObject_1;
