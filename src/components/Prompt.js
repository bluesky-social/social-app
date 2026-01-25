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
import React from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useBreakpoints, useTheme, web, } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Text } from '#/components/Typography';
export { useDialogControl as usePromptControl, } from '#/components/Dialog';
var Context = React.createContext({
    titleId: '',
    descriptionId: '',
});
Context.displayName = 'PromptContext';
export function Outer(_a) {
    var children = _a.children, control = _a.control, testID = _a.testID, nativeOptions = _a.nativeOptions;
    var titleId = React.useId();
    var descriptionId = React.useId();
    var context = React.useMemo(function () { return ({ titleId: titleId, descriptionId: descriptionId }); }, [titleId, descriptionId]);
    return (_jsxs(Dialog.Outer, { control: control, testID: testID, webOptions: { alignCenter: true }, nativeOptions: __assign({ preventExpansion: true }, nativeOptions), children: [_jsx(Dialog.Handle, {}), _jsx(Context.Provider, { value: context, children: _jsx(Dialog.ScrollableInner, { accessibilityLabelledBy: titleId, accessibilityDescribedBy: descriptionId, style: web({ maxWidth: 400 }), children: children }) })] }));
}
export function TitleText(_a) {
    var children = _a.children, style = _a.style;
    var titleId = React.useContext(Context).titleId;
    return (_jsx(Text, { nativeID: titleId, style: [
            a.flex_1,
            a.text_2xl,
            a.font_semi_bold,
            a.pb_sm,
            a.leading_snug,
            style,
        ], children: children }));
}
export function DescriptionText(_a) {
    var children = _a.children, selectable = _a.selectable;
    var t = useTheme();
    var descriptionId = React.useContext(Context).descriptionId;
    return (_jsx(Text, { nativeID: descriptionId, selectable: selectable, style: [a.text_md, a.leading_snug, t.atoms.text_contrast_high, a.pb_lg], children: children }));
}
export function Actions(_a) {
    var children = _a.children;
    var gtMobile = useBreakpoints().gtMobile;
    return (_jsx(View, { style: [
            a.w_full,
            a.gap_md,
            a.justify_end,
            gtMobile
                ? [a.flex_row, a.flex_row_reverse, a.justify_start]
                : [a.flex_col],
        ], children: children }));
}
export function Cancel(_a) {
    var cta = _a.cta;
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var close = Dialog.useDialogContext().close;
    var onPress = React.useCallback(function () {
        close();
    }, [close]);
    return (_jsx(Button, { variant: "solid", color: "secondary", size: gtMobile ? 'small' : 'large', label: cta || _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Cancel"], ["Cancel"])))), onPress: onPress, children: _jsx(ButtonText, { children: cta || _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Cancel"], ["Cancel"])))) }) }));
}
export function Action(_a) {
    var onPress = _a.onPress, _b = _a.color, color = _b === void 0 ? 'primary' : _b, cta = _a.cta, testID = _a.testID;
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var close = Dialog.useDialogContext().close;
    var handleOnPress = React.useCallback(function (e) {
        close(function () { return onPress === null || onPress === void 0 ? void 0 : onPress(e); });
    }, [close, onPress]);
    return (_jsx(Button, { variant: "solid", color: color, size: gtMobile ? 'small' : 'large', label: cta || _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Confirm"], ["Confirm"])))), onPress: handleOnPress, testID: testID, children: _jsx(ButtonText, { children: cta || _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Confirm"], ["Confirm"])))) }) }));
}
export function Basic(_a) {
    var control = _a.control, title = _a.title, description = _a.description, cancelButtonCta = _a.cancelButtonCta, confirmButtonCta = _a.confirmButtonCta, onConfirm = _a.onConfirm, confirmButtonColor = _a.confirmButtonColor, _b = _a.showCancel, showCancel = _b === void 0 ? true : _b;
    return (_jsxs(Outer, { control: control, testID: "confirmModal", children: [_jsx(TitleText, { children: title }), description && _jsx(DescriptionText, { children: description }), _jsxs(Actions, { children: [_jsx(Action, { cta: confirmButtonCta, onPress: onConfirm, color: confirmButtonColor, testID: "confirmBtn" }), showCancel && _jsx(Cancel, { cta: cancelButtonCta })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
