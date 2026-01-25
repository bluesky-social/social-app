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
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { sanitizeAppLanguageSetting } from '#/locale/helpers';
import { APP_LANGUAGES } from '#/locale/languages';
import { useLanguagePrefs, useLanguagePrefsApi } from '#/state/preferences';
import { resetPostsFeedQueries } from '#/state/queries/post-feed';
import { atoms as a, platform, useTheme } from '#/alf';
import * as Select from '#/components/Select';
import { Button } from './Button';
export function AppLanguageDropdown() {
    var t = useTheme();
    var _ = useLingui()._;
    var queryClient = useQueryClient();
    var langPrefs = useLanguagePrefs();
    var setLangPrefs = useLanguagePrefsApi();
    var sanitizedLang = sanitizeAppLanguageSetting(langPrefs.appLanguage);
    var onChangeAppLanguage = React.useCallback(function (value) {
        if (!value)
            return;
        if (sanitizedLang !== value) {
            setLangPrefs.setAppLanguage(sanitizeAppLanguageSetting(value));
        }
        // reset feeds to refetch content
        resetPostsFeedQueries(queryClient);
    }, [sanitizedLang, setLangPrefs, queryClient]);
    return (_jsxs(Select.Root, { value: sanitizeAppLanguageSetting(langPrefs.appLanguage), onValueChange: onChangeAppLanguage, children: [_jsx(Select.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Change app language"], ["Change app language"])))), children: function (_a) {
                    var props = _a.props;
                    return (_jsxs(Button, __assign({}, props, { label: props.accessibilityLabel, size: platform({
                            web: 'tiny',
                            native: 'small',
                        }), variant: "ghost", color: "secondary", shape: "rectangular", style: [
                            a.pr_xs,
                            a.pl_sm,
                            platform({
                                web: [{ alignSelf: 'flex-start' }, a.gap_sm],
                                native: [a.gap_xs],
                            }),
                        ], children: [_jsx(Select.ValueText, { placeholder: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Select an app language"], ["Select an app language"])))), style: [t.atoms.text_contrast_medium] }), _jsx(Select.Icon, { style: [t.atoms.text_contrast_medium] })] })));
                } }), _jsx(Select.Content, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Select language"], ["Select language"])))), renderItem: function (_a) {
                    var label = _a.label, value = _a.value;
                    return (_jsxs(Select.Item, { value: value, label: label, children: [_jsx(Select.ItemIndicator, {}), _jsx(Select.ItemText, { children: label })] }));
                }, items: APP_LANGUAGES.map(function (l) { return ({
                    label: l.name,
                    value: l.code2,
                }); }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
