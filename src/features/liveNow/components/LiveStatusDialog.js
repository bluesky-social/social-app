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
import { useCallback } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useOpenLink } from '#/lib/hooks/useOpenLink';
import { sanitizeHandle } from '#/lib/strings/handles';
import { toNiceDomain } from '#/lib/strings/url-helpers';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { unstableCacheProfileView } from '#/state/queries/profile';
import { android, atoms as a, platform, tokens, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Globe_Stroke2_Corner0_Rounded } from '#/components/icons/Globe';
import { SquareArrowTopRight_Stroke2_Corner0_Rounded as SquareArrowTopRightIcon } from '#/components/icons/SquareArrowTopRight';
import { createStaticClick, SimpleInlineLinkText } from '#/components/Link';
import { useGlobalReportDialogControl } from '#/components/moderation/ReportDialog';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { LiveIndicator } from '#/features/liveNow/components/LiveIndicator';
export function LiveStatusDialog(_a) {
    var control = _a.control, profile = _a.profile, embed = _a.embed, status = _a.status;
    var navigation = useNavigation();
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, { difference: !!embed.external.thumb }), _jsx(DialogInner, { status: status, profile: profile, embed: embed, navigation: navigation })] }));
}
function DialogInner(_a) {
    var profile = _a.profile, embed = _a.embed, navigation = _a.navigation, status = _a.status;
    var _ = useLingui()._;
    var control = Dialog.useDialogContext();
    var onPressOpenProfile = useCallback(function () {
        control.close(function () {
            navigation.push('Profile', {
                name: profile.handle,
            });
        });
    }, [navigation, profile.handle, control]);
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " is live"], ["", " is live"])), sanitizeHandle(profile.handle))), contentContainerStyle: [a.pt_0, a.px_0], style: [web({ maxWidth: 420 }), a.overflow_hidden], children: [_jsx(LiveStatus, { status: status, profile: profile, embed: embed, onPressOpenProfile: onPressOpenProfile }), _jsx(Dialog.Close, {})] }));
}
export function LiveStatus(_a) {
    var status = _a.status, profile = _a.profile, embed = _a.embed, _b = _a.padding, padding = _b === void 0 ? 'xl' : _b, onPressOpenProfile = _a.onPressOpenProfile;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var t = useTheme();
    var queryClient = useQueryClient();
    var openLink = useOpenLink();
    var moderationOpts = useModerationOpts();
    var reportDialogControl = useGlobalReportDialogControl();
    var dialogContext = Dialog.useDialogContext();
    return (_jsxs(_Fragment, { children: [embed.external.thumb && (_jsxs(View, { style: [
                    t.atoms.bg_contrast_25,
                    a.w_full,
                    a.aspect_card,
                    android([
                        a.overflow_hidden,
                        {
                            borderTopLeftRadius: a.rounded_md.borderRadius,
                            borderTopRightRadius: a.rounded_md.borderRadius,
                        },
                    ]),
                ], children: [_jsx(Image, { source: embed.external.thumb, contentFit: "cover", style: [a.absolute, a.inset_0], accessibilityIgnoresInvertColors: true }), _jsx(LiveIndicator, { size: "large", style: [
                            a.absolute,
                            { top: tokens.space.lg, left: tokens.space.lg },
                            a.align_start,
                        ] })] })), _jsxs(View, { style: [
                    a.gap_lg,
                    padding === 'xl'
                        ? [a.px_xl, !embed.external.thumb ? a.pt_2xl : a.pt_lg]
                        : a.p_lg,
                ], children: [_jsxs(View, { style: [a.w_full, a.justify_center, a.gap_2xs], children: [_jsx(Text, { numberOfLines: 3, style: [a.leading_snug, a.font_semi_bold, a.text_xl], children: embed.external.title || embed.external.uri }), _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_2xs], children: [_jsx(Globe_Stroke2_Corner0_Rounded, { size: "xs", style: [t.atoms.text_contrast_medium] }), _jsx(Text, { numberOfLines: 1, style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: toNiceDomain(embed.external.uri) })] })] }), _jsxs(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Watch now"], ["Watch now"])))), size: platform({ native: 'large', web: 'small' }), color: "primary", variant: "solid", onPress: function () {
                            ax.metric('live:card:watch', { subject: profile.did });
                            openLink(embed.external.uri, false);
                        }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Watch now" }) }), _jsx(ButtonIcon, { icon: SquareArrowTopRightIcon })] }), _jsx(View, { style: [t.atoms.border_contrast_low, a.border_t, a.w_full] }), moderationOpts && (_jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts, disabledPreview: true }), _jsx(View, { style: [a.flex_1, web({ minWidth: 100 })], children: _jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts }) }), _jsx(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Open profile"], ["Open profile"])))), size: "small", color: "secondary", variant: "solid", onPress: function () {
                                    ax.metric('live:card:openProfile', { subject: profile.did });
                                    unstableCacheProfileView(queryClient, profile);
                                    onPressOpenProfile();
                                }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Open profile" }) }) })] })), _jsxs(View, { style: [
                            a.flex_row,
                            a.align_center,
                            a.justify_between,
                            a.w_full,
                            a.pt_sm,
                        ], children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs, a.flex_1], children: [_jsx(CircleInfoIcon, { size: "sm", fill: t.atoms.text_contrast_low.color }), _jsx(Text, { style: [t.atoms.text_contrast_low, a.text_sm], children: _jsx(Trans, { children: "Live feature is in beta" }) })] }), status && (_jsx(SimpleInlineLinkText, __assign({ label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Report this livestream"], ["Report this livestream"])))) }, createStaticClick(function () {
                                function open() {
                                    reportDialogControl.open({
                                        subject: __assign(__assign({}, status), { $type: 'app.bsky.actor.defs#statusView' }),
                                    });
                                }
                                if (dialogContext.isWithinDialog) {
                                    dialogContext.close(open);
                                }
                                else {
                                    open();
                                }
                            }), { style: [a.text_sm, a.underline, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Report" }) })))] })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
