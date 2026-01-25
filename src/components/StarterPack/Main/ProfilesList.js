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
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { AtUri, } from '@atproto/api';
import { useBottomBarOffset } from '#/lib/hooks/useBottomBarOffset';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { isBlockedOrBlocking } from '#/lib/moderation/blocked-and-muted';
import { useAllListMembersQuery } from '#/state/queries/list-members';
import { useSession } from '#/state/session';
import { List } from '#/view/com/util/List';
import { atoms as a, useTheme } from '#/alf';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { Default as ProfileCard } from '#/components/ProfileCard';
import { IS_NATIVE, IS_WEB } from '#/env';
function keyExtractor(item, index) {
    return "".concat(item.did, "-").concat(index);
}
export var ProfilesList = React.forwardRef(function ProfilesListImpl(_a, ref) {
    var _this = this;
    var listUri = _a.listUri, moderationOpts = _a.moderationOpts, headerHeight = _a.headerHeight, scrollElRef = _a.scrollElRef;
    var t = useTheme();
    var bottomBarOffset = useBottomBarOffset(headerHeight);
    var initialNumToRender = useInitialNumToRender();
    var currentAccount = useSession().currentAccount;
    var _b = useAllListMembersQuery(listUri), data = _b.data, refetch = _b.refetch, isError = _b.isError;
    var _c = React.useState(false), isPTRing = _c[0], setIsPTRing = _c[1];
    // The server returns these sorted by descending creation date, so we want to invert
    var profiles = data === null || data === void 0 ? void 0 : data.filter(function (p) { var _a; return !isBlockedOrBlocking(p.subject) && !((_a = p.subject.associated) === null || _a === void 0 ? void 0 : _a.labeler); }).map(function (p) { return p.subject; }).reverse();
    var isOwn = new AtUri(listUri).host === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var getSortedProfiles = function () {
        if (!profiles)
            return;
        if (!isOwn)
            return profiles;
        var myIndex = profiles.findIndex(function (p) { return p.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); });
        return myIndex !== -1
            ? __spreadArray(__spreadArray([
                profiles[myIndex]
            ], profiles.slice(0, myIndex), true), profiles.slice(myIndex + 1), true) : profiles;
    };
    var onScrollToTop = useCallback(function () {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            animated: IS_NATIVE,
            offset: -headerHeight,
        });
    }, [scrollElRef, headerHeight]);
    React.useImperativeHandle(ref, function () { return ({
        scrollToTop: onScrollToTop,
    }); });
    var renderItem = function (_a) {
        var item = _a.item, index = _a.index;
        return (_jsx(View, { style: [
                a.p_lg,
                t.atoms.border_contrast_low,
                (IS_WEB || index !== 0) && a.border_t,
            ], children: _jsx(ProfileCard, { profile: item, moderationOpts: moderationOpts, logContext: "StarterPackProfilesList" }) }));
    };
    if (!data) {
        return (_jsx(View, { style: [
                a.h_full_vh,
                { marginTop: headerHeight, marginBottom: bottomBarOffset },
            ], children: _jsx(ListMaybePlaceholder, { isLoading: true, isError: isError, onRetry: refetch }) }));
    }
    if (data)
        return (_jsx(List, { data: getSortedProfiles(), renderItem: renderItem, keyExtractor: keyExtractor, ref: scrollElRef, headerOffset: headerHeight, ListFooterComponent: _jsx(ListFooter, { style: { paddingBottom: bottomBarOffset, borderTopWidth: 0 } }), showsVerticalScrollIndicator: false, desktopFixedHeight: true, initialNumToRender: initialNumToRender, refreshing: isPTRing, onRefresh: function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setIsPTRing(true);
                            return [4 /*yield*/, refetch()];
                        case 1:
                            _a.sent();
                            setIsPTRing(false);
                            return [2 /*return*/];
                    }
                });
            }); } }));
});
