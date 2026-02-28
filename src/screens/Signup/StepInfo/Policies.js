var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { atoms as a, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
export var Policies = function (_a) {
    var _b, _c;
    var serviceDescription = _a.serviceDescription;
    var t = useTheme();
    var _ = useLingui()._;
    if (!serviceDescription) {
        return _jsx(View, {});
    }
    var tos = validWebLink((_b = serviceDescription.links) === null || _b === void 0 ? void 0 : _b.termsOfService);
    var pp = validWebLink((_c = serviceDescription.links) === null || _c === void 0 ? void 0 : _c.privacyPolicy);
    if (!tos && !pp) {
        return (_jsx(View, { style: [a.gap_sm], children: _jsx(Admonition, { type: "info", children: _jsx(Trans, { children: "This service has not provided terms of service or a privacy policy." }) }) }));
    }
    var els;
    if (tos && pp) {
        els = (_jsxs(Trans, { children: ["By creating an account you agree to the", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Read the Bluesky Terms of Service"], ["Read the Bluesky Terms of Service"])))), to: tos, children: "Terms of Service" }, "tos"), ' ', "and", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Read the Bluesky Privacy Policy"], ["Read the Bluesky Privacy Policy"])))), to: pp, children: "Privacy Policy" }, "pp"), "."] }));
    }
    else if (tos) {
        els = (_jsxs(Trans, { children: ["By creating an account you agree to the", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Read the Bluesky Terms of Service"], ["Read the Bluesky Terms of Service"])))), to: tos, children: "Terms of Service" }, "tos"), "."] }));
    }
    else if (pp) {
        els = (_jsxs(Trans, { children: ["By creating an account you agree to the", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Read the Bluesky Privacy Policy"], ["Read the Bluesky Privacy Policy"])))), to: pp, children: "Privacy Policy" }, "pp"), "."] }));
    }
    else {
        return null;
    }
    return els ? (_jsx(Text, { style: [a.leading_snug, t.atoms.text_contrast_medium], children: els })) : null;
};
function validWebLink(url) {
    return url && (url.startsWith('http://') || url.startsWith('https://'))
        ? url
        : undefined;
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
