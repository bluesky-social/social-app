var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { urls } from '#/lib/constants';
import { getUserDisplayName } from '#/lib/getUserDisplayName';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useDialogControl } from '#/components/Dialog';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { Link } from '#/components/Link';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';
import { VerificationRemovePrompt } from '#/components/verification/VerificationRemovePrompt';
import { useAnalytics } from '#/analytics';
export { useDialogControl } from '#/components/Dialog';
export function VerificationsDialog(_a) {
    var control = _a.control, profile = _a.profile, verificationState = _a.verificationState;
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(Inner, { control: control, profile: profile, verificationState: verificationState })] }));
}
function Inner(_a) {
    var profile = _a.profile, control = _a.control, state = _a.verificationState;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var userName = getUserDisplayName(profile);
    var label = state.profile.isViewer
        ? state.profile.isVerified
            ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You are verified"], ["You are verified"]))))
            : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Your verifications"], ["Your verifications"]))))
        : state.profile.isVerified
            ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " is verified"], ["", " is verified"])), userName))
            : _(msg({
                message: "".concat(userName, "'s verifications"),
                comment: "Possessive, meaning \"the verifications of {userName}\"",
            }));
    return (_jsxs(Dialog.ScrollableInner, { label: label, style: [
            gtMobile ? { width: 'auto', maxWidth: 400, minWidth: 200 } : a.w_full,
        ], children: [_jsxs(View, { style: [a.gap_sm, a.pb_lg], children: [_jsx(Text, { style: [a.text_2xl, a.font_semi_bold, a.pr_4xl, a.leading_tight], children: label }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: state.profile.isVerified ? (_jsx(Trans, { children: "This account has a checkmark because it's been verified by trusted sources." })) : (_jsx(Trans, { children: "This account has one or more attempted verifications, but it is not currently verified." })) })] }), profile.verification ? (_jsxs(View, { style: [a.pb_xl, a.gap_md], children: [_jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Verified by:" }) }), _jsx(View, { style: [a.gap_lg], children: profile.verification.verifications.map(function (v) { return (_jsx(VerifierCard, { verification: v, subject: profile, outerDialogControl: control }, v.uri)); }) }), profile.verification.verifications.some(function (v) { return !v.isValid; }) &&
                        state.profile.isViewer && (_jsx(Admonition, { type: "warning", style: [a.mt_xs], children: _jsx(Trans, { children: "Some of your verifications are invalid." }) }))] })) : null, _jsxs(View, { style: [
                    a.w_full,
                    a.gap_sm,
                    a.justify_end,
                    gtMobile
                        ? [a.flex_row, a.flex_row_reverse, a.justify_start]
                        : [a.flex_col],
                ], children: [_jsx(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Close dialog"], ["Close dialog"])))), size: "small", variant: "solid", color: "primary", onPress: function () {
                            control.close();
                        }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) }), _jsx(Link, { overridePresentation: true, to: urls.website.blog.initialVerificationAnnouncement, label: _(msg({
                            message: "Learn more about verification on Bluesky",
                            context: "english-only-resource",
                        })), size: "small", variant: "solid", color: "secondary", style: [a.justify_center], onPress: function () {
                            ax.metric('verification:learn-more', {
                                location: 'verificationsDialog',
                            });
                        }, children: _jsx(ButtonText, { children: _jsx(Trans, { context: "english-only-resource", children: "Learn more" }) }) })] }), _jsx(Dialog.Close, {})] }));
}
function VerifierCard(_a) {
    var verification = _a.verification, subject = _a.subject, outerDialogControl = _a.outerDialogControl;
    var t = useTheme();
    var _b = useLingui(), _ = _b._, i18n = _b.i18n;
    var currentAccount = useSession().currentAccount;
    var moderationOpts = useModerationOpts();
    var _c = useProfileQuery({ did: verification.issuer }), profile = _c.data, error = _c.error;
    var verificationRemovePromptControl = useDialogControl();
    var canAdminister = verification.issuer === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    return (_jsxs(View, { style: {
            opacity: verification.isValid ? 1 : 0.5,
        }, children: [_jsx(ProfileCard.Outer, { children: _jsx(ProfileCard.Header, { children: error ? (_jsxs(_Fragment, { children: [_jsx(ProfileCard.AvatarPlaceholder, {}), _jsxs(View, { style: [a.flex_1], children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], numberOfLines: 1, children: _jsx(Trans, { children: "Unknown verifier" }) }), _jsx(Text, { emoji: true, style: [a.leading_snug, t.atoms.text_contrast_medium], numberOfLines: 1, children: verification.issuer })] })] })) : profile && moderationOpts ? (_jsxs(_Fragment, { children: [_jsxs(ProfileCard.Link, { profile: profile, style: [a.flex_row, a.align_center, a.gap_sm, a.flex_1], onPress: function () {
                                    outerDialogControl.close();
                                }, children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts, disabledPreview: true }), _jsxs(View, { style: [a.flex_1], children: [_jsx(ProfileCard.Name, { profile: profile, moderationOpts: moderationOpts }), _jsx(Text, { emoji: true, style: [a.leading_snug, t.atoms.text_contrast_medium], numberOfLines: 1, children: i18n.date(new Date(verification.createdAt), {
                                                    dateStyle: 'long',
                                                }) })] })] }), canAdminister && (_jsx(View, { children: _jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Remove verification"], ["Remove verification"])))), size: "small", variant: "outline", color: "negative", shape: "round", onPress: function () {
                                        verificationRemovePromptControl.open();
                                    }, children: _jsx(ButtonIcon, { icon: TrashIcon }) }) }))] })) : (_jsxs(_Fragment, { children: [_jsx(ProfileCard.AvatarPlaceholder, {}), _jsx(ProfileCard.NameAndHandlePlaceholder, {})] })) }) }), _jsx(VerificationRemovePrompt, { control: verificationRemovePromptControl, profile: subject, verifications: [verification], onConfirm: function () { return outerDialogControl.close(); } })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
