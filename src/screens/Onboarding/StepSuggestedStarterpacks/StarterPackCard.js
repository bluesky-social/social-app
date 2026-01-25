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
import { useState } from 'react';
import { View } from 'react-native';
import { AppBskyGraphStarterpack } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { batchedUpdates } from '#/lib/batchedUpdates';
import { isBlockedOrBlocking, isMuted } from '#/lib/moderation/blocked-and-muted';
import { logger } from '#/logger';
import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { getAllListMembers } from '#/state/queries/list-members';
import { useAgent, useSession } from '#/state/session';
import { bulkWriteFollows } from '#/screens/Onboarding/util';
import { AvatarStack } from '#/screens/Search/components/StarterPackCard';
import { atoms as a, useBreakpoints, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import * as bsky from '#/types/bsky';
var IGNORED_ACCOUNT = 'did:plc:pifkcjimdcfwaxkanzhwxufp';
export function StarterPackCard(_a) {
    var _this = this;
    var _b, _c;
    var view = _a.view;
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var gtPhone = useBreakpoints().gtPhone;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var record = view.record;
    var _d = useState(false), isProcessing = _d[0], setIsProcessing = _d[1];
    var _e = useState(false), isFollowingAll = _e[0], setIsFollowingAll = _e[1];
    var onFollowAll = function () { return __awaiter(_this, void 0, void 0, function () {
        var listItems, e_1, dids, followUris, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!view.list)
                        return [2 /*return*/];
                    setIsProcessing(true);
                    listItems = [];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, getAllListMembers(agent, view.list.uri)];
                case 2:
                    listItems = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    setIsProcessing(false);
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["An error occurred while trying to follow all"], ["An error occurred while trying to follow all"])))), {
                        type: 'error',
                    });
                    logger.error('Failed to get list members for starter pack', {
                        safeMessage: e_1,
                    });
                    return [2 /*return*/];
                case 4:
                    dids = listItems
                        .filter(function (li) {
                        var _a;
                        return li.subject.did !== IGNORED_ACCOUNT &&
                            li.subject.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) &&
                            !isBlockedOrBlocking(li.subject) &&
                            !isMuted(li.subject) &&
                            !((_a = li.subject.viewer) === null || _a === void 0 ? void 0 : _a.following);
                    })
                        .map(function (li) { return li.subject.did; });
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, bulkWriteFollows(agent, dids)];
                case 6:
                    followUris = _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    e_2 = _a.sent();
                    setIsProcessing(false);
                    Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["An error occurred while trying to follow all"], ["An error occurred while trying to follow all"])))), {
                        type: 'error',
                    });
                    logger.error('Failed to follow all accounts', { safeMessage: e_2 });
                    return [3 /*break*/, 8];
                case 8:
                    setIsFollowingAll(true);
                    setIsProcessing(false);
                    batchedUpdates(function () {
                        for (var _i = 0, dids_1 = dids; _i < dids_1.length; _i++) {
                            var did = dids_1[_i];
                            updateProfileShadow(queryClient, did, {
                                followingUri: followUris.get(did),
                            });
                        }
                    });
                    Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["All accounts have been followed!"], ["All accounts have been followed!"])))), { type: 'success' });
                    ax.metric('starterPack:followAll', {
                        logContext: 'Onboarding',
                        starterPack: view.uri,
                        count: dids.length,
                    });
                    return [2 /*return*/];
            }
        });
    }); };
    if (!bsky.dangerousIsType(record, AppBskyGraphStarterpack.isRecord)) {
        return null;
    }
    var profileCount = gtPhone ? 11 : 8;
    var profiles = (_b = view.listItemsSample) === null || _b === void 0 ? void 0 : _b.slice(0, profileCount).map(function (item) { return item.subject; });
    return (_jsxs(View, { style: [
            a.w_full,
            a.p_lg,
            a.gap_md,
            a.border,
            a.rounded_lg,
            a.overflow_hidden,
            t.atoms.border_contrast_medium,
        ], children: [_jsx(AvatarStack, { profiles: profiles !== null && profiles !== void 0 ? profiles : [], numPending: profileCount, total: (_c = view.list) === null || _c === void 0 ? void 0 : _c.listItemCount }), _jsxs(View, { style: [
                    a.w_full,
                    a.flex_row,
                    a.align_end,
                    a.gap_lg,
                    web({
                        position: 'static',
                        zIndex: 'unset',
                    }),
                ], children: [_jsxs(View, { style: [a.flex_1, a.gap_2xs], children: [_jsx(Text, { emoji: true, style: [a.text_md, a.font_semi_bold, a.leading_snug], numberOfLines: 1, children: record.name }), _jsx(Text, { emoji: true, style: [a.text_xs, t.atoms.text_contrast_medium, a.leading_snug], numberOfLines: 2, children: record.description })] }), _jsxs(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Follow all"], ["Follow all"])))), disabled: isProcessing || isFollowingAll, onPress: onFollowAll, color: "secondary", size: "small", style: [a.z_50], children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Follow all" }) }), isFollowingAll ? (_jsx(ButtonIcon, { icon: CheckIcon })) : (isProcessing && _jsx(ButtonIcon, { icon: Loader }))] })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
