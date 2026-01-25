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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { memo } from 'react';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useActorStatus } from '#/lib/actor-status';
import { HITSLOP_20 } from '#/lib/constants';
import { makeProfileLink } from '#/lib/routes/links';
import { shareText, shareUrl } from '#/lib/sharing';
import { toShareUrl } from '#/lib/strings/url-helpers';
import { useModalControls } from '#/state/modals';
import { Nux, useNux, useSaveNux } from '#/state/queries/nuxs';
import { RQKEY as profileQueryKey, useProfileBlockMutationQueue, useProfileFollowMutationQueue, useProfileMuteMutationQueue, } from '#/state/queries/profile';
import { useCanGoLive } from '#/state/service-config';
import { useSession } from '#/state/session';
import { EventStopper } from '#/view/com/util/EventStopper';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { StarterPackDialog } from '#/components/dialogs/StarterPackDialog';
import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ArrowOutOfBoxIcon } from '#/components/icons/ArrowOutOfBox';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon } from '#/components/icons/CircleCheck';
import { CircleX_Stroke2_Corner0_Rounded as CircleXIcon } from '#/components/icons/CircleX';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { DotGrid_Stroke2_Corner0_Rounded as Ellipsis } from '#/components/icons/DotGrid';
import { Flag_Stroke2_Corner0_Rounded as Flag } from '#/components/icons/Flag';
import { ListSparkle_Stroke2_Corner0_Rounded as List } from '#/components/icons/ListSparkle';
import { Live_Stroke2_Corner0_Rounded as LiveIcon } from '#/components/icons/Live';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon } from '#/components/icons/MagnifyingGlass';
import { Mute_Stroke2_Corner0_Rounded as Mute } from '#/components/icons/Mute';
import { PeopleRemove2_Stroke2_Corner0_Rounded as UserMinus } from '#/components/icons/PeopleRemove2';
import { PersonCheck_Stroke2_Corner0_Rounded as PersonCheck, PersonX_Stroke2_Corner0_Rounded as PersonX, } from '#/components/icons/Person';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute } from '#/components/icons/Speaker';
import { StarterPack } from '#/components/icons/StarterPack';
import { EditLiveDialog } from '#/components/live/EditLiveDialog';
import { GoLiveDialog } from '#/components/live/GoLiveDialog';
import { GoLiveDisabledDialog } from '#/components/live/GoLiveDisabledDialog';
import * as Menu from '#/components/Menu';
import { ReportDialog, useReportDialogControl, } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import { useFullVerificationState } from '#/components/verification';
import { VerificationCreatePrompt } from '#/components/verification/VerificationCreatePrompt';
import { VerificationRemovePrompt } from '#/components/verification/VerificationRemovePrompt';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
import { Dot } from '#/features/nuxs/components/Dot';
import { Gradient } from '#/features/nuxs/components/Gradient';
import { useDevMode } from '#/storage/hooks/dev-mode';
var ProfileMenu = function (_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    var profile = _a.profile;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var _0 = useSession(), currentAccount = _0.currentAccount, hasSession = _0.hasSession;
    var openModal = useModalControls().openModal;
    var reportDialogControl = useReportDialogControl();
    var queryClient = useQueryClient();
    var navigation = useNavigation();
    var isSelf = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === profile.did;
    var isFollowing = (_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.following;
    var isBlocked = ((_c = profile.viewer) === null || _c === void 0 ? void 0 : _c.blocking) || ((_d = profile.viewer) === null || _d === void 0 ? void 0 : _d.blockedBy);
    var isFollowingBlockedAccount = isFollowing && isBlocked;
    var isLabelerAndNotBlocked = !!((_e = profile.associated) === null || _e === void 0 ? void 0 : _e.labeler) && !isBlocked;
    var devModeEnabled = useDevMode()[0];
    var verification = useFullVerificationState({ profile: profile });
    var canGoLive = useCanGoLive();
    var status = useActorStatus(profile);
    var statusNudge = useNux(Nux.LiveNowBetaNudge);
    var statusNudgeActive = isSelf &&
        canGoLive &&
        statusNudge.status === 'ready' &&
        !((_f = statusNudge.nux) === null || _f === void 0 ? void 0 : _f.completed);
    var saveNux = useSaveNux().mutate;
    var _1 = useProfileMuteMutationQueue(profile), queueMute = _1[0], queueUnmute = _1[1];
    var _2 = useProfileBlockMutationQueue(profile), queueBlock = _2[0], queueUnblock = _2[1];
    var _3 = useProfileFollowMutationQueue(profile, 'ProfileMenu'), queueFollow = _3[0], queueUnfollow = _3[1];
    var blockPromptControl = Prompt.usePromptControl();
    var loggedOutWarningPromptControl = Prompt.usePromptControl();
    var goLiveDialogControl = useDialogControl();
    var goLiveDisabledDialogControl = useDialogControl();
    var addToStarterPacksDialogControl = useDialogControl();
    var showLoggedOutWarning = React.useMemo(function () {
        var _a;
        return (profile.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) &&
            !!((_a = profile.labels) === null || _a === void 0 ? void 0 : _a.find(function (label) { return label.val === '!no-unauthenticated'; })));
    }, [currentAccount, profile]);
    var invalidateProfileQuery = React.useCallback(function () {
        queryClient.invalidateQueries({
            queryKey: profileQueryKey(profile.did),
        });
    }, [queryClient, profile.did]);
    var onPressAddToStarterPacks = React.useCallback(function () {
        ax.metric('profile:addToStarterPack', {});
        addToStarterPacksDialogControl.open();
    }, [addToStarterPacksDialogControl]);
    var onPressShare = React.useCallback(function () {
        shareUrl(toShareUrl(makeProfileLink(profile)));
    }, [profile]);
    var onPressAddRemoveLists = React.useCallback(function () {
        openModal({
            name: 'user-add-remove-lists',
            subject: profile.did,
            handle: profile.handle,
            displayName: profile.displayName || profile.handle,
            onAdd: invalidateProfileQuery,
            onRemove: invalidateProfileQuery,
        });
    }, [profile, openModal, invalidateProfileQuery]);
    var onPressMuteAccount = React.useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_1, e_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!((_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.muted)) return [3 /*break*/, 5];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, queueUnmute()];
                case 2:
                    _b.sent();
                    Toast.show(_(msg({ message: 'Account unmuted', context: 'toast' })));
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _b.sent();
                    if ((e_1 === null || e_1 === void 0 ? void 0 : e_1.name) !== 'AbortError') {
                        ax.logger.error('Failed to unmute account', { message: e_1 });
                        Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_1.toString())), 'xmark');
                    }
                    return [3 /*break*/, 4];
                case 4: return [3 /*break*/, 8];
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, queueMute()];
                case 6:
                    _b.sent();
                    Toast.show(_(msg({ message: 'Account muted', context: 'toast' })));
                    return [3 /*break*/, 8];
                case 7:
                    e_2 = _b.sent();
                    if ((e_2 === null || e_2 === void 0 ? void 0 : e_2.name) !== 'AbortError') {
                        ax.logger.error('Failed to mute account', { message: e_2 });
                        Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_2.toString())), 'xmark');
                    }
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); }, [ax, (_g = profile.viewer) === null || _g === void 0 ? void 0 : _g.muted, queueUnmute, _, queueMute]);
    var blockAccount = React.useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_3, e_4;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!((_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.blocking)) return [3 /*break*/, 5];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, queueUnblock()];
                case 2:
                    _b.sent();
                    Toast.show(_(msg({ message: 'Account unblocked', context: 'toast' })));
                    return [3 /*break*/, 4];
                case 3:
                    e_3 = _b.sent();
                    if ((e_3 === null || e_3 === void 0 ? void 0 : e_3.name) !== 'AbortError') {
                        ax.logger.error('Failed to unblock account', { message: e_3 });
                        Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_3.toString())), 'xmark');
                    }
                    return [3 /*break*/, 4];
                case 4: return [3 /*break*/, 8];
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, queueBlock()];
                case 6:
                    _b.sent();
                    Toast.show(_(msg({ message: 'Account blocked', context: 'toast' })));
                    return [3 /*break*/, 8];
                case 7:
                    e_4 = _b.sent();
                    if ((e_4 === null || e_4 === void 0 ? void 0 : e_4.name) !== 'AbortError') {
                        ax.logger.error('Failed to block account', { message: e_4 });
                        Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_4.toString())), 'xmark');
                    }
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); }, [ax, (_h = profile.viewer) === null || _h === void 0 ? void 0 : _h.blocking, _, queueUnblock, queueBlock]);
    var onPressFollowAccount = React.useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, queueFollow()];
                case 1:
                    _a.sent();
                    Toast.show(_(msg({ message: 'Account followed', context: 'toast' })));
                    return [3 /*break*/, 3];
                case 2:
                    e_5 = _a.sent();
                    if ((e_5 === null || e_5 === void 0 ? void 0 : e_5.name) !== 'AbortError') {
                        ax.logger.error('Failed to follow account', { message: e_5 });
                        Toast.show(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_5.toString())), 'xmark');
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, [_, ax, queueFollow]);
    var onPressUnfollowAccount = React.useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, queueUnfollow()];
                case 1:
                    _a.sent();
                    Toast.show(_(msg({ message: 'Account unfollowed', context: 'toast' })));
                    return [3 /*break*/, 3];
                case 2:
                    e_6 = _a.sent();
                    if ((e_6 === null || e_6 === void 0 ? void 0 : e_6.name) !== 'AbortError') {
                        ax.logger.error('Failed to unfollow account', { message: e_6 });
                        Toast.show(_(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_6.toString())), 'xmark');
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, [_, ax, queueUnfollow]);
    var onPressReportAccount = React.useCallback(function () {
        reportDialogControl.open();
    }, [reportDialogControl]);
    var onPressShareATUri = React.useCallback(function () {
        shareText("at://".concat(profile.did));
    }, [profile.did]);
    var onPressShareDID = React.useCallback(function () {
        shareText(profile.did);
    }, [profile.did]);
    var onPressSearch = React.useCallback(function () {
        navigation.navigate('ProfileSearch', { name: profile.handle });
    }, [navigation, profile.handle]);
    var verificationCreatePromptControl = Prompt.usePromptControl();
    var verificationRemovePromptControl = Prompt.usePromptControl();
    var currentAccountVerifications = (_l = (_k = (_j = profile.verification) === null || _j === void 0 ? void 0 : _j.verifications) === null || _k === void 0 ? void 0 : _k.filter(function (v) {
        return v.issuer === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    })) !== null && _l !== void 0 ? _l : [];
    return (_jsxs(EventStopper, { onKeyDown: false, children: [_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["More options"], ["More options"])))), children: function (_a) {
                            var props = _a.props;
                            return (_jsxs(_Fragment, { children: [_jsxs(Button, __assign({}, props, { testID: "profileHeaderDropdownBtn", label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["More options"], ["More options"])))), hitSlop: HITSLOP_20, variant: "solid", color: "secondary", size: "small", shape: "round", children: [statusNudgeActive && _jsx(Gradient, { style: [a.rounded_full] }), _jsx(ButtonIcon, { icon: Ellipsis, size: "sm" })] })), statusNudgeActive && _jsx(Dot, { top: 1, right: 1 })] }));
                        } }), _jsxs(Menu.Outer, { style: { minWidth: 170 }, children: [_jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { testID: "profileHeaderDropdownShareBtn", label: IS_WEB ? _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Copy link to profile"], ["Copy link to profile"])))) : _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Share via..."], ["Share via..."])))), onPress: function () {
                                            if (showLoggedOutWarning) {
                                                loggedOutWarningPromptControl.open();
                                            }
                                            else {
                                                onPressShare();
                                            }
                                        }, children: [_jsx(Menu.ItemText, { children: IS_WEB ? (_jsx(Trans, { children: "Copy link to profile" })) : (_jsx(Trans, { children: "Share via..." })) }), _jsx(Menu.ItemIcon, { icon: IS_WEB ? ChainLinkIcon : ArrowOutOfBoxIcon })] }), _jsxs(Menu.Item, { testID: "profileHeaderDropdownSearchBtn", label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Search posts"], ["Search posts"])))), onPress: onPressSearch, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Search posts" }) }), _jsx(Menu.ItemIcon, { icon: SearchIcon })] })] }), hasSession && (_jsxs(_Fragment, { children: [_jsx(Menu.Divider, {}), _jsxs(Menu.Group, { children: [!isSelf && (_jsx(_Fragment, { children: (isLabelerAndNotBlocked || isFollowingBlockedAccount) && (_jsxs(Menu.Item, { testID: "profileHeaderDropdownFollowBtn", label: isFollowing
                                                        ? _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Unfollow account"], ["Unfollow account"]))))
                                                        : _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Follow account"], ["Follow account"])))), onPress: isFollowing
                                                        ? onPressUnfollowAccount
                                                        : onPressFollowAccount, children: [_jsx(Menu.ItemText, { children: isFollowing ? (_jsx(Trans, { children: "Unfollow account" })) : (_jsx(Trans, { children: "Follow account" })) }), _jsx(Menu.ItemIcon, { icon: isFollowing ? UserMinus : Plus })] })) })), _jsxs(Menu.Item, { testID: "profileHeaderDropdownStarterPackAddRemoveBtn", label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Add to starter packs"], ["Add to starter packs"])))), onPress: onPressAddToStarterPacks, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Add to starter packs" }) }), _jsx(Menu.ItemIcon, { icon: StarterPack })] }), _jsxs(Menu.Item, { testID: "profileHeaderDropdownListAddRemoveBtn", label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Add to lists"], ["Add to lists"])))), onPress: onPressAddRemoveLists, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Add to lists" }) }), _jsx(Menu.ItemIcon, { icon: List })] }), isSelf && canGoLive && (_jsxs(Menu.Item, { testID: "profileHeaderDropdownListAddRemoveBtn", label: status.isDisabled
                                                    ? _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Go live (disabled)"], ["Go live (disabled)"]))))
                                                    : status.isActive
                                                        ? _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Edit live status"], ["Edit live status"]))))
                                                        : _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Go live"], ["Go live"])))), onPress: function () {
                                                    if (status.isDisabled) {
                                                        goLiveDisabledDialogControl.open();
                                                    }
                                                    else {
                                                        goLiveDialogControl.open();
                                                    }
                                                    saveNux({
                                                        id: Nux.LiveNowBetaNudge,
                                                        data: undefined,
                                                        completed: true,
                                                    });
                                                }, children: [statusNudgeActive && _jsx(Gradient, {}), _jsx(Menu.ItemText, { children: status.isDisabled ? (_jsx(Trans, { children: "Go live (disabled)" })) : status.isActive ? (_jsx(Trans, { children: "Edit live status" })) : (_jsx(Trans, { children: "Go live" })) }), statusNudgeActive && (_jsx(Menu.ItemText, { style: [
                                                            a.flex_0,
                                                            {
                                                                color: t.palette.primary_500,
                                                                right: IS_WEB ? -8 : -4,
                                                            },
                                                        ], children: _jsx(Trans, { children: "New" }) })), _jsx(Menu.ItemIcon, { icon: LiveIcon, fill: statusNudgeActive
                                                            ? function () { return t.palette.primary_500; }
                                                            : undefined })] })), verification.viewer.role === 'verifier' &&
                                                !verification.profile.isViewer &&
                                                (verification.viewer.hasIssuedVerification ? (_jsxs(Menu.Item, { testID: "profileHeaderDropdownVerificationRemoveButton", label: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Remove verification"], ["Remove verification"])))), onPress: function () { return verificationRemovePromptControl.open(); }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Remove verification" }) }), _jsx(Menu.ItemIcon, { icon: CircleXIcon })] })) : (_jsxs(Menu.Item, { testID: "profileHeaderDropdownVerificationCreateButton", label: _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Verify account"], ["Verify account"])))), onPress: function () { return verificationCreatePromptControl.open(); }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Verify account" }) }), _jsx(Menu.ItemIcon, { icon: CircleCheckIcon })] }))), !isSelf && (_jsxs(_Fragment, { children: [!((_m = profile.viewer) === null || _m === void 0 ? void 0 : _m.blocking) &&
                                                        !((_o = profile.viewer) === null || _o === void 0 ? void 0 : _o.mutedByList) && (_jsxs(Menu.Item, { testID: "profileHeaderDropdownMuteBtn", label: ((_p = profile.viewer) === null || _p === void 0 ? void 0 : _p.muted)
                                                            ? _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Unmute account"], ["Unmute account"]))))
                                                            : _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Mute account"], ["Mute account"])))), onPress: onPressMuteAccount, children: [_jsx(Menu.ItemText, { children: ((_q = profile.viewer) === null || _q === void 0 ? void 0 : _q.muted) ? (_jsx(Trans, { children: "Unmute account" })) : (_jsx(Trans, { children: "Mute account" })) }), _jsx(Menu.ItemIcon, { icon: ((_r = profile.viewer) === null || _r === void 0 ? void 0 : _r.muted) ? Unmute : Mute })] })), !((_s = profile.viewer) === null || _s === void 0 ? void 0 : _s.blockingByList) && (_jsxs(Menu.Item, { testID: "profileHeaderDropdownBlockBtn", label: profile.viewer
                                                            ? _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["Unblock account"], ["Unblock account"]))))
                                                            : _(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Block account"], ["Block account"])))), onPress: function () { return blockPromptControl.open(); }, children: [_jsx(Menu.ItemText, { children: ((_t = profile.viewer) === null || _t === void 0 ? void 0 : _t.blocking) ? (_jsx(Trans, { children: "Unblock account" })) : (_jsx(Trans, { children: "Block account" })) }), _jsx(Menu.ItemIcon, { icon: ((_u = profile.viewer) === null || _u === void 0 ? void 0 : _u.blocking) ? PersonCheck : PersonX })] })), _jsxs(Menu.Item, { testID: "profileHeaderDropdownReportBtn", label: _(msg(templateObject_25 || (templateObject_25 = __makeTemplateObject(["Report account"], ["Report account"])))), onPress: onPressReportAccount, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Report account" }) }), _jsx(Menu.ItemIcon, { icon: Flag })] })] }))] })] })), devModeEnabled ? (_jsxs(_Fragment, { children: [_jsx(Menu.Divider, {}), _jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { testID: "profileHeaderDropdownShareATURIBtn", label: _(msg(templateObject_26 || (templateObject_26 = __makeTemplateObject(["Copy at:// URI"], ["Copy at:// URI"])))), onPress: onPressShareATUri, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Copy at:// URI" }) }), _jsx(Menu.ItemIcon, { icon: ClipboardIcon })] }), _jsxs(Menu.Item, { testID: "profileHeaderDropdownShareDIDBtn", label: _(msg(templateObject_27 || (templateObject_27 = __makeTemplateObject(["Copy DID"], ["Copy DID"])))), onPress: onPressShareDID, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Copy DID" }) }), _jsx(Menu.ItemIcon, { icon: ClipboardIcon })] })] })] })) : null] })] }), _jsx(StarterPackDialog, { control: addToStarterPacksDialogControl, targetDid: profile.did }), _jsx(ReportDialog, { control: reportDialogControl, subject: __assign(__assign({}, profile), { $type: 'app.bsky.actor.defs#profileViewDetailed' }) }), _jsx(Prompt.Basic, { control: blockPromptControl, title: ((_v = profile.viewer) === null || _v === void 0 ? void 0 : _v.blocking)
                    ? _(msg(templateObject_28 || (templateObject_28 = __makeTemplateObject(["Unblock Account?"], ["Unblock Account?"]))))
                    : _(msg(templateObject_29 || (templateObject_29 = __makeTemplateObject(["Block Account?"], ["Block Account?"])))), description: ((_w = profile.viewer) === null || _w === void 0 ? void 0 : _w.blocking)
                    ? _(msg(templateObject_30 || (templateObject_30 = __makeTemplateObject(["The account will be able to interact with you after unblocking."], ["The account will be able to interact with you after unblocking."]))))
                    : ((_x = profile.associated) === null || _x === void 0 ? void 0 : _x.labeler)
                        ? _(msg(templateObject_31 || (templateObject_31 = __makeTemplateObject(["Blocking will not prevent labels from being applied on your account, but it will stop this account from replying in your threads or interacting with you."], ["Blocking will not prevent labels from being applied on your account, but it will stop this account from replying in your threads or interacting with you."]))))
                        : _(msg(templateObject_32 || (templateObject_32 = __makeTemplateObject(["Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you."], ["Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you."])))), onConfirm: blockAccount, confirmButtonCta: ((_y = profile.viewer) === null || _y === void 0 ? void 0 : _y.blocking) ? _(msg(templateObject_33 || (templateObject_33 = __makeTemplateObject(["Unblock"], ["Unblock"])))) : _(msg(templateObject_34 || (templateObject_34 = __makeTemplateObject(["Block"], ["Block"])))), confirmButtonColor: ((_z = profile.viewer) === null || _z === void 0 ? void 0 : _z.blocking) ? undefined : 'negative' }), _jsx(Prompt.Basic, { control: loggedOutWarningPromptControl, title: _(msg(templateObject_35 || (templateObject_35 = __makeTemplateObject(["Note about sharing"], ["Note about sharing"])))), description: _(msg(templateObject_36 || (templateObject_36 = __makeTemplateObject(["This profile is only visible to logged-in users. It won't be visible to people who aren't signed in."], ["This profile is only visible to logged-in users. It won't be visible to people who aren't signed in."])))), onConfirm: onPressShare, confirmButtonCta: _(msg(templateObject_37 || (templateObject_37 = __makeTemplateObject(["Share anyway"], ["Share anyway"])))) }), _jsx(VerificationCreatePrompt, { control: verificationCreatePromptControl, profile: profile }), _jsx(VerificationRemovePrompt, { control: verificationRemovePromptControl, profile: profile, verifications: currentAccountVerifications }), status.isDisabled ? (_jsx(GoLiveDisabledDialog, { control: goLiveDisabledDialogControl, status: status })) : status.isActive ? (_jsx(EditLiveDialog, { control: goLiveDialogControl, status: status, embed: status.embed })) : (_jsx(GoLiveDialog, { control: goLiveDialogControl, profile: profile }))] }));
};
ProfileMenu = memo(ProfileMenu);
export { ProfileMenu };
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33, templateObject_34, templateObject_35, templateObject_36, templateObject_37;
