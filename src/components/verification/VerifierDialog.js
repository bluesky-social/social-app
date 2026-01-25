var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text as RNText, View } from 'react-native';
import { Image } from 'expo-image';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { urls } from '#/lib/constants';
import { getUserDisplayName } from '#/lib/getUserDisplayName';
import { useSession } from '#/state/session';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { VerifierCheck } from '#/components/icons/VerifierCheck';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
export { useDialogControl } from '#/components/Dialog';
export function VerifierDialog(_a) {
    var control = _a.control, profile = _a.profile, verificationState = _a.verificationState;
    return (_jsxs(Dialog.Outer, { control: control, children: [_jsx(Dialog.Handle, {}), _jsx(Inner, { control: control, profile: profile, verificationState: verificationState }), _jsx(Dialog.Close, {})] }));
}
function Inner(_a) {
    var profile = _a.profile, control = _a.control;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var currentAccount = useSession().currentAccount;
    var isSelf = profile.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var userName = getUserDisplayName(profile);
    var label = isSelf
        ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You are a trusted verifier"], ["You are a trusted verifier"]))))
        : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " is a trusted verifier"], ["", " is a trusted verifier"])), userName));
    return (_jsx(Dialog.ScrollableInner, { label: label, style: [
            gtMobile ? { width: 'auto', maxWidth: 400, minWidth: 200 } : a.w_full,
        ], children: _jsxs(View, { style: [a.gap_lg], children: [_jsx(View, { style: [
                        a.w_full,
                        a.rounded_md,
                        a.overflow_hidden,
                        t.atoms.bg_contrast_25,
                        { minHeight: 100 },
                    ], children: _jsx(Image, { accessibilityIgnoresInvertColors: true, source: require('../../../assets/images/initial_verification_announcement_1.png'), style: [
                            {
                                aspectRatio: 353 / 160,
                            },
                        ], alt: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["An illustration showing that Bluesky selects trusted verifiers, and trusted verifiers in turn verify individual user accounts."], ["An illustration showing that Bluesky selects trusted verifiers, and trusted verifiers in turn verify individual user accounts."])))) }) }), _jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.text_2xl, a.font_semi_bold, a.pr_4xl, a.leading_tight], children: label }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsxs(Trans, { children: ["Accounts with a scalloped blue check mark", ' ', _jsx(RNText, { children: _jsx(VerifierCheck, { width: 14 }) }), ' ', "can verify others. These trusted verifiers are selected by Bluesky."] }) })] }), _jsxs(View, { style: [
                        a.w_full,
                        a.gap_sm,
                        a.justify_end,
                        gtMobile ? [a.flex_row, a.justify_end] : [a.flex_col],
                    ], children: [_jsx(Link, { overridePresentation: true, to: urls.website.blog.initialVerificationAnnouncement, label: _(msg({
                                message: "Learn more about verification on Bluesky",
                                context: "english-only-resource",
                            })), size: "small", variant: "solid", color: "primary", style: [a.justify_center], onPress: function () {
                                ax.metric('verification:learn-more', {
                                    location: 'verifierDialog',
                                });
                            }, children: _jsx(ButtonText, { children: _jsx(Trans, { context: "english-only-resource", children: "Learn more" }) }) }), _jsx(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Close dialog"], ["Close dialog"])))), size: "small", variant: "solid", color: "secondary", onPress: function () {
                                control.close();
                            }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) })] })] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
