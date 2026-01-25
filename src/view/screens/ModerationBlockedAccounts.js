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
import { Trans } from '@lingui/macro';
import { useFocusEffect } from '@react-navigation/native';
import { cleanError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useMyBlockedAccountsQuery } from '#/state/queries/my-blocked-accounts';
import { useSetMinimalShellMode } from '#/state/shell';
import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { List } from '#/view/com/util/List';
import { atoms as a, useTheme } from '#/alf';
import * as Layout from '#/components/Layout';
import { ListFooter } from '#/components/Lists';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';
export function ModerationBlockedAccounts(_a) {
    var _this = this;
    var _b;
    var t = useTheme();
    var setMinimalShellMode = useSetMinimalShellMode();
    var moderationOpts = useModerationOpts();
    var _c = useState(false), isPTRing = _c[0], setIsPTRing = _c[1];
    var _d = useMyBlockedAccountsQuery(), data = _d.data, isFetching = _d.isFetching, isError = _d.isError, error = _d.error, refetch = _d.refetch, hasNextPage = _d.hasNextPage, fetchNextPage = _d.fetchNextPage, isFetchingNextPage = _d.isFetchingNextPage;
    var isEmpty = !isFetching && !((_b = data === null || data === void 0 ? void 0 : data.pages[0]) === null || _b === void 0 ? void 0 : _b.blocks.length);
    var profiles = useMemo(function () {
        if (data === null || data === void 0 ? void 0 : data.pages) {
            return data.pages.flatMap(function (page) { return page.blocks; });
        }
        return [];
    }, [data]);
    useFocusEffect(useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
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
                    logger.error('Failed to refresh my muted accounts', { message: err_1 });
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
                    logger.error('Failed to load more of my muted accounts', { message: err_2 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [isFetching, hasNextPage, isError, fetchNextPage]);
    var renderItem = function (_a) {
        var item = _a.item, index = _a.index;
        if (!moderationOpts)
            return null;
        return (_jsx(View, { style: [a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low], children: _jsx(ProfileCard.Default, { testID: "blockedAccount-".concat(index), profile: item, moderationOpts: moderationOpts }) }, item.did));
    };
    return (_jsx(Layout.Screen, { testID: "blockedAccountsScreen", children: _jsxs(Layout.Center, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Blocked Accounts" }) }) }), _jsx(Layout.Header.Slot, {})] }), isEmpty ? (_jsxs(View, { children: [_jsx(Info, { style: [a.border_b] }), isError ? (_jsx(ErrorScreen, { title: "Oops!", message: cleanError(error), onPressTryAgain: refetch })) : (_jsx(Empty, {}))] })) : (_jsx(List, { data: profiles, keyExtractor: function (item) { return item.did; }, refreshing: isPTRing, onRefresh: onRefresh, onEndReached: onEndReached, renderItem: renderItem, initialNumToRender: 15, 
                    // FIXME(dan)
                    ListHeaderComponent: Info, ListFooterComponent: _jsx(ListFooter, { isFetchingNextPage: isFetchingNextPage, hasNextPage: hasNextPage, error: cleanError(error), onRetry: fetchNextPage }) }))] }) }));
}
function Empty() {
    var t = useTheme();
    return (_jsx(View, { style: [a.pt_2xl, a.px_xl, a.align_center], children: _jsx(View, { style: [
                a.py_md,
                a.px_lg,
                a.rounded_sm,
                t.atoms.bg_contrast_25,
                a.border,
                t.atoms.border_contrast_low,
                { maxWidth: 400 },
            ], children: _jsx(Text, { style: [a.text_sm, a.text_center, t.atoms.text_contrast_high], children: _jsx(Trans, { children: "You have not blocked any accounts yet. To block an account, go to their profile and select \"Block account\" from the menu on their account." }) }) }) }));
}
function Info(_a) {
    var style = _a.style;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.w_full,
            t.atoms.bg_contrast_25,
            a.py_md,
            a.px_xl,
            a.border_t,
            { marginTop: a.border.borderWidth * -1 },
            t.atoms.border_contrast_low,
            style,
        ], children: _jsx(Text, { style: [a.text_center, a.text_sm, t.atoms.text_contrast_high], children: _jsx(Trans, { children: "Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you. You will not see their content and they will be prevented from seeing yours." }) }) }));
}
