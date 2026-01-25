var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { subDays } from 'date-fns';
import { atoms as a, useTheme } from '#/alf';
import { Text } from '../Typography';
import { localDateString } from './util';
var timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
});
var weekdayFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
});
var longDateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
});
var longDateFormatterWithYear = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});
var DateDivider = function (_a) {
    var dateStr = _a.date;
    var _ = useLingui()._;
    var t = useTheme();
    var date;
    var time = timeFormatter.format(new Date(dateStr));
    var timestamp = new Date(dateStr);
    var today = new Date();
    var yesterday = subDays(today, 1);
    var oneWeekAgo = subDays(today, 7);
    if (localDateString(today) === localDateString(timestamp)) {
        date = _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Today"], ["Today"]))));
    }
    else if (localDateString(yesterday) === localDateString(timestamp)) {
        date = _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Yesterday"], ["Yesterday"]))));
    }
    else {
        if (timestamp < oneWeekAgo) {
            if (timestamp.getFullYear() === today.getFullYear()) {
                date = longDateFormatter.format(timestamp);
            }
            else {
                date = longDateFormatterWithYear.format(timestamp);
            }
        }
        else {
            date = weekdayFormatter.format(timestamp);
        }
    }
    return (_jsx(View, { style: [a.w_full, a.my_lg], children: _jsx(Text, { style: [
                a.text_xs,
                a.text_center,
                t.atoms.bg,
                t.atoms.text_contrast_medium,
                a.px_md,
            ], children: _jsxs(Trans, { children: [_jsx(Text, { style: [a.text_xs, t.atoms.text_contrast_medium, a.font_semi_bold], children: date }), ' ', "at ", time] }) }) }));
};
DateDivider = React.memo(DateDivider);
export { DateDivider };
var templateObject_1, templateObject_2;
