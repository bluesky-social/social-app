var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useImperativeHandle } from 'react';
import { Keyboard, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { toSimpleDateString } from '#/components/forms/DateField/utils';
import * as TextField from '#/components/forms/TextField';
import { DateFieldButton } from './index.shared';
export * as utils from '#/components/forms/DateField/utils';
export var LabelText = TextField.LabelText;
/**
 * Date-only input. Accepts a string in the format YYYY-MM-DD, or a Date object.
 * Date objects are converted to strings in the format YYYY-MM-DD.
 * Returns a string in the format YYYY-MM-DD.
 *
 * To generate a string in the format YYYY-MM-DD from a Date object, use the
 * `utils.toSimpleDateString(Date)` export of this file.
 */
export function DateField(_a) {
    var value = _a.value, inputRef = _a.inputRef, onChangeDate = _a.onChangeDate, testID = _a.testID, label = _a.label, isInvalid = _a.isInvalid, accessibilityHint = _a.accessibilityHint, maximumDate = _a.maximumDate;
    var _b = useLingui(), _ = _b._, i18n = _b.i18n;
    var t = useTheme();
    var control = Dialog.useDialogControl();
    var onChangeInternal = useCallback(function (date) {
        if (date) {
            var formatted = toSimpleDateString(date);
            onChangeDate(formatted);
        }
    }, [onChangeDate]);
    useImperativeHandle(inputRef, function () { return ({
        focus: function () {
            Keyboard.dismiss();
            control.open();
        },
        blur: function () {
            control.close();
        },
    }); }, [control]);
    return (_jsxs(_Fragment, { children: [_jsx(DateFieldButton, { label: label, value: value, onPress: function () {
                    Keyboard.dismiss();
                    control.open();
                }, isInvalid: isInvalid, accessibilityHint: accessibilityHint }), _jsxs(Dialog.Outer, { control: control, testID: testID, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(Dialog.ScrollableInner, { label: label, children: _jsxs(View, { style: a.gap_lg, children: [_jsx(View, { style: [a.relative, a.w_full, a.align_center], children: _jsx(DatePicker, { timeZoneOffsetInMinutes: 0, theme: t.scheme, date: new Date(toSimpleDateString(value)), onDateChange: onChangeInternal, mode: "date", locale: i18n.locale, testID: "".concat(testID, "-datepicker"), "aria-label": label, accessibilityLabel: label, accessibilityHint: accessibilityHint, maximumDate: maximumDate
                                            ? new Date(toSimpleDateString(maximumDate))
                                            : undefined }) }), _jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Done"], ["Done"])))), onPress: function () { return control.close(); }, size: "large", color: "primary", variant: "solid", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Done" }) }) })] }) })] })] }));
}
var templateObject_1;
