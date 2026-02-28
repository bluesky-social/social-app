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
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { cleanError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { useProfileFollowersQuery } from '#/state/queries/profile-followers';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';
import { PeopleRemove2_Stroke1_Corner0_Rounded as PeopleRemoveIcon } from '#/components/icons/PeopleRemove2';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { useAnalytics } from '#/analytics';
import { List } from '../util/List';
import { ProfileCardWithFollowBtn } from './ProfileCard';
function renderItem(_a) {
    var item = _a.item, index = _a.index, contextProfileDid = _a.contextProfileDid;
    return (_jsx(ProfileCardWithFollowBtn, { profile: item, noBorder: index === 0, position: index + 1, contextProfileDid: contextProfileDid }, item.did));
}
function keyExtractor(item) {
    return item.did;
}
export function ProfileFollowers(_a) {
    var _this = this;
    var _b;
    var name = _a.name;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var navigation = useNavigation();
    var initialNumToRender = useInitialNumToRender();
    var currentAccount = useSession().currentAccount;
    var _c = React.useState(false), isPTRing = _c[0], setIsPTRing = _c[1];
    var _d = useResolveDidQuery(name), resolvedDid = _d.data, isDidLoading = _d.isLoading, resolveError = _d.error;
    var _e = useProfileFollowersQuery(resolvedDid), data = _e.data, isFollowersLoading = _e.isLoading, isFetchingNextPage = _e.isFetchingNextPage, hasNextPage = _e.hasNextPage, fetchNextPage = _e.fetchNextPage, error = _e.error, refetch = _e.refetch;
    var isError = !!resolveError || !!error;
    var isMe = resolvedDid === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var followers = React.useMemo(function () {
        if (data === null || data === void 0 ? void 0 : data.pages) {
            return data.pages.flatMap(function (page) { return page.followers; });
        }
        return [];
    }, [data]);
    // Track pagination events - fire for page 3+ (pages 1-2 may auto-load)
    var paginationTrackingRef = React.useRef({ did: undefined, page: 0 });
    React.useEffect(function () {
        var _a;
        var currentPageCount = ((_a = data === null || data === void 0 ? void 0 : data.pages) === null || _a === void 0 ? void 0 : _a.length) || 0;
        // Reset tracking when profile changes
        if (paginationTrackingRef.current.did !== resolvedDid) {
            paginationTrackingRef.current = { did: resolvedDid, page: currentPageCount };
            return;
        }
        if (resolvedDid &&
            currentPageCount >= 3 &&
            currentPageCount > paginationTrackingRef.current.page) {
            ax.metric('profile:followers:paginate', {
                contextProfileDid: resolvedDid,
                itemCount: followers.length,
                page: currentPageCount,
            });
        }
        paginationTrackingRef.current.page = currentPageCount;
    }, [ax, (_b = data === null || data === void 0 ? void 0 : data.pages) === null || _b === void 0 ? void 0 : _b.length, resolvedDid, followers.length]);
    var onRefresh = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
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
                    logger.error('Failed to refresh followers', { message: err_1 });
                    return [3 /*break*/, 4];
                case 4:
                    setIsPTRing(false);
                    return [2 /*return*/];
            }
        });
    }); }, [refetch, setIsPTRing]);
    var onEndReached = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isFetchingNextPage || !hasNextPage || !!error)
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
                    logger.error('Failed to load more followers', { message: err_2 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [isFetchingNextPage, hasNextPage, error, fetchNextPage]);
    var renderItemWithContext = React.useCallback(function (_a) {
        var item = _a.item, index = _a.index;
        return renderItem({ item: item, index: index, contextProfileDid: resolvedDid });
    }, [resolvedDid]);
    // track pageview
    React.useEffect(function () {
        if (resolvedDid) {
            ax.metric('profile:followers:view', {
                contextProfileDid: resolvedDid,
                isOwnProfile: isMe,
            });
        }
    }, [ax, resolvedDid, isMe]);
    // track seen items
    var seenItemsRef = React.useRef(new Set());
    React.useEffect(function () {
        seenItemsRef.current.clear();
    }, [resolvedDid]);
    var onItemSeen = React.useCallback(function (item) {
        if (seenItemsRef.current.has(item.did)) {
            return;
        }
        seenItemsRef.current.add(item.did);
        var position = followers.findIndex(function (p) { return p.did === item.did; }) + 1;
        if (position === 0) {
            return;
        }
        ax.metric('profileCard:seen', __assign({ profileDid: item.did, position: position }, (resolvedDid !== undefined && { contextProfileDid: resolvedDid })));
    }, [ax, followers, resolvedDid]);
    if (followers.length < 1) {
        return (_jsx(ListMaybePlaceholder, { isLoading: isDidLoading || isFollowersLoading, isError: isError, emptyType: "results", emptyMessage: isMe
                ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["No followers yet"], ["No followers yet"]))))
                : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["This user doesn't have any followers."], ["This user doesn't have any followers."])))), errorMessage: cleanError(resolveError || error), onRetry: isError ? refetch : undefined, sideBorders: false, useEmptyState: true, emptyStateIcon: PeopleRemoveIcon, emptyStateButton: {
                label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Go back"], ["Go back"])))),
                text: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Go back"], ["Go back"])))),
                color: 'secondary',
                size: 'small',
                onPress: function () { return navigation.goBack(); },
            } }));
    }
    return (_jsx(List, { data: followers, renderItem: renderItemWithContext, keyExtractor: keyExtractor, refreshing: isPTRing, onRefresh: onRefresh, onEndReached: onEndReached, onEndReachedThreshold: 4, onItemSeen: onItemSeen, ListFooterComponent: _jsx(ListFooter, { isFetchingNextPage: isFetchingNextPage, error: cleanError(error), onRetry: fetchNextPage }), 
        // @ts-ignore our .web version only -prf
        desktopFixedHeight: true, initialNumToRender: initialNumToRender, windowSize: 11, sideBorders: false }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
