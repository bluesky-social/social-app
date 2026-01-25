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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useA11y } from '#/state/a11y';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { InlineLinkText, Link } from '#/components/Link';
import { Badge } from '#/components/PolicyUpdateOverlay/Badge';
import { Overlay } from '#/components/PolicyUpdateOverlay/Overlay';
import { Text } from '#/components/Typography';
import { IS_ANDROID } from '#/env';
export function Content(_a) {
    var state = _a.state;
    var t = useTheme();
    var _ = useLingui()._;
    var screenReaderEnabled = useA11y().screenReaderEnabled;
    var handleClose = useCallback(function () {
        state.complete();
    }, [state]);
    var linkStyle = [a.text_md];
    var links = {
        terms: {
            overridePresentation: false,
            to: "https://bsky.social/about/support/tos",
            label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Terms of Service"], ["Terms of Service"])))),
        },
        privacy: {
            overridePresentation: false,
            to: "https://bsky.social/about/support/privacy-policy",
            label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Privacy Policy"], ["Privacy Policy"])))),
        },
        copyright: {
            overridePresentation: false,
            to: "https://bsky.social/about/support/copyright",
            label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Copyright Policy"], ["Copyright Policy"])))),
        },
        guidelines: {
            overridePresentation: false,
            to: "https://bsky.social/about/support/community-guidelines",
            label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Community Guidelines"], ["Community Guidelines"])))),
        },
        blog: {
            overridePresentation: false,
            to: "https://bsky.social/about/blog/08-14-2025-updated-terms-and-policies",
            label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Our blog post"], ["Our blog post"])))),
        },
    };
    var linkButtonStyles = {
        overridePresentation: false,
        color: 'secondary',
        size: 'small',
    };
    var label = IS_ANDROID
        ? _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["We\u2019re updating our Terms of Service, Privacy Policy, and Copyright Policy, effective September 15th, 2025. We're also updating our Community Guidelines, and we want your input! These new guidelines will take effect on October 15th, 2025. Learn more about these changes and how to share your thoughts with us by reading our blog post."], ["We\u2019re updating our Terms of Service, Privacy Policy, and Copyright Policy, effective September 15th, 2025. We're also updating our Community Guidelines, and we want your input! These new guidelines will take effect on October 15th, 2025. Learn more about these changes and how to share your thoughts with us by reading our blog post."]))))
        : _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["We're updating our policies"], ["We're updating our policies"]))));
    return (_jsx(Overlay, { label: label, children: _jsxs(View, { style: [a.align_start, a.gap_xl], children: [_jsx(Badge, {}), screenReaderEnabled ? (_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { emoji: true, style: [a.text_2xl, a.font_semi_bold, a.leading_snug], children: _jsx(Trans, { children: "Hey there \uD83D\uDC4B" }) }), _jsx(Text, { style: [a.leading_snug, a.text_md], children: _jsx(Trans, { children: "We\u2019re updating our Terms of Service, Privacy Policy, and Copyright Policy, effective September 15th, 2025." }) }), _jsx(Text, { style: [a.leading_snug, a.text_md], children: _jsx(Trans, { children: "We're also updating our Community Guidelines, and we want your input! These new guidelines will take effect on October 15th, 2025." }) }), _jsx(Text, { style: [a.leading_snug, a.text_md], children: _jsx(Trans, { children: "Learn more about these changes and how to share your thoughts with us by reading our blog post." }) }), _jsx(Link, __assign({}, links.terms, linkButtonStyles, { children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Terms of Service" }) }) })), _jsx(Link, __assign({}, links.privacy, linkButtonStyles, { children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Privacy Policy" }) }) })), _jsx(Link, __assign({}, links.copyright, linkButtonStyles, { children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Copyright Policy" }) }) })), _jsx(Link, __assign({}, links.blog, linkButtonStyles, { children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Read our blog post" }) }) }))] })) : (_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { emoji: true, style: [a.text_2xl, a.font_semi_bold, a.leading_snug], children: _jsx(Trans, { children: "Hey there \uD83D\uDC4B" }) }), _jsx(Text, { style: [a.leading_snug, a.text_md], children: _jsxs(Trans, { children: ["We\u2019re updating our", ' ', _jsx(InlineLinkText, __assign({}, links.terms, { style: linkStyle, children: "Terms of Service" })), ",", ' ', _jsx(InlineLinkText, __assign({}, links.privacy, { style: linkStyle, children: "Privacy Policy" })), ", and", ' ', _jsx(InlineLinkText, __assign({}, links.copyright, { style: linkStyle, children: "Copyright Policy" })), ", effective September 15th, 2025."] }) }), _jsx(Text, { style: [a.leading_snug, a.text_md], children: _jsxs(Trans, { children: ["We're also updating our", ' ', _jsx(InlineLinkText, __assign({}, links.guidelines, { style: linkStyle, children: "Community Guidelines" })), ", and we want your input! These new guidelines will take effect on October 15th, 2025."] }) }), _jsx(Text, { style: [a.leading_snug, a.text_md], children: _jsxs(Trans, { children: ["Learn more about these changes and how to share your thoughts with us by", ' ', _jsx(InlineLinkText, __assign({}, links.blog, { style: linkStyle, children: "reading our blog post." }))] }) })] })), _jsxs(View, { style: [a.w_full, a.gap_md], children: [_jsx(Button, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Continue"], ["Continue"])))), accessibilityHint: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Tap to acknowledge that you understand and agree to these updates and continue using Bluesky"], ["Tap to acknowledge that you understand and agree to these updates and continue using Bluesky"])))), color: "primary", size: "large", onPress: handleClose, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Continue" }) }) }), _jsx(Text, { style: [
                                a.leading_snug,
                                a.text_sm,
                                a.italic,
                                t.atoms.text_contrast_medium,
                            ], children: _jsx(Trans, { children: "By clicking \"Continue\" you acknowledge that you understand and agree to these updates." }) })] })] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
