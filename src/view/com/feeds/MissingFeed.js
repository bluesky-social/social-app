var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { View } from 'react-native';
import { AtUri } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { cleanError } from '#/lib/strings/errors';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { getFeedTypeFromUri } from '#/state/queries/feed';
import { useProfileQuery } from '#/state/queries/profile';
import { atoms as a, useTheme, web } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Divider } from '#/components/Divider';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';
import { IS_NATIVE, IS_WEB } from '#/env';
export function MissingFeed(_a) {
    var style = _a.style, hideTopBorder = _a.hideTopBorder, uri = _a.uri, error = _a.error;
    var t = useTheme();
    var _ = useLingui()._;
    var control = Dialog.useDialogControl();
    var type = getFeedTypeFromUri(uri);
    return (_jsxs(_Fragment, { children: [_jsx(Button, { label: type === 'feed'
                    ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Could not connect to custom feed"], ["Could not connect to custom feed"]))))
                    : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Deleted list"], ["Deleted list"])))), accessibilityHint: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Tap for more information"], ["Tap for more information"])))), onPress: control.open, style: [
                    a.flex_1,
                    a.p_lg,
                    a.gap_md,
                    !hideTopBorder && !a.border_t,
                    t.atoms.border_contrast_low,
                    a.justify_start,
                    style,
                ], children: _jsxs(View, { style: [a.flex_row, a.align_center], children: [_jsx(View, { style: [
                                { width: 36, height: 36 },
                                t.atoms.bg_contrast_25,
                                a.rounded_sm,
                                a.mr_md,
                                a.align_center,
                                a.justify_center,
                            ], children: _jsx(WarningIcon, { size: "lg" }) }), _jsxs(View, { style: [a.flex_1], children: [_jsx(Text, { emoji: true, style: [a.text_sm, a.font_semi_bold, a.leading_snug, a.italic], numberOfLines: 1, children: type === 'feed' ? (_jsx(Trans, { children: "Feed unavailable" })) : (_jsx(Trans, { children: "Deleted list" })) }), _jsx(Text, { style: [
                                        a.text_sm,
                                        t.atoms.text_contrast_medium,
                                        a.leading_snug,
                                        a.italic,
                                    ], numberOfLines: 1, children: IS_WEB ? (_jsx(Trans, { children: "Click for information" })) : (_jsx(Trans, { children: "Tap for information" })) })] })] }) }), _jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, { uri: uri, type: type, error: error })] })] }));
}
function DialogInner(_a) {
    var uri = _a.uri, type = _a.type, error = _a.error;
    var control = Dialog.useDialogContext();
    var t = useTheme();
    var _ = useLingui()._;
    var atUri = new AtUri(uri);
    var _b = useProfileQuery({
        did: atUri.host,
    }), profile = _b.data, isProfileError = _b.isError;
    var moderationOpts = useModerationOpts();
    return (_jsxs(Dialog.ScrollableInner, { label: type === 'feed'
            ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Unavailable feed information"], ["Unavailable feed information"]))))
            : _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Deleted list"], ["Deleted list"])))), style: web({ maxWidth: 500 }), children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.font_bold, a.text_2xl], children: type === 'feed' ? (_jsx(Trans, { children: "Could not connect to feed service" })) : (_jsx(Trans, { children: "Deleted list" })) }), _jsx(Text, { style: [t.atoms.text_contrast_high, a.leading_snug], children: type === 'feed' ? (_jsx(Trans, { children: "We could not connect to the service that provides this custom feed. It may be temporarily unavailable and experiencing issues, or permanently unavailable." })) : (_jsx(Trans, { children: "We could not find this list. It was probably deleted." })) }), _jsx(Divider, { style: [a.my_md] }), _jsx(Text, { style: [a.font_semi_bold, t.atoms.text_contrast_high], children: type === 'feed' ? (_jsx(Trans, { children: "Feed creator" })) : (_jsx(Trans, { children: "List creator" })) }), profile && moderationOpts && (_jsx(View, { style: [a.w_full, a.align_start], children: _jsx(ProfileCard.Link, { profile: profile, onPress: function () { return control.close(); }, children: _jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts, disabledPreview: true }), _jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts })] }) }) })), isProfileError && (_jsx(Text, { style: [
                            t.atoms.text_contrast_high,
                            a.italic,
                            a.text_center,
                            a.w_full,
                        ], children: _jsx(Trans, { children: "Could not find profile" }) })), type === 'feed' && (_jsxs(_Fragment, { children: [_jsx(Text, { style: [a.font_semi_bold, t.atoms.text_contrast_high, a.mt_md], children: _jsx(Trans, { children: "Feed identifier" }) }), _jsx(Text, { style: [a.text_md, t.atoms.text_contrast_high, a.italic], children: atUri.rkey })] })), error instanceof Error && (_jsxs(_Fragment, { children: [_jsx(Text, { style: [a.font_semi_bold, t.atoms.text_contrast_high, a.mt_md], children: _jsx(Trans, { children: "Error message" }) }), _jsx(Text, { style: [a.text_md, t.atoms.text_contrast_high, a.italic], children: cleanError(error.message) })] }))] }), IS_NATIVE && (_jsx(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Close"], ["Close"])))), onPress: function () { return control.close(); }, size: "small", variant: "solid", color: "secondary", style: [a.mt_5xl], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) })), _jsx(Dialog.Close, {})] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
