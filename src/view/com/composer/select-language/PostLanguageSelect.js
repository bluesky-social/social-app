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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { LANG_DROPDOWN_HITSLOP } from '#/lib/constants';
import { codeToLanguageName } from '#/locale/helpers';
import { toPostLanguages, useLanguagePrefs, useLanguagePrefsApi, } from '#/state/preferences/languages';
import { atoms as a, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { LanguageSelectDialog } from '#/components/dialogs/LanguageSelectDialog';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';
import { Globe_Stroke2_Corner0_Rounded as GlobeIcon } from '#/components/icons/Globe';
import * as Menu from '#/components/Menu';
import { Text } from '#/components/Typography';
export function PostLanguageSelect(_a) {
    var currentLanguagesProp = _a.currentLanguages, onSelectLanguage = _a.onSelectLanguage;
    var _ = useLingui()._;
    var langPrefs = useLanguagePrefs();
    var setLangPrefs = useLanguagePrefsApi();
    var languageDialogControl = Dialog.useDialogControl();
    var dedupedHistory = Array.from(new Set(__spreadArray(__spreadArray([], langPrefs.postLanguageHistory, true), [langPrefs.postLanguage], false)));
    var currentLanguages = currentLanguagesProp !== null && currentLanguagesProp !== void 0 ? currentLanguagesProp : toPostLanguages(langPrefs.postLanguage);
    var onSelectLanguages = function (languages) {
        var langsString = languages.join(',');
        if (!langsString) {
            langsString = langPrefs.primaryLanguage;
        }
        setLangPrefs.setPostLanguage(langsString);
        onSelectLanguage === null || onSelectLanguage === void 0 ? void 0 : onSelectLanguage(langsString);
    };
    if (dedupedHistory.length === 1 &&
        dedupedHistory[0] === langPrefs.postLanguage) {
        return (_jsxs(_Fragment, { children: [_jsx(LanguageBtn, { onPress: languageDialogControl.open }), _jsx(LanguageSelectDialog, { titleText: _jsx(Trans, { children: "Choose post languages" }), subtitleText: _jsx(Trans, { children: "Select up to 3 languages used in this post" }), control: languageDialogControl, currentLanguages: currentLanguages, onSelectLanguages: onSelectLanguages, maxLanguages: 3 })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Select post language"], ["Select post language"])))), children: function (_a) {
                            var props = _a.props;
                            return (_jsx(LanguageBtn, __assign({ currentLanguages: currentLanguages }, props)));
                        } }), _jsxs(Menu.Outer, { children: [_jsx(Menu.Group, { children: dedupedHistory.map(function (historyItem) {
                                    var langCodes = historyItem.split(',');
                                    var langName = langCodes
                                        .map(function (code) { return codeToLanguageName(code, langPrefs.appLanguage); })
                                        .join(' + ');
                                    return (_jsxs(Menu.Item, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Select ", ""], ["Select ", ""])), langName)), onPress: function () {
                                            setLangPrefs.setPostLanguage(historyItem);
                                            onSelectLanguage === null || onSelectLanguage === void 0 ? void 0 : onSelectLanguage(historyItem);
                                        }, children: [_jsx(Menu.ItemText, { children: langName }), _jsx(Menu.ItemRadio, { selected: currentLanguages.includes(historyItem) })] }, historyItem));
                                }) }), _jsx(Menu.Divider, {}), _jsxs(Menu.Item, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["More languages..."], ["More languages..."])))), onPress: languageDialogControl.open, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "More languages..." }) }), _jsx(Menu.ItemIcon, { icon: ChevronRightIcon })] })] })] }), _jsx(LanguageSelectDialog, { titleText: _jsx(Trans, { children: "Choose post languages" }), subtitleText: _jsx(Trans, { children: "Select up to 3 languages used in this post" }), control: languageDialogControl, currentLanguages: currentLanguages, onSelectLanguages: onSelectLanguages, maxLanguages: 3 })] }));
}
function LanguageBtn(props) {
    var _a;
    var _ = useLingui()._;
    var langPrefs = useLanguagePrefs();
    var t = useTheme();
    var postLanguagesPref = toPostLanguages(langPrefs.postLanguage);
    var currentLanguages = (_a = props.currentLanguages) !== null && _a !== void 0 ? _a : postLanguagesPref;
    return (_jsx(Button, __assign({ testID: "selectLangBtn", size: "small", hitSlop: LANG_DROPDOWN_HITSLOP, label: _(msg({
            message: "Post language selection",
            comment: "Accessibility label for button that opens dialog to choose post language settings",
        })), accessibilityHint: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Opens post language settings"], ["Opens post language settings"])))), style: [a.mr_xs] }, props, { children: function (_a) {
            var pressed = _a.pressed, hovered = _a.hovered;
            var color = pressed || hovered ? t.palette.primary_300 : t.palette.primary_500;
            if (currentLanguages.length > 0) {
                return (_jsx(Text, { style: [
                        { color: color },
                        a.font_semi_bold,
                        a.text_sm,
                        a.leading_snug,
                        { maxWidth: 100 },
                    ], numberOfLines: 1, children: currentLanguages
                        .map(function (lang) { return codeToLanguageName(lang, langPrefs.appLanguage); })
                        .join(', ') }));
            }
            else {
                return _jsx(GlobeIcon, { size: "xs", style: { color: color } });
            }
        } })));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
