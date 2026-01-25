import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useImperativeHandle, useState } from 'react';
import { Keyboard } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useLingui } from '@lingui/react';
import { useTheme } from '#/alf';
import { toSimpleDateString } from '#/components/forms/DateField/utils';
import * as TextField from '#/components/forms/TextField';
import { DateFieldButton } from './index.shared';
export * as utils from '#/components/forms/DateField/utils';
export var LabelText = TextField.LabelText;
export function DateField(_a) {
    var value = _a.value, inputRef = _a.inputRef, onChangeDate = _a.onChangeDate, label = _a.label, isInvalid = _a.isInvalid, testID = _a.testID, accessibilityHint = _a.accessibilityHint, maximumDate = _a.maximumDate;
    var i18n = useLingui().i18n;
    var t = useTheme();
    var _b = useState(false), open = _b[0], setOpen = _b[1];
    var onChangeInternal = useCallback(function (date) {
        setOpen(false);
        var formatted = toSimpleDateString(date);
        onChangeDate(formatted);
    }, [onChangeDate, setOpen]);
    useImperativeHandle(inputRef, function () { return ({
        focus: function () {
            Keyboard.dismiss();
            setOpen(true);
        },
        blur: function () {
            setOpen(false);
        },
    }); }, []);
    var onPress = useCallback(function () {
        setOpen(true);
    }, []);
    var onCancel = useCallback(function () {
        setOpen(false);
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx(DateFieldButton, { label: label, value: value, onPress: onPress, isInvalid: isInvalid, accessibilityHint: accessibilityHint }), open && (
            // Android implementation of DatePicker currently does not change default button colors according to theme and only takes hex values for buttonColor
            // Can remove the buttonColor setting if/when this PR is merged: https://github.com/henninghall/react-native-date-picker/pull/871
            _jsx(DatePicker, { modal: true, open: true, timeZoneOffsetInMinutes: 0, theme: t.scheme, 
                // @ts-ignore TODO
                buttonColor: t.name === 'light' ? '#000000' : '#ffffff', date: new Date(value), onConfirm: onChangeInternal, onCancel: onCancel, mode: "date", locale: i18n.locale, is24hourSource: "locale", testID: "".concat(testID, "-datepicker"), "aria-label": label, accessibilityLabel: label, accessibilityHint: accessibilityHint, maximumDate: maximumDate ? new Date(toSimpleDateString(maximumDate)) : undefined }))] }));
}
