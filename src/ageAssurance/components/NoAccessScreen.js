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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { SupportCode, useCreateSupportLink, } from '#/lib/hooks/useCreateSupportLink';
import { dateDiff, useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { useIsBirthdateUpdateAllowed } from '#/state/birthdate';
import { useSessionApi } from '#/state/session';
import { atoms as a, useBreakpoints, useTheme, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { AgeAssuranceAppealDialog } from '#/components/ageAssurance/AgeAssuranceAppealDialog';
import { AgeAssuranceBadge } from '#/components/ageAssurance/AgeAssuranceBadge';
import { AgeAssuranceInitDialog } from '#/components/ageAssurance/AgeAssuranceInitDialog';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import * as Dialog from '#/components/Dialog';
import { BirthDateSettingsDialog } from '#/components/dialogs/BirthDateSettings';
import { DeviceLocationRequestDialog } from '#/components/dialogs/DeviceLocationRequestDialog';
import { Full as Logo } from '#/components/icons/Logo';
import { ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon } from '#/components/icons/Shield';
import { createStaticClick, SimpleInlineLinkText } from '#/components/Link';
import { Outlet as PortalOutlet } from '#/components/Portal';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { BottomSheetOutlet } from '#/../modules/bottom-sheet';
import { useAgeAssurance } from '#/ageAssurance';
import { useAgeAssuranceDataContext } from '#/ageAssurance/data';
import { useComputeAgeAssuranceRegionAccess } from '#/ageAssurance/useComputeAgeAssuranceRegionAccess';
import { isLegacyBirthdateBug, useAgeAssuranceRegionConfig, } from '#/ageAssurance/util';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE, IS_WEB } from '#/env';
import { useDeviceGeolocationApi } from '#/geolocation';
var textStyles = [a.text_md, a.leading_snug];
export function NoAccessScreen() {
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var gtPhone = useBreakpoints().gtPhone;
    var insets = useSafeAreaInsets();
    var birthdateControl = useDialogControl();
    var data = useAgeAssuranceDataContext().data;
    var region = useAgeAssuranceRegionConfig();
    var isBirthdateUpdateAllowed = useIsBirthdateUpdateAllowed();
    var logoutCurrentAccount = useSessionApi().logoutCurrentAccount;
    var createSupportLink = useCreateSupportLink();
    var aa = useAgeAssurance();
    var isBlocked = aa.state.status === aa.Status.Blocked;
    var isAARegion = !!region;
    var hasDeclaredAge = (data === null || data === void 0 ? void 0 : data.declaredAge) !== undefined;
    var canUpdateBirthday = isBirthdateUpdateAllowed || isLegacyBirthdateBug((data === null || data === void 0 ? void 0 : data.birthdate) || '');
    useEffect(function () {
        // just counting overall hits here
        ax.metric("blockedGeoOverlay:shown", {});
        ax.metric("ageAssurance:noAccessScreen:shown", {
            accountCreatedAt: (data === null || data === void 0 ? void 0 : data.accountCreatedAt) || 'unknown',
            isAARegion: isAARegion,
            hasDeclaredAge: hasDeclaredAge,
            canUpdateBirthday: canUpdateBirthday,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    var onPressLogout = useCallback(function () {
        if (IS_WEB) {
            // We're switching accounts, which remounts the entire app.
            // On mobile, this gets us Home, but on the web we also need reset the URL.
            // We can't change the URL via a navigate() call because the navigator
            // itself is about to unmount, and it calls pushState() too late.
            // So we change the URL ourselves. The navigator will pick it up on remount.
            history.pushState(null, '', '/');
        }
        logoutCurrentAccount('AgeAssuranceNoAccessScreen');
    }, [logoutCurrentAccount]);
    var orgAdmonition = (_jsx(Admonition, { type: "tip", children: _jsx(Trans, { children: "For organizational accounts, use the birthdate of the person who is responsible for the account." }) }));
    var birthdateUpdateText = canUpdateBirthday ? (_jsxs(_Fragment, { children: [_jsx(Text, { style: [textStyles], children: _jsxs(Trans, { children: ["If you believe your birthdate is incorrect, you can update it by", ' ', _jsx(SimpleInlineLinkText, __assign({ label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Click here to update your birthdate"], ["Click here to update your birthdate"])))), style: [textStyles] }, createStaticClick(function () {
                            ax.metric('ageAssurance:noAccessScreen:openBirthdateDialog', {});
                            birthdateControl.open();
                        }), { children: "clicking here" })), "."] }) }), orgAdmonition] })) : (_jsx(Text, { style: [textStyles], children: _jsxs(Trans, { children: ["If you believe your birthdate is incorrect, please", ' ', _jsx(SimpleInlineLinkText, { to: createSupportLink({ code: SupportCode.AA_BIRTHDATE }), label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Click here to contact our support team"], ["Click here to contact our support team"])))), style: [textStyles], children: "contact our support team" }), "."] }) }));
    return (_jsxs(_Fragment, { children: [_jsx(View, { style: [a.util_screen_outer, a.flex_1], children: _jsx(ScrollView, { contentContainerStyle: [
                        a.px_2xl,
                        {
                            paddingTop: IS_WEB
                                ? a.p_5xl.padding
                                : insets.top + a.p_2xl.padding,
                            paddingBottom: 100,
                        },
                    ], children: _jsxs(View, { style: [
                            a.mx_auto,
                            a.w_full,
                            web({
                                maxWidth: 380,
                                paddingTop: gtPhone ? '8vh' : undefined,
                            }),
                            {
                                gap: 32,
                            },
                        ], children: [_jsx(View, { style: [a.align_start], children: _jsx(AgeAssuranceBadge, {}) }), hasDeclaredAge ? (_jsx(_Fragment, { children: isAARegion ? (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.gap_lg], children: [_jsx(Text, { style: [textStyles], children: _jsx(Trans, { children: "Hey there!" }) }), _jsx(Text, { style: [textStyles], children: _jsx(Trans, { children: "You are accessing Bluesky from a region that legally requires us to verify your age before allowing you to access the app." }) }), !aa.flags.isOverRegionMinAccessAge && (_jsx(Text, { style: [textStyles], children: _jsx(Trans, { children: "Unfortunately, your declared age indicates that you are not old enough to access Bluesky in your region." }) })), !isBlocked && birthdateUpdateText] }), aa.flags.isOverRegionMinAccessAge && _jsx(AccessSection, {})] })) : (_jsxs(View, { style: [a.gap_lg], children: [_jsx(Text, { style: [textStyles], children: _jsx(Trans, { children: "Unfortunately, the birthdate you have saved to your profile makes you too young to access Bluesky." }) }), birthdateUpdateText] })) })) : (_jsxs(View, { style: [a.gap_lg], children: [_jsx(Text, { style: [textStyles], children: _jsx(Trans, { children: "Hi there!" }) }), _jsx(Text, { style: [textStyles], children: _jsx(Trans, { children: "In order to provide an age-appropriate experience, we need to know your birthdate. This is a one-time thing, and your data will be kept private." }) }), _jsx(Text, { style: [textStyles], children: _jsx(Trans, { children: "Set your birthdate below and we'll get you back to posting and exploring in no time!" }) }), _jsx(Button, { color: "primary", size: "large", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Click here to update your birthdate"], ["Click here to update your birthdate"])))), onPress: function () { return birthdateControl.open(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Add your birthdate" }) }) }), orgAdmonition] })), _jsxs(View, { style: [a.pt_lg, a.gap_xl], children: [_jsx(Logo, { width: 120, textFill: t.atoms.text.color }), _jsx(Text, { style: [a.text_sm, a.italic, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["To log out,", ' ', _jsx(SimpleInlineLinkText, __assign({ label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Click here to log out"], ["Click here to log out"])))) }, createStaticClick(function () {
                                                    onPressLogout();
                                                }), { children: "click here" })), "."] }) })] })] }) }) }), _jsx(BirthDateSettingsDialog, { control: birthdateControl }), _jsx(BottomSheetOutlet, {}), _jsx(PortalOutlet, {})] }));
}
function AccessSection() {
    var t = useTheme();
    var _a = useLingui(), _ = _a._, i18n = _a.i18n;
    var ax = useAnalytics();
    var control = useDialogControl();
    var appealControl = Dialog.useDialogControl();
    var locationControl = Dialog.useDialogControl();
    var getTimeAgo = useGetTimeAgo();
    var setDeviceGeolocation = useDeviceGeolocationApi().setDeviceGeolocation;
    var computeAgeAssuranceRegionAccess = useComputeAgeAssuranceRegionAccess();
    var aa = useAgeAssurance();
    var _b = aa.state, status = _b.status, lastInitiatedAt = _b.lastInitiatedAt;
    var isBlocked = status === aa.Status.Blocked;
    var hasInitiated = !!lastInitiatedAt;
    var timeAgo = lastInitiatedAt
        ? getTimeAgo(lastInitiatedAt, new Date())
        : null;
    var diff = lastInitiatedAt
        ? dateDiff(lastInitiatedAt, new Date(), 'down')
        : null;
    return (_jsxs(_Fragment, { children: [_jsx(AgeAssuranceInitDialog, { control: control }), _jsx(AgeAssuranceAppealDialog, { control: appealControl }), _jsxs(View, { style: [a.gap_xl], children: [isBlocked ? (_jsx(Admonition, { type: "warning", children: _jsxs(Trans, { children: ["You are currently unable to access Bluesky's Age Assurance flow. Please", ' ', _jsx(SimpleInlineLinkText, __assign({ label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Contact our moderation team"], ["Contact our moderation team"])))) }, createStaticClick(function () {
                                    appealControl.open();
                                    ax.metric('ageAssurance:appealDialogOpen', {});
                                }), { children: "contact our moderation team" })), ' ', "if you believe this is an error."] }) })) : (_jsx(_Fragment, { children: _jsxs(View, { style: [a.gap_md], children: [_jsxs(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Verify now"], ["Verify now"])))), size: "large", color: hasInitiated ? 'secondary' : 'primary', onPress: function () {
                                        control.open();
                                        ax.metric('ageAssurance:initDialogOpen', {
                                            hasInitiatedPreviously: hasInitiated,
                                        });
                                    }, children: [_jsx(ButtonIcon, { icon: ShieldIcon }), _jsx(ButtonText, { children: hasInitiated ? (_jsx(Trans, { children: "Verify again" })) : (_jsx(Trans, { children: "Verify now" })) })] }), lastInitiatedAt && timeAgo && diff ? (_jsx(Text, { style: [a.text_sm, a.italic, t.atoms.text_contrast_medium], title: i18n.date(lastInitiatedAt, {
                                        dateStyle: 'medium',
                                        timeStyle: 'medium',
                                    }), children: diff.value === 0 ? (_jsx(Trans, { children: "Last initiated just now" })) : (_jsxs(Trans, { children: ["Last initiated ", timeAgo, " ago"] })) })) : (_jsx(Text, { style: [a.text_sm, a.italic, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Age assurance only takes a few minutes" }) }))] }) })), _jsx(View, { style: [a.gap_xs], children: IS_NATIVE && (_jsxs(_Fragment, { children: [_jsx(Admonition, { children: _jsxs(Trans, { children: ["Is your location not accurate?", ' ', _jsx(SimpleInlineLinkText, __assign({ label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Confirm your location"], ["Confirm your location"])))) }, createStaticClick(function () {
                                                locationControl.open();
                                            }), { children: "Tap here to confirm your location." })), ' '] }) }), _jsx(DeviceLocationRequestDialog, { control: locationControl, onLocationAcquired: function (props) {
                                        var access = computeAgeAssuranceRegionAccess(props.geolocation);
                                        if (access !== aa.Access.Full) {
                                            props.disableDialogAction();
                                            props.setDialogError(_(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["We're sorry, but based on your device's location, you are currently located in a region that requires age assurance."], ["We're sorry, but based on your device's location, you are currently located in a region that requires age assurance."])))));
                                        }
                                        else {
                                            props.closeDialog(function () {
                                                // set this after close!
                                                setDeviceGeolocation(props.geolocation);
                                                Toast.show(_(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Thanks! You're all set."], ["Thanks! You're all set."])))), {
                                                    type: 'success',
                                                });
                                            });
                                        }
                                    } })] })) })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
