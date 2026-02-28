var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { sanitizeAppLanguageSetting } from '#/locale/helpers';
import { APP_LANGUAGES } from '#/locale/languages';
import * as Select from '#/components/Select';
export function LanguageSelect(_a) {
    var value = _a.value, onChange = _a.onChange, _b = _a.items, items = _b === void 0 ? APP_LANGUAGES.map(function (l) { return ({
        label: l.name,
        value: l.code2,
    }); }) : _b, label = _a.label;
    var _ = useLingui()._;
    var handleOnChange = React.useCallback(function (value) {
        if (!value)
            return;
        onChange(sanitizeAppLanguageSetting(value));
    }, [onChange]);
    return (_jsxs(Select.Root, { value: value ? sanitizeAppLanguageSetting(value) : undefined, onValueChange: handleOnChange, children: [_jsxs(Select.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Select language"], ["Select language"])))), children: [_jsx(Select.ValueText, { placeholder: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Select language"], ["Select language"])))) }), _jsx(Select.Icon, {})] }), _jsx(Select.Content, { label: label, renderItem: function (_a) {
                    var label = _a.label, value = _a.value;
                    return (_jsxs(Select.Item, { value: value, label: label, children: [_jsx(Select.ItemIndicator, {}), _jsx(Select.ItemText, { children: label })] }));
                }, items: items })] }));
}
var templateObject_1, templateObject_2;
