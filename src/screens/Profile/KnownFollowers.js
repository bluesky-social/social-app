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
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useFocusEffect } from '@react-navigation/native';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { cleanError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { useProfileKnownFollowersQuery } from '#/state/queries/known-followers';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSetMinimalShellMode } from '#/state/shell';
import { ProfileCardWithFollowBtn } from '#/view/com/profile/ProfileCard';
import { List } from '#/view/com/util/List';
import { ViewHeader } from '#/view/com/util/ViewHeader';
import * as Layout from '#/components/Layout';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
function renderItem(_a) {
    var item = _a.item, index = _a.index;
    return (_jsx(ProfileCardWithFollowBtn, { profile: item, noBorder: index === 0 }, item.did));
}
function keyExtractor(item) {
    return item.did;
}
export var ProfileKnownFollowersScreen = function (_a) {
    var route = _a.route;
    var _ = useLingui()._;
    var setMinimalShellMode = useSetMinimalShellMode();
    var initialNumToRender = useInitialNumToRender();
    var name = route.params.name;
    var _b = React.useState(false), isPTRing = _b[0], setIsPTRing = _b[1];
    var _c = useResolveDidQuery(route.params.name), resolvedDid = _c.data, isDidLoading = _c.isLoading, resolveError = _c.error;
    var _d = useProfileKnownFollowersQuery(resolvedDid), data = _d.data, isFollowersLoading = _d.isLoading, isFetchingNextPage = _d.isFetchingNextPage, hasNextPage = _d.hasNextPage, fetchNextPage = _d.fetchNextPage, error = _d.error, refetch = _d.refetch;
    var onRefresh = React.useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
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
    var onEndReached = React.useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
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
    var followers = React.useMemo(function () {
        if (data === null || data === void 0 ? void 0 : data.pages) {
            return data.pages.flatMap(function (page) { return page.followers; });
        }
        return [];
    }, [data]);
    var isError = Boolean(resolveError || error);
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    if (followers.length < 1) {
        return (_jsxs(Layout.Screen, { children: [_jsx(ViewHeader, { title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Followers you know"], ["Followers you know"])))) }), _jsx(ListMaybePlaceholder, { isLoading: isDidLoading || isFollowersLoading, isError: isError, emptyType: "results", emptyMessage: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["You don't follow any users who follow @", "."], ["You don't follow any users who follow @", "."])), name)), errorMessage: cleanError(resolveError || error), onRetry: isError ? refetch : undefined, topBorder: false, sideBorders: false })] }));
    }
    return (_jsxs(Layout.Screen, { children: [_jsx(ViewHeader, { title: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Followers you know"], ["Followers you know"])))) }), _jsx(List, { data: followers, renderItem: renderItem, keyExtractor: keyExtractor, refreshing: isPTRing, onRefresh: onRefresh, onEndReached: onEndReached, onEndReachedThreshold: 4, ListFooterComponent: _jsx(ListFooter, { isFetchingNextPage: isFetchingNextPage, error: cleanError(error), onRetry: fetchNextPage }), 
                // @ts-ignore our .web version only -prf
                desktopFixedHeight: true, initialNumToRender: initialNumToRender, windowSize: 11, sideBorders: false })] }));
};
var templateObject_1, templateObject_2, templateObject_3;
