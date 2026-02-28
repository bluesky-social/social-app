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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Platform, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { codeToLanguageName, languageName } from '#/locale/helpers';
import { LANGUAGES } from '#/locale/languages';
import { useLanguagePrefs } from '#/state/preferences';
import { atoms as a, useTheme } from '#/alf';
import { Loader } from '#/components/Loader';
import * as Select from '#/components/Select';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { useTranslateOnDevice } from '#/translation';
export function TranslatedPost(_a) {
    var postText = _a.postText, _b = _a.hideLoading, hideLoading = _b === void 0 ? false : _b;
    var translationState = useTranslateOnDevice().translationState;
    if (translationState.status === 'loading' && !hideLoading) {
        return _jsx(TranslationLoading, {});
    }
    if (translationState.status === 'success') {
        return (_jsx(TranslationResult, { postText: postText, sourceLanguage: translationState.sourceLanguage, translatedText: translationState.translatedText }));
    }
    return null;
}
function TranslationLoading() {
    var t = useTheme();
    return (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_sm, a.py_xs], children: [_jsx(Loader, { size: "sm" }), _jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Translating\u2026" }) })] }));
}
function TranslationResult(_a) {
    var postText = _a.postText, sourceLanguage = _a.sourceLanguage, translatedText = _a.translatedText;
    var t = useTheme();
    var i18n = useLingui().i18n;
    var langName = sourceLanguage
        ? codeToLanguageName(sourceLanguage, i18n.locale)
        : undefined;
    return (_jsxs(View, { style: [a.py_xs, a.gap_xs, a.mt_sm], children: [_jsxs(Text, { style: [a.text_xs, t.atoms.text_contrast_medium], children: [langName ? (_jsxs(Trans, { children: ["Translated from ", langName] })) : (_jsx(Trans, { children: "Translated" })), sourceLanguage != null && (_jsxs(_Fragment, { children: [_jsxs(Text, { style: [a.text_sm, t.atoms.text_contrast_medium], children: [' ', "\u00B7"] }), ' ', _jsx(TranslationLanguageSelect, { sourceLanguage: sourceLanguage, postText: postText })] }))] }), _jsx(Text, { emoji: true, selectable: true, style: [a.text_md, a.leading_snug], children: translatedText })] }));
}
function TranslationLanguageSelect(_a) {
    var postText = _a.postText, sourceLanguage = _a.sourceLanguage;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var langPrefs = useLanguagePrefs();
    var translate = useTranslateOnDevice().translate;
    var items = useMemo(function () {
        return LANGUAGES.filter(function (lang, index, self) {
            return !langPrefs.primaryLanguage.startsWith(lang.code2) && // Don't show the current language as it would be redundant
                index === self.findIndex(function (t) { return t.code2 === lang.code2; });
        })
            .sort(function (a, b) {
            return languageName(a, langPrefs.appLanguage).localeCompare(languageName(b, langPrefs.appLanguage), langPrefs.appLanguage);
        })
            .map(function (l) { return ({
            label: languageName(l, langPrefs.appLanguage), // The viewer may not be familiar with the source language, so localize the name
            value: l.code2,
        }); });
    }, [langPrefs]);
    var handleChangeTranslationLanguage = function (sourceLangCode) {
        ax.metric('translate:override', {
            os: Platform.OS,
            sourceLanguage: sourceLangCode,
            targetLanguage: langPrefs.primaryLanguage,
        });
        void translate(postText, langPrefs.primaryLanguage, sourceLangCode);
    };
    return (_jsxs(Select.Root, { value: sourceLanguage, onValueChange: handleChangeTranslationLanguage, children: [_jsx(Select.Trigger, { hitSlop: 10, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Change source language"], ["Change source language"])))), children: function (_a) {
                    var props = _a.props;
                    return (_jsx(Text, __assign({}, props, { style: [a.text_xs], children: _jsx(Trans, { children: "Edit" }) })));
                } }), _jsx(Select.Content, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Select the source language"], ["Select the source language"])))), renderItem: function (_a) {
                    var label = _a.label, value = _a.value;
                    return (_jsxs(Select.Item, { value: value, label: label, children: [_jsx(Select.ItemIndicator, {}), _jsx(Select.ItemText, { children: label })] }));
                }, items: items })] }));
}
var templateObject_1, templateObject_2;
