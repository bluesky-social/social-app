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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { StyleSheet } from 'react-native';
// @ts-expect-error untyped
import { unstable_createElement } from 'react-native-web';
import { toSimpleDateString } from '#/components/forms/DateField/utils';
import * as TextField from '#/components/forms/TextField';
import { CalendarDays_Stroke2_Corner0_Rounded as CalendarDays } from '#/components/icons/CalendarDays';
export * as utils from '#/components/forms/DateField/utils';
export var LabelText = TextField.LabelText;
var InputBase = React.forwardRef(function (_a, ref) {
    var style = _a.style, props = __rest(_a, ["style"]);
    return unstable_createElement('input', __assign(__assign({}, props), { ref: ref, type: 'date', style: [
            StyleSheet.flatten(style),
            {
                background: 'transparent',
                border: 0,
            },
        ] }));
});
InputBase.displayName = 'InputBase';
var Input = TextField.createInput(InputBase);
export function DateField(_a) {
    var value = _a.value, inputRef = _a.inputRef, onChangeDate = _a.onChangeDate, label = _a.label, isInvalid = _a.isInvalid, testID = _a.testID, accessibilityHint = _a.accessibilityHint, maximumDate = _a.maximumDate;
    var handleOnChange = React.useCallback(function (e) {
        var date = e.target.valueAsDate || e.target.value;
        if (date) {
            var formatted = toSimpleDateString(date);
            onChangeDate(formatted);
        }
    }, [onChangeDate]);
    return (_jsxs(TextField.Root, { isInvalid: isInvalid, children: [_jsx(TextField.Icon, { icon: CalendarDays }), _jsx(Input, { value: toSimpleDateString(value), inputRef: inputRef, label: label, onChange: handleOnChange, testID: testID, accessibilityHint: accessibilityHint, 
                // @ts-expect-error not typed as <input type="date"> even though it is one
                max: maximumDate ? toSimpleDateString(maximumDate) : undefined })] }));
}
