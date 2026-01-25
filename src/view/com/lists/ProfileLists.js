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
import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useImperativeHandle, useMemo, useState, } from 'react';
import { findNodeHandle, useWindowDimensions, View, } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { cleanError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { RQKEY, useProfileListsQuery } from '#/state/queries/profile-lists';
import { useSession } from '#/state/session';
import { EmptyState } from '#/view/com/util/EmptyState';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { List } from '#/view/com/util/List';
import { FeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';
import { atoms as a, ios, useTheme } from '#/alf';
import { BulletList_Stroke1_Corner0_Rounded as ListIcon } from '#/components/icons/BulletList';
import * as ListCard from '#/components/ListCard';
import { ListFooter } from '#/components/Lists';
import { IS_IOS, IS_NATIVE, IS_WEB } from '#/env';
var LOADING = { _reactKey: '__loading__' };
var EMPTY = { _reactKey: '__empty__' };
var ERROR_ITEM = { _reactKey: '__error__' };
var LOAD_MORE_ERROR_ITEM = { _reactKey: '__load_more_error__' };
export function ProfileLists(_a) {
    var _this = this;
    var _b;
    var ref = _a.ref, did = _a.did, scrollElRef = _a.scrollElRef, headerOffset = _a.headerOffset, enabled = _a.enabled, style = _a.style, testID = _a.testID, setScrollViewTag = _a.setScrollViewTag;
    var _ = useLingui()._;
    var t = useTheme();
    var _c = useState(false), isPTRing = _c[0], setIsPTRing = _c[1];
    var height = useWindowDimensions().height;
    var opts = useMemo(function () { return ({ enabled: enabled }); }, [enabled]);
    var _d = useProfileListsQuery(did, opts), data = _d.data, isPending = _d.isPending, isFetchingNextPage = _d.isFetchingNextPage, hasNextPage = _d.hasNextPage, fetchNextPage = _d.fetchNextPage, isError = _d.isError, error = _d.error, refetch = _d.refetch;
    var isEmpty = !isPending && !((_b = data === null || data === void 0 ? void 0 : data.pages[0]) === null || _b === void 0 ? void 0 : _b.lists.length);
    var preferences = usePreferencesQuery().data;
    var navigation = useNavigation();
    var currentAccount = useSession().currentAccount;
    var isSelf = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === did;
    var items = useMemo(function () {
        var items = [];
        if (isError && isEmpty) {
            items = items.concat([ERROR_ITEM]);
        }
        if (isPending) {
            items = items.concat([LOADING]);
        }
        else if (isEmpty) {
            items = items.concat([EMPTY]);
        }
        else if (data === null || data === void 0 ? void 0 : data.pages) {
            for (var _i = 0, _a = data === null || data === void 0 ? void 0 : data.pages; _i < _a.length; _i++) {
                var page = _a[_i];
                items = items.concat(page.lists);
            }
        }
        else if (isError && !isEmpty) {
            items = items.concat([LOAD_MORE_ERROR_ITEM]);
        }
        return items;
    }, [isError, isEmpty, isPending, data]);
    // events
    // =
    var queryClient = useQueryClient();
    var onScrollToTop = useCallback(function () {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            animated: IS_NATIVE,
            offset: -headerOffset,
        });
        queryClient.invalidateQueries({ queryKey: RQKEY(did) });
    }, [scrollElRef, queryClient, headerOffset, did]);
    useImperativeHandle(ref, function () { return ({
        scrollToTop: onScrollToTop,
    }); });
    var onRefresh = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsPTRing(true);
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
                    setIsPTRing(false);
                    return [2 /*return*/];
            }
        });
    }); }, [refetch, setIsPTRing]);
    var onEndReached = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isFetchingNextPage || !hasNextPage || isError)
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
    }); }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage]);
    var onPressRetryLoadMore = useCallback(function () {
        fetchNextPage();
    }, [fetchNextPage]);
    // rendering
    // =
    var renderItem = useCallback(function (_a) {
        var item = _a.item, index = _a.index;
        if (item === EMPTY) {
            return (_jsx(EmptyState, { icon: ListIcon, message: isSelf
                    ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You haven't created any lists yet."], ["You haven't created any lists yet."]))))
                    : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["No lists"], ["No lists"])))), textStyle: [t.atoms.text_contrast_medium, a.font_medium], button: isSelf
                    ? {
                        label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Create a list"], ["Create a list"])))),
                        text: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Create a list"], ["Create a list"])))),
                        onPress: function () { return navigation.navigate('Lists'); },
                        size: 'small',
                        color: 'primary',
                    }
                    : undefined }));
        }
        else if (item === ERROR_ITEM) {
            return (_jsx(ErrorMessage, { message: cleanError(error), onPressTryAgain: refetch }));
        }
        else if (item === LOAD_MORE_ERROR_ITEM) {
            return (_jsx(LoadMoreRetryBtn, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["There was an issue fetching your lists. Tap here to try again."], ["There was an issue fetching your lists. Tap here to try again."])))), onPress: onPressRetryLoadMore }));
        }
        else if (item === LOADING) {
            return _jsx(FeedLoadingPlaceholder, {});
        }
        if (preferences) {
            return (_jsx(View, { style: [
                    (index !== 0 || IS_WEB) && a.border_t,
                    t.atoms.border_contrast_low,
                    a.px_lg,
                    a.py_lg,
                ], children: _jsx(ListCard.Default, { view: item }) }));
        }
        return null;
    }, [
        _,
        t,
        error,
        refetch,
        onPressRetryLoadMore,
        preferences,
        navigation,
        isSelf,
    ]);
    useEffect(function () {
        if (IS_IOS && enabled && scrollElRef.current) {
            var nativeTag = findNodeHandle(scrollElRef.current);
            setScrollViewTag(nativeTag);
        }
    }, [enabled, scrollElRef, setScrollViewTag]);
    var ProfileListsFooter = useCallback(function () {
        if (isEmpty)
            return null;
        return (_jsx(ListFooter, { hasNextPage: hasNextPage, isFetchingNextPage: isFetchingNextPage, onRetry: fetchNextPage, error: cleanError(error), height: 180 + headerOffset }));
    }, [
        hasNextPage,
        error,
        isFetchingNextPage,
        headerOffset,
        fetchNextPage,
        isEmpty,
    ]);
    return (_jsx(View, { testID: testID, style: style, children: _jsx(List, { testID: testID ? "".concat(testID, "-flatlist") : undefined, ref: scrollElRef, data: items, keyExtractor: keyExtractor, renderItem: renderItem, ListFooterComponent: ProfileListsFooter, refreshing: isPTRing, onRefresh: onRefresh, headerOffset: headerOffset, progressViewOffset: ios(0), removeClippedSubviews: true, desktopFixedHeight: true, onEndReached: onEndReached, contentContainerStyle: { minHeight: height + headerOffset } }) }));
}
function keyExtractor(item) {
    return item._reactKey || item.uri;
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
