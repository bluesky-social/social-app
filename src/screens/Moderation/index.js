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
import { Fragment, useCallback } from 'react';
import { Linking, View } from 'react-native';
import { LABELS } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useFocusEffect } from '@react-navigation/native';
import { getLabelingServiceTitle, isAppLabeler } from '#/lib/moderation';
import { logger } from '#/logger';
import { useIsBirthdateUpdateAllowed } from '#/state/birthdate';
import { useRemoveLabelersMutation } from '#/state/queries/labeler';
import { useMyLabelersQuery, usePreferencesQuery, usePreferencesSetAdultContentMutation, } from '#/state/queries/preferences';
import { isNonConfigurableModerationAuthority } from '#/state/session/additional-moderation-authorities';
import { useSetMinimalShellMode } from '#/state/shell';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import * as Admonition from '#/components/Admonition';
import { AgeAssuranceAdmonition } from '#/components/ageAssurance/AgeAssuranceAdmonition';
import { useAgeAssuranceCopy } from '#/components/ageAssurance/useAgeAssuranceCopy';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { Divider } from '#/components/Divider';
import * as Toggle from '#/components/forms/Toggle';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRight } from '#/components/icons/Chevron';
import { CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign } from '#/components/icons/CircleBanSign';
import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheck } from '#/components/icons/CircleCheck';
import { EditBig_Stroke2_Corner0_Rounded as EditBig } from '#/components/icons/EditBig';
import { Filter_Stroke2_Corner0_Rounded as Filter } from '#/components/icons/Filter';
import { Group3_Stroke2_Corner0_Rounded as Group } from '#/components/icons/Group';
import { Person_Stroke2_Corner0_Rounded as Person } from '#/components/icons/Person';
import * as LabelingService from '#/components/LabelingServiceCard';
import * as Layout from '#/components/Layout';
import { InlineLinkText, Link } from '#/components/Link';
import { ListMaybePlaceholder } from '#/components/Lists';
import { Loader } from '#/components/Loader';
import { GlobalLabelPreference } from '#/components/moderation/LabelPreference';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useAgeAssurance } from '#/ageAssurance';
import { IS_IOS } from '#/env';
function ErrorState(_a) {
    var error = _a.error;
    var t = useTheme();
    return (_jsxs(View, { style: [a.p_xl], children: [_jsx(Text, { style: [
                    a.text_md,
                    a.leading_normal,
                    a.pb_md,
                    t.atoms.text_contrast_medium,
                ], children: _jsx(Trans, { children: "Hmmmm, it seems we're having trouble loading this data. See below for more details. If this issue persists, please contact us." }) }), _jsx(View, { style: [
                    a.relative,
                    a.py_md,
                    a.px_lg,
                    a.rounded_md,
                    a.mb_2xl,
                    t.atoms.bg_contrast_25,
                ], children: _jsx(Text, { style: [a.text_md, a.leading_normal], children: error }) })] }));
}
export function ModerationScreen(_props) {
    var _ = useLingui()._;
    var _a = usePreferencesQuery(), isPreferencesLoading = _a.isLoading, preferencesError = _a.error, preferences = _a.data;
    var isLoading = isPreferencesLoading;
    var error = preferencesError;
    return (_jsxs(Layout.Screen, { testID: "moderationScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Moderation" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: isLoading ? (_jsx(ListMaybePlaceholder, { isLoading: true, sideBorders: false })) : error || !preferences ? (_jsx(ErrorState, { error: (preferencesError === null || preferencesError === void 0 ? void 0 : preferencesError.toString()) ||
                        _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Something went wrong, please try again."], ["Something went wrong, please try again."])))) })) : (_jsx(ModerationScreenInner, { preferences: preferences })) })] }));
}
function SubItem(_a) {
    var title = _a.title, Icon = _a.icon, style = _a.style;
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.w_full,
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.p_lg,
            a.gap_sm,
            style,
        ], children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_md], children: [_jsx(Icon, { size: "md", style: [t.atoms.text_contrast_medium] }), _jsx(Text, { style: [a.text_sm, a.font_semi_bold], children: title })] }), _jsx(ChevronRight, { size: "sm", style: [t.atoms.text_contrast_low, a.self_end, { paddingBottom: 2 }] })] }));
}
export function ModerationScreenInner(_a) {
    var _this = this;
    var preferences = _a.preferences;
    var _ = useLingui()._;
    var t = useTheme();
    var setMinimalShellMode = useSetMinimalShellMode();
    var gtMobile = useBreakpoints().gtMobile;
    var mutedWordsDialogControl = useGlobalDialogsControlContext().mutedWordsDialogControl;
    var _b = useMyLabelersQuery(), isLabelersLoading = _b.isLoading, labelers = _b.data, labelersError = _b.error;
    var _c = useRemoveLabelersMutation(), removeLabelers = _c.mutateAsync, isRemovingLabelers = _c.isPending;
    var aa = useAgeAssurance();
    var isBirthdateUpdateAllowed = useIsBirthdateUpdateAllowed();
    var aaCopy = useAgeAssuranceCopy();
    var subscribedDids = preferences.moderationPrefs.labelers.map(function (l) { return l.did; });
    var returnedDids = new Set(labelers === null || labelers === void 0 ? void 0 : labelers.map(function (l) { return l.creator.did; }));
    var unavailableDids = subscribedDids.filter(function (did) {
        return !returnedDids.has(did) &&
            !isAppLabeler(did) &&
            !isNonConfigurableModerationAuthority(did);
    });
    var handleCleanup = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, removeLabelers({ dids: unavailableDids })];
                case 1:
                    _a.sent();
                    Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Removed unavailable services"], ["Removed unavailable services"])))), {
                        type: 'success',
                    });
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    logger.error('Failed to remove unavailable labelers', {
                        safeMessage: e_1.message,
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    useFocusEffect(useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    var _d = usePreferencesSetAdultContentMutation(), setAdultContentPref = _d.mutateAsync, optimisticAdultContent = _d.variables;
    var adultContentEnabled = !!((optimisticAdultContent && optimisticAdultContent.enabled) ||
        (!optimisticAdultContent && preferences.moderationPrefs.adultContentEnabled));
    var adultContentUIDisabledOnIOS = IS_IOS && !adultContentEnabled;
    var adultContentUIDisabled = adultContentUIDisabledOnIOS;
    if (aa.flags.adultContentDisabled) {
        adultContentEnabled = false;
        adultContentUIDisabled = true;
    }
    var onToggleAdultContentEnabled = useCallback(function (selected) { return __awaiter(_this, void 0, void 0, function () {
        var e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, setAdultContentPref({
                            enabled: selected,
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _a.sent();
                    logger.error("Failed to set adult content pref", {
                        message: e_2.message,
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, [setAdultContentPref]);
    return (_jsxs(View, { style: [a.pt_2xl, a.px_lg, gtMobile && a.px_2xl], children: [aa.flags.adultContentDisabled && isBirthdateUpdateAllowed && (_jsx(View, { style: [a.pb_2xl], children: _jsx(Admonition.Admonition, { type: "tip", style: [a.pb_md], children: _jsxs(Trans, { children: ["Your declared age is under 18. Some settings below may be disabled. If this was a mistake, you may edit your birthdate in your", ' ', _jsx(InlineLinkText, { to: "/settings/account", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Go to account settings"], ["Go to account settings"])))), children: "account settings" }), "."] }) }) })), _jsx(Text, { style: [
                    a.text_md,
                    a.font_semi_bold,
                    a.pb_md,
                    t.atoms.text_contrast_high,
                ], children: _jsx(Trans, { children: "Moderation tools" }) }), _jsxs(View, { style: [
                    a.w_full,
                    a.rounded_md,
                    a.overflow_hidden,
                    t.atoms.bg_contrast_25,
                ], children: [_jsx(Link, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["View your default post interaction settings"], ["View your default post interaction settings"])))), testID: "interactionSettingsBtn", to: "/moderation/interaction-settings", children: function (state) { return (_jsx(SubItem, { title: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Interaction settings"], ["Interaction settings"])))), icon: EditBig, style: [
                                (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
                            ] })); } }), _jsx(Divider, {}), _jsx(Button, { testID: "mutedWordsBtn", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Open muted words and tags settings"], ["Open muted words and tags settings"])))), onPress: function () { return mutedWordsDialogControl.open(); }, children: function (state) { return (_jsx(SubItem, { title: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Muted words & tags"], ["Muted words & tags"])))), icon: Filter, style: [
                                (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
                            ] })); } }), _jsx(Divider, {}), _jsx(Link, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["View your moderation lists"], ["View your moderation lists"])))), testID: "moderationlistsBtn", to: "/moderation/modlists", children: function (state) { return (_jsx(SubItem, { title: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Moderation lists"], ["Moderation lists"])))), icon: Group, style: [
                                (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
                            ] })); } }), _jsx(Divider, {}), _jsx(Link, { label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["View your muted accounts"], ["View your muted accounts"])))), testID: "mutedAccountsBtn", to: "/moderation/muted-accounts", children: function (state) { return (_jsx(SubItem, { title: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Muted accounts"], ["Muted accounts"])))), icon: Person, style: [
                                (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
                            ] })); } }), _jsx(Divider, {}), _jsx(Link, { label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["View your blocked accounts"], ["View your blocked accounts"])))), testID: "blockedAccountsBtn", to: "/moderation/blocked-accounts", children: function (state) { return (_jsx(SubItem, { title: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Blocked accounts"], ["Blocked accounts"])))), icon: CircleBanSign, style: [
                                (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
                            ] })); } }), _jsx(Divider, {}), _jsx(Link, { label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Manage verification settings"], ["Manage verification settings"])))), testID: "verificationSettingsBtn", to: "/moderation/verification-settings", children: function (state) { return (_jsx(SubItem, { title: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Verification settings"], ["Verification settings"])))), icon: CircleCheck, style: [
                                (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
                            ] })); } })] }), _jsx(Text, { style: [
                    a.pt_2xl,
                    a.pb_md,
                    a.text_md,
                    a.font_semi_bold,
                    t.atoms.text_contrast_high,
                ], children: _jsx(Trans, { children: "Content filters" }) }), _jsx(AgeAssuranceAdmonition, { style: [a.pb_md], children: aaCopy.notice }), _jsx(View, { style: [a.gap_md], children: _jsx(View, { style: [
                        a.w_full,
                        a.rounded_md,
                        a.overflow_hidden,
                        t.atoms.bg_contrast_25,
                    ], children: aa.state.access === aa.Access.Full && (_jsxs(_Fragment, { children: [_jsxs(View, { style: [
                                    a.py_lg,
                                    a.px_lg,
                                    a.flex_row,
                                    a.align_center,
                                    a.justify_between,
                                    adultContentUIDisabled && { opacity: 0.5 },
                                ], children: [_jsx(Text, { style: [a.font_semi_bold, t.atoms.text_contrast_high], children: _jsx(Trans, { children: "Enable adult content" }) }), _jsx(Toggle.Item, { label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Toggle to enable or disable adult content"], ["Toggle to enable or disable adult content"])))), disabled: adultContentUIDisabled, name: "adultContent", value: adultContentEnabled, onChange: onToggleAdultContentEnabled, children: _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_sm], children: [_jsx(Text, { style: [t.atoms.text_contrast_medium], children: adultContentEnabled ? (_jsx(Trans, { children: "Enabled" })) : (_jsx(Trans, { children: "Disabled" })) }), _jsx(Toggle.Switch, {})] }) })] }), adultContentUIDisabledOnIOS && (_jsx(View, { style: [a.pb_lg, a.px_lg], children: _jsx(Text, { children: _jsxs(Trans, { children: ["Adult content can only be enabled via the Web at", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["The Bluesky web application"], ["The Bluesky web application"])))), to: "", onPress: function (evt) {
                                                    evt.preventDefault();
                                                    Linking.openURL('https://bsky.app/');
                                                    return false;
                                                }, children: "bsky.app" }), "."] }) }) })), adultContentEnabled && (_jsxs(_Fragment, { children: [_jsx(Divider, {}), _jsx(GlobalLabelPreference, { labelDefinition: LABELS.porn }), _jsx(Divider, {}), _jsx(GlobalLabelPreference, { labelDefinition: LABELS.sexual }), _jsx(Divider, {}), _jsx(GlobalLabelPreference, { labelDefinition: LABELS['graphic-media'] }), _jsx(Divider, {}), _jsx(GlobalLabelPreference, { labelDefinition: LABELS.nudity })] }))] })) }) }), _jsx(Text, { style: [
                    a.text_md,
                    a.font_semi_bold,
                    a.pt_2xl,
                    a.pb_md,
                    t.atoms.text_contrast_high,
                ], children: _jsx(Trans, { children: "Advanced" }) }), unavailableDids.length > 0 && (_jsx(Admonition.Outer, { type: "tip", style: [a.mb_md], children: _jsxs(Admonition.Row, { children: [_jsx(Admonition.Icon, {}), _jsx(Admonition.Content, { children: _jsx(Admonition.Text, { children: _jsx(Trans, { children: "Some moderation services in your list are no longer available." }) }) }), _jsxs(Admonition.Button, { color: "primary_subtle", label: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Remove unavailable moderation services"], ["Remove unavailable moderation services"])))), onPress: handleCleanup, disabled: isRemovingLabelers, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Remove" }) }), isRemovingLabelers && _jsx(ButtonIcon, { icon: Loader })] })] }) })), isLabelersLoading ? (_jsx(View, { style: [a.w_full, a.align_center, a.p_lg], children: _jsx(Loader, { size: "xl" }) })) : labelersError || !labelers ? (_jsx(View, { style: [a.p_lg, a.rounded_sm, t.atoms.bg_contrast_25], children: _jsx(Text, { children: _jsx(Trans, { children: "We were unable to load your configured labelers at this time." }) }) })) : (_jsx(View, { style: [a.rounded_sm, t.atoms.bg_contrast_25], children: labelers.map(function (labeler, i) {
                    return (_jsxs(Fragment, { children: [i !== 0 && _jsx(Divider, {}), _jsx(LabelingService.Link, { labeler: labeler, children: function (state) { return (_jsxs(LabelingService.Outer, { style: [
                                        i === 0 && {
                                            borderTopLeftRadius: a.rounded_sm.borderRadius,
                                            borderTopRightRadius: a.rounded_sm.borderRadius,
                                        },
                                        i === labelers.length - 1 && {
                                            borderBottomLeftRadius: a.rounded_sm.borderRadius,
                                            borderBottomRightRadius: a.rounded_sm.borderRadius,
                                        },
                                        (state.hovered || state.pressed) && [
                                            t.atoms.bg_contrast_50,
                                        ],
                                    ], children: [_jsx(LabelingService.Avatar, { avatar: labeler.creator.avatar }), _jsxs(LabelingService.Content, { children: [_jsx(LabelingService.Title, { value: getLabelingServiceTitle({
                                                        displayName: labeler.creator.displayName,
                                                        handle: labeler.creator.handle,
                                                    }) }), _jsx(LabelingService.Description, { value: labeler.creator.description, handle: labeler.creator.handle }), isNonConfigurableModerationAuthority(labeler.creator.did) && _jsx(LabelingService.RegionalNotice, {})] })] })); } })] }, labeler.creator.did));
                }) })), _jsx(View, { style: { height: 150 } })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18;
