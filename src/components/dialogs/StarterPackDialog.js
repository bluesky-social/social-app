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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { AppBskyGraphStarterpack, } from '@atproto/api';
import { msg, Plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useRequireEmailVerification } from '#/lib/hooks/useRequireEmailVerification';
import { invalidateActorStarterPacksWithMembershipQuery, useActorStarterPacksWithMembershipsQuery, } from '#/state/queries/actor-starter-packs';
import { useListMembershipAddMutation, useListMembershipRemoveMutation, } from '#/state/queries/list-memberships';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useTheme } from '#/alf';
import { AvatarStack } from '#/components/AvatarStack';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Divider } from '#/components/Divider';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { StarterPack } from '#/components/icons/StarterPack';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
import * as bsky from '#/types/bsky';
export function StarterPackDialog(_a) {
    var control = _a.control, targetDid = _a.targetDid, enabled = _a.enabled;
    var navigation = useNavigation();
    var requireEmailVerification = useRequireEmailVerification();
    var navToWizard = useCallback(function () {
        control.close();
        navigation.navigate('StarterPackWizard', {
            fromDialog: true,
            targetDid: targetDid,
            onSuccess: function () {
                setTimeout(function () {
                    if (!control.isOpen) {
                        control.open();
                    }
                }, 0);
            },
        });
    }, [navigation, control, targetDid]);
    var wrappedNavToWizard = requireEmailVerification(navToWizard, {
        instructions: [
            _jsx(Trans, { children: "Before creating a starter pack, you must first verify your email." }, "nav"),
        ],
    });
    return (_jsxs(Dialog.Outer, { control: control, children: [_jsx(Dialog.Handle, {}), _jsx(StarterPackList, { onStartWizard: wrappedNavToWizard, targetDid: targetDid, enabled: enabled })] }));
}
function Empty(_a) {
    var onStartWizard = _a.onStartWizard;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsxs(View, { style: [a.gap_2xl, { paddingTop: IS_WEB ? 100 : 64 }], children: [_jsxs(View, { style: [a.gap_xs, a.align_center], children: [_jsx(StarterPack, { width: 48, fill: t.atoms.border_contrast_medium.borderColor }), _jsx(Text, { style: [a.text_center], children: _jsx(Trans, { children: "You have no starter packs." }) })] }), _jsx(View, { style: [a.align_center], children: _jsxs(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Create starter pack"], ["Create starter pack"])))), color: "secondary_inverted", size: "small", onPress: onStartWizard, children: [_jsx(ButtonText, { children: _jsx(Trans, { comment: "Text on button to create a new starter pack", children: "Create" }) }), _jsx(ButtonIcon, { icon: PlusIcon })] }) })] }));
}
function StarterPackList(_a) {
    var _this = this;
    var onStartWizard = _a.onStartWizard, targetDid = _a.targetDid, enabled = _a.enabled;
    var control = Dialog.useDialogContext();
    var _ = useLingui()._;
    var _b = useActorStarterPacksWithMembershipsQuery({ did: targetDid, enabled: enabled }), data = _b.data, isError = _b.isError, isLoading = _b.isLoading, hasNextPage = _b.hasNextPage, isFetchingNextPage = _b.isFetchingNextPage, fetchNextPage = _b.fetchNextPage;
    var membershipItems = (data === null || data === void 0 ? void 0 : data.pages.flatMap(function (page) { return page.starterPacksWithMembership; })) || [];
    var onEndReached = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
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
                    err_1 = _a.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage]);
    var renderItem = useCallback(function (_a) {
        var item = _a.item;
        return (_jsx(StarterPackItem, { starterPackWithMembership: item, targetDid: targetDid }));
    }, [targetDid]);
    var onClose = useCallback(function () {
        control.close();
    }, [control]);
    var listHeader = (_jsxs(_Fragment, { children: [_jsxs(View, { style: [
                    { justifyContent: 'space-between', flexDirection: 'row' },
                    IS_WEB ? a.mb_2xl : a.my_lg,
                    a.align_center,
                ], children: [_jsx(Text, { style: [a.text_lg, a.font_semi_bold], children: _jsx(Trans, { children: "Add to starter packs" }) }), _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Close"], ["Close"])))), onPress: onClose, variant: "ghost", color: "secondary", size: "small", shape: "round", children: _jsx(ButtonIcon, { icon: XIcon }) })] }), membershipItems.length > 0 && (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.flex_row, a.justify_between, a.align_center, a.py_md], children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold], children: _jsx(Trans, { children: "New starter pack" }) }), _jsxs(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Create starter pack"], ["Create starter pack"])))), color: "secondary_inverted", size: "small", onPress: onStartWizard, children: [_jsx(ButtonText, { children: _jsx(Trans, { comment: "Text on button to create a new starter pack", children: "Create" }) }), _jsx(ButtonIcon, { icon: PlusIcon })] })] }), _jsx(Divider, {})] }))] }));
    return (_jsx(Dialog.InnerFlatList, { data: isLoading ? [{}] : membershipItems, renderItem: isLoading
            ? function () { return (_jsx(View, { style: [a.align_center, a.py_2xl], children: _jsx(Loader, { size: "xl" }) })); }
            : renderItem, keyExtractor: isLoading
            ? function () { return 'starter_pack_dialog_loader'; }
            : function (item) { return item.starterPack.uri; }, onEndReached: onEndReached, onEndReachedThreshold: 0.1, ListHeaderComponent: listHeader, ListEmptyComponent: _jsx(Empty, { onStartWizard: onStartWizard }), style: IS_WEB ? [a.px_md, { minHeight: 500 }] : [a.px_2xl, a.pt_lg] }));
}
function StarterPackItem(_a) {
    var _b, _c;
    var starterPackWithMembership = _a.starterPackWithMembership, targetDid = _a.targetDid;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var queryClient = useQueryClient();
    var starterPack = starterPackWithMembership.starterPack;
    var isInPack = !!starterPackWithMembership.listItem;
    var _d = useState(false), isPendingRefresh = _d[0], setIsPendingRefresh = _d[1];
    var addMembership = useListMembershipAddMutation({
        onSuccess: function () {
            Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Added to starter pack"], ["Added to starter pack"])))));
            // Use a timeout to wait for the appview to update, matching the pattern
            // in list-memberships.ts
            setTimeout(function () {
                invalidateActorStarterPacksWithMembershipQuery({
                    queryClient: queryClient,
                    did: targetDid,
                });
                setIsPendingRefresh(false);
            }, 1e3);
        },
        onError: function () {
            Toast.show(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Failed to add to starter pack"], ["Failed to add to starter pack"])))), 'xmark');
            setIsPendingRefresh(false);
        },
    }).mutate;
    var removeMembership = useListMembershipRemoveMutation({
        onSuccess: function () {
            Toast.show(_(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Removed from starter pack"], ["Removed from starter pack"])))));
            // Use a timeout to wait for the appview to update, matching the pattern
            // in list-memberships.ts
            setTimeout(function () {
                invalidateActorStarterPacksWithMembershipQuery({
                    queryClient: queryClient,
                    did: targetDid,
                });
                setIsPendingRefresh(false);
            }, 1e3);
        },
        onError: function () {
            Toast.show(_(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Failed to remove from starter pack"], ["Failed to remove from starter pack"])))), 'xmark');
            setIsPendingRefresh(false);
        },
    }).mutate;
    var handleToggleMembership = function () {
        var _a, _b;
        if (!((_a = starterPack.list) === null || _a === void 0 ? void 0 : _a.uri) || isPendingRefresh)
            return;
        var listUri = starterPack.list.uri;
        var starterPackUri = starterPack.uri;
        setIsPendingRefresh(true);
        if (!isInPack) {
            addMembership({
                listUri: listUri,
                actorDid: targetDid,
            });
            ax.metric('starterPack:addUser', { starterPack: starterPackUri });
        }
        else {
            if (!((_b = starterPackWithMembership.listItem) === null || _b === void 0 ? void 0 : _b.uri)) {
                console.error('Cannot remove: missing membership URI');
                setIsPendingRefresh(false);
                return;
            }
            removeMembership({
                listUri: listUri,
                actorDid: targetDid,
                membershipUri: starterPackWithMembership.listItem.uri,
            });
            ax.metric('starterPack:removeUser', { starterPack: starterPackUri });
        }
    };
    var record = starterPack.record;
    if (!bsky.dangerousIsType(record, AppBskyGraphStarterpack.isRecord)) {
        return null;
    }
    return (_jsxs(View, { style: [a.flex_row, a.justify_between, a.align_center, a.py_md], children: [_jsxs(View, { children: [_jsx(Text, { emoji: true, style: [a.text_md, a.font_semi_bold], numberOfLines: 1, children: record.name }), _jsx(View, { style: [a.flex_row, a.align_center, a.mt_xs], children: starterPack.listItemsSample &&
                            starterPack.listItemsSample.length > 0 && (_jsxs(_Fragment, { children: [_jsx(AvatarStack, { size: 32, profiles: (_b = starterPack.listItemsSample) === null || _b === void 0 ? void 0 : _b.slice(0, 4).map(function (p) { return p.subject; }) }), ((_c = starterPack.list) === null || _c === void 0 ? void 0 : _c.listItemCount) &&
                                    starterPack.list.listItemCount > 4 && (_jsx(Text, { style: [
                                        a.text_sm,
                                        t.atoms.text_contrast_medium,
                                        a.ml_xs,
                                    ], children: _jsx(Trans, { children: _jsx(Plural, { value: starterPack.list.listItemCount - 4, other: "+# more" }) }) }))] })) })] }), _jsx(Button, { label: isInPack ? _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Remove"], ["Remove"])))) : _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Add"], ["Add"])))), color: isInPack ? 'secondary' : 'primary_subtle', size: "tiny", disabled: isPendingRefresh, onPress: handleToggleMembership, children: _jsx(ButtonText, { children: isInPack ? _jsx(Trans, { children: "Remove" }) : _jsx(Trans, { children: "Add" }) }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
