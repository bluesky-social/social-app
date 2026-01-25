var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useOpenLink } from '#/lib/hooks/useOpenLink';
import { shareUrl } from '#/lib/sharing';
import { isPossiblyAUrl, splitApexDomain } from '#/lib/strings/url-helpers';
import { atoms as a, useBreakpoints, useTheme, web } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Text } from '#/components/Typography';
import { useGlobalDialogsControlContext } from './Context';
export function LinkWarningDialog() {
    var linkWarningDialogControl = useGlobalDialogsControlContext().linkWarningDialogControl;
    return (_jsxs(Dialog.Outer, { control: linkWarningDialogControl.control, nativeOptions: { preventExpansion: true }, webOptions: { alignCenter: true }, onClose: linkWarningDialogControl.clear, children: [_jsx(Dialog.Handle, {}), _jsx(InAppBrowserConsentInner, { link: linkWarningDialogControl.value })] }));
}
function InAppBrowserConsentInner(_a) {
    var _b;
    var link = _a.link;
    var control = Dialog.useDialogContext();
    var _ = useLingui()._;
    var t = useTheme();
    var openLink = useOpenLink();
    var gtMobile = useBreakpoints().gtMobile;
    var potentiallyMisleading = useMemo(function () { return link && isPossiblyAUrl(link.displayText); }, [link]);
    var onPressVisit = useCallback(function () {
        control.close(function () {
            if (!link)
                return;
            if (link.share) {
                shareUrl(link.href);
            }
            else {
                openLink(link.href, undefined, true);
            }
        });
    }, [control, link, openLink]);
    var onCancel = useCallback(function () {
        control.close();
    }, [control]);
    return (_jsxs(Dialog.ScrollableInner, { style: web({ maxWidth: 450 }), label: potentiallyMisleading
            ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Potentially misleading link warning"], ["Potentially misleading link warning"]))))
            : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Leaving Bluesky"], ["Leaving Bluesky"])))), children: [_jsxs(View, { style: [a.gap_2xl], children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.font_bold, a.text_2xl], children: potentiallyMisleading ? (_jsx(Trans, { children: "Potentially misleading link" })) : (_jsx(Trans, { children: "Leaving Bluesky" })) }), _jsx(Text, { style: [t.atoms.text_contrast_high, a.text_md, a.leading_snug], children: _jsx(Trans, { children: "This link is taking you to the following website:" }) }), link && _jsx(LinkBox, { href: link.href }), potentiallyMisleading && (_jsx(Text, { style: [t.atoms.text_contrast_high, a.text_md, a.leading_snug], children: _jsx(Trans, { children: "Make sure this is where you intend to go!" }) }))] }), _jsxs(View, { style: [
                            a.flex_1,
                            a.gap_sm,
                            gtMobile && [a.flex_row_reverse, a.justify_start],
                        ], children: [_jsx(Button, { label: (link === null || link === void 0 ? void 0 : link.share) ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Share link"], ["Share link"])))) : _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Visit site"], ["Visit site"])))), accessibilityHint: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Opens link ", ""], ["Opens link ", ""])), (_b = link === null || link === void 0 ? void 0 : link.href) !== null && _b !== void 0 ? _b : '')), onPress: onPressVisit, size: "large", variant: "solid", color: potentiallyMisleading ? 'secondary_inverted' : 'primary', children: _jsx(ButtonText, { children: (link === null || link === void 0 ? void 0 : link.share) ? (_jsx(Trans, { children: "Share link" })) : (_jsx(Trans, { children: "Visit site" })) }) }), _jsx(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Go back"], ["Go back"])))), onPress: onCancel, size: "large", variant: "ghost", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Go back" }) }) })] })] }), _jsx(Dialog.Close, {})] }));
}
function LinkBox(_a) {
    var href = _a.href;
    var t = useTheme();
    var _b = useMemo(function () {
        try {
            var urlp = new URL(href);
            var _a = splitApexDomain(urlp.hostname), subdomain = _a[0], apexdomain = _a[1];
            return [
                urlp.protocol + '//' + subdomain,
                apexdomain,
                urlp.pathname.replace(/\/$/, '') + urlp.search + urlp.hash,
            ];
        }
        catch (_b) {
            return ['', href, ''];
        }
    }, [href]), scheme = _b[0], hostname = _b[1], rest = _b[2];
    return (_jsx(View, { style: [
            t.atoms.bg,
            t.atoms.border_contrast_medium,
            a.px_md,
            { paddingVertical: 10 },
            a.rounded_sm,
            a.border,
        ], children: _jsxs(Text, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_medium], children: [scheme, _jsx(Text, { style: [a.text_md, a.leading_snug, t.atoms.text, a.font_semi_bold], children: hostname }), rest] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
