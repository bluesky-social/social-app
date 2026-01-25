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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useMemo } from 'react';
import { Text as RNText } from 'react-native';
import { Image } from 'expo-image';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { getDefaultCountry, INTERNATIONAL_TELEPHONE_CODES, } from '#/lib/international-telephone-codes';
import { regionName } from '#/locale/helpers';
import { atoms as a, web } from '#/alf';
import * as Select from '#/components/Select';
import { IS_WEB } from '#/env';
import { useGeolocation } from '#/geolocation';
/**
 * Country picker for a phone number input
 *
 * Pro tip: you can use `location?.countryCode` from `useGeolocationStatus()`
 * to set a default value.
 */
export function InternationalPhoneCodeSelect(_a) {
    var value = _a.value, onChange = _a.onChange;
    var _b = useLingui(), _ = _b._, i18n = _b.i18n;
    var location = useGeolocation();
    var defaultCountry = useMemo(function () {
        return getDefaultCountry(location);
    }, [location]);
    var items = useMemo(function () {
        return (Object.entries(INTERNATIONAL_TELEPHONE_CODES)
            .map(function (_a) {
            var value = _a[0], _b = _a[1], code = _b.code, unicodeFlag = _b.unicodeFlag, svgFlag = _b.svgFlag;
            var name = regionName(value, i18n.locale);
            return {
                value: value,
                name: name,
                code: code,
                label: "".concat(name, " ").concat(code),
                unicodeFlag: unicodeFlag,
                svgFlag: svgFlag,
            };
        })
            // boost the default value to the top, then sort by name
            .sort(function (a, b) {
            if (a.value === defaultCountry)
                return -1;
            if (b.value === defaultCountry)
                return 1;
            return a.name.localeCompare(b.name);
        }));
    }, [i18n.locale, defaultCountry]);
    var selected = useMemo(function () {
        return items.find(function (item) { return item.value === value; });
    }, [value, items]);
    return (_jsxs(Select.Root, { value: value, onValueChange: onChange, children: [_jsxs(Select.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Select telephone code"], ["Select telephone code"])))), children: [_jsx(Select.ValueText, { placeholder: "+...", webOverrideValue: selected, children: function (selected) { return (_jsxs(_Fragment, { children: [_jsx(Flag, __assign({}, selected)), selected.code] })); } }), _jsx(Select.Icon, {})] }), _jsx(Select.Content, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Country code"], ["Country code"])))), items: items, renderItem: function (item) { return (_jsxs(Fragment, { children: [_jsxs(Select.Item, { value: item.value, label: item.label, children: [_jsx(Select.ItemIndicator, {}), _jsxs(Select.ItemText, { style: [a.flex_1], emoji: true, children: [IS_WEB ? _jsx(Flag, __assign({}, item)) : item.unicodeFlag + ' ', item.name] }), _jsxs(Select.ItemText, { style: [a.text_right], children: [' ', item.code] })] }), item.value === defaultCountry && _jsx(Select.Separator, {})] }, item.value)); } })] }));
}
function Flag(_a) {
    var unicodeFlag = _a.unicodeFlag, svgFlag = _a.svgFlag;
    if (IS_WEB) {
        return (_jsx(Image, { source: svgFlag, style: [
                a.rounded_2xs,
                { height: 13, aspectRatio: 4 / 3, marginRight: 6 },
                web({ verticalAlign: 'bottom' }),
            ], accessibilityIgnoresInvertColors: true }));
    }
    return _jsx(RNText, { style: [{ lineHeight: 21 }], children: unicodeFlag + ' ' });
}
var templateObject_1, templateObject_2;
