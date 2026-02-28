var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { sanitizeAppLanguageSetting } from '#/locale/helpers';
import { APP_LANGUAGES, LANGUAGES } from '#/locale/languages';
import { useLanguagePrefs, useLanguagePrefsApi } from '#/state/preferences';
import { atoms as a, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { LanguageSelectDialog } from '#/components/dialogs/LanguageSelectDialog';
import * as Toggle from '#/components/forms/Toggle';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import * as Layout from '#/components/Layout';
import * as Select from '#/components/Select';
import { Text } from '#/components/Typography';
import * as SettingsList from './components/SettingsList';
var DEDUPED_LANGUAGES = LANGUAGES.filter(function (lang, i, arr) {
    return lang.code2 && arr.findIndex(function (l) { return l.code2 === lang.code2; }) === i;
});
export function LanguageSettingsScreen(_a) {
    var _ = useLingui()._;
    var langPrefs = useLanguagePrefs();
    var setLangPrefs = useLanguagePrefsApi();
    var contentLanguagePrefsControl = useDialogControl();
    var onChangePrimaryLanguage = useCallback(function (value) {
        if (!value)
            return;
        if (langPrefs.primaryLanguage !== value) {
            setLangPrefs.setPrimaryLanguage(value);
        }
    }, [langPrefs, setLangPrefs]);
    var onChangeAppLanguage = useCallback(function (value) {
        if (!value)
            return;
        if (langPrefs.appLanguage !== value) {
            setLangPrefs.setAppLanguage(sanitizeAppLanguageSetting(value));
        }
    }, [langPrefs, setLangPrefs]);
    var _b = useState(langPrefs.contentLanguages), recentLanguages = _b[0], setRecentLanguages = _b[1];
    var possibleLanguages = useMemo(function () {
        return __spreadArray([], new Set(__spreadArray(__spreadArray(__spreadArray([], recentLanguages, true), langPrefs.contentLanguages, true), langPrefs.primaryLanguage, true)), true).map(function (lang) { return LANGUAGES.find(function (l) { return l.code2 === lang; }); })
            .filter(function (x) { return !!x; });
    }, [recentLanguages, langPrefs.contentLanguages, langPrefs.primaryLanguage]);
    return (_jsxs(Layout.Screen, { testID: "PreferencesLanguagesScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Languages" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(SettingsList.Container, { children: [_jsxs(SettingsList.Group, { iconInset: false, children: [_jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "App language" }) }), _jsxs(View, { style: [a.gap_md, a.w_full], children: [_jsx(Text, { style: [a.leading_snug], children: _jsx(Trans, { children: "Select which language to use for the app's user interface." }) }), _jsxs(Select.Root, { value: sanitizeAppLanguageSetting(langPrefs.appLanguage), onValueChange: onChangeAppLanguage, children: [_jsxs(Select.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Select app language"], ["Select app language"])))), children: [_jsx(Select.ValueText, {}), _jsx(Select.Icon, {})] }), _jsx(Select.Content, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["App language"], ["App language"])))), renderItem: function (_a) {
                                                        var label = _a.label, value = _a.value;
                                                        return (_jsxs(Select.Item, { value: value, label: label, children: [_jsx(Select.ItemIndicator, {}), _jsx(Select.ItemText, { children: label })] }));
                                                    }, items: APP_LANGUAGES.map(function (l) { return ({
                                                        label: l.name,
                                                        value: l.code2,
                                                    }); }) })] })] })] }), _jsx(SettingsList.Divider, {}), _jsxs(SettingsList.Group, { iconInset: false, children: [_jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Primary language" }) }), _jsxs(View, { style: [a.gap_md, a.w_full], children: [_jsx(Text, { style: [a.leading_snug], children: _jsx(Trans, { children: "Select your preferred language for translations in your feed." }) }), _jsxs(Select.Root, { value: langPrefs.primaryLanguage, onValueChange: onChangePrimaryLanguage, children: [_jsxs(Select.Trigger, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Select primary language"], ["Select primary language"])))), children: [_jsx(Select.ValueText, {}), _jsx(Select.Icon, {})] }), _jsx(Select.Content, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Primary language"], ["Primary language"])))), renderItem: function (_a) {
                                                        var label = _a.label, value = _a.value;
                                                        return (_jsxs(Select.Item, { value: value, label: label, children: [_jsx(Select.ItemIndicator, {}), _jsx(Select.ItemText, { children: label })] }));
                                                    }, items: DEDUPED_LANGUAGES.sort(function (a, b) {
                                                        return a.name.localeCompare(b.name, langPrefs.appLanguage);
                                                    }).map(function (l) { return ({
                                                        label: l.name, // Pre-generated name using Intl.DisplayNames
                                                        value: l.code2,
                                                    }); }) })] })] })] }), _jsx(SettingsList.Divider, {}), _jsxs(SettingsList.Group, { iconInset: false, children: [_jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Content languages" }) }), _jsxs(View, { style: [a.gap_md], children: [_jsx(Text, { style: [a.leading_snug], children: _jsx(Trans, { children: "Select which languages you want your subscribed feeds to include. If none are selected, all languages will be shown." }) }), langPrefs.contentLanguages.length === 0 && (_jsx(Admonition, { type: "info", children: _jsx(Trans, { children: "All languages will be shown in your feeds." }) })), _jsx(View, { style: [a.w_full, web({ maxWidth: 400 })], children: _jsx(Toggle.Group, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Select content languages"], ["Select content languages"])))), values: langPrefs.contentLanguages, onChange: setLangPrefs.setContentLanguages, children: _jsxs(Toggle.PanelGroup, { children: [possibleLanguages
                                                            .sort(function (a, b) {
                                                            return a.name.localeCompare(b.name, langPrefs.appLanguage);
                                                        })
                                                            .map(function (language, index) {
                                                            var name = language.name; // Pre-generated name using Intl.DisplayNames
                                                            return (_jsx(Toggle.Item, { name: language.code2, label: name, children: function (_a) {
                                                                    var selected = _a.selected;
                                                                    return (_jsxs(Toggle.Panel, { active: selected, adjacent: index === 0 ? 'trailing' : 'both', children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.PanelText, { children: name })] }));
                                                                } }, language.code2));
                                                        }), _jsx(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Add more languages\u2026"], ["Add more languages\u2026"])))), onPress: contentLanguagePrefsControl.open, children: _jsxs(Toggle.Panel, { adjacent: "leading", children: [_jsx(Toggle.PanelIcon, { icon: PlusIcon }), _jsx(Toggle.PanelText, { children: "Add more languages\u2026" })] }) })] }) }) }), _jsx(LanguageSelectDialog, { control: contentLanguagePrefsControl, titleText: _jsx(Trans, { children: "Select content languages" }), subtitleText: _jsx(Trans, { children: "If none are selected, all languages will be shown in your feeds." }), currentLanguages: langPrefs.contentLanguages, onSelectLanguages: function (languages) {
                                                setLangPrefs.setContentLanguages(languages);
                                                setRecentLanguages(function (recent) { return __spreadArray([], new Set(__spreadArray(__spreadArray([], recent, true), languages, true)), true); });
                                            } })] })] })] }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
