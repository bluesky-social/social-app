var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { HITSLOP_20 } from '#/lib/constants';
import { android, atoms as a } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { CircleInfo_Stroke2_Corner0_Rounded as InfoIcon } from '#/components/icons/CircleInfo';
import { Text } from '#/components/Typography';
export function InviteInfo(_a) {
    var iconStyle = _a.iconStyle, _b = _a.iconOffset, iconOffset = _b === void 0 ? 0 : _b;
    var _ = useLingui()._;
    var control = Dialog.useDialogControl();
    var style = [a.text_md, a.leading_snug, a.mt_xs];
    return (_jsxs(_Fragment, { children: [_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Learn more about how inviting friends works"], ["Learn more about how inviting friends works"])))), onPress: control.open, hitSlop: HITSLOP_20, style: android({ transform: [{ translateY: iconOffset }] }), children: _jsx(InfoIcon, { style: iconStyle, size: "sm" }) }), _jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Invite Friends"], ["Invite Friends"])))), children: [_jsx(Text, { style: [a.text_2xl, a.font_bold], children: _jsx(Trans, { children: "Invite Friends" }) }), _jsx(Text, { style: style, children: _jsx(Trans, { children: "It looks like some of your contacts have not tried to find you here yet. You can personally invite them by customizing a draft message we will provide." }) }), _jsx(Text, { style: [style, a.font_medium, a.mt_lg], children: _jsx(Trans, { children: "How it works:" }) }), _jsxs(Text, { style: style, children: ["\u2022 ", _jsx(Trans, { children: "Choose who to invite" })] }), _jsxs(Text, { style: style, children: ["\u2022 ", _jsx(Trans, { children: "Personalize the message" })] }), _jsxs(Text, { style: style, children: ["\u2022 ", _jsx(Trans, { children: "Send the message from your phone" })] }), _jsxs(Text, { style: style, children: ["\u2022", ' ', _jsx(Trans, { children: "We don't store your friends' phone numbers or send any messages" })] }), _jsx(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Done"], ["Done"])))), onPress: function () { return control.close(); }, size: "large", color: "primary", style: [a.mt_2xl], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Done" }) }) })] })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
