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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Plural, Trans } from '@lingui/react/macro';
import { MAX_ALT_TEXT } from '#/lib/constants';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';
import { LANGUAGES } from '#/locale/languages';
import { useLanguagePrefs } from '#/state/preferences';
import { atoms as a, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/forms/TextField';
import { CC_Stroke2_Corner0_Rounded as CCIcon } from '#/components/icons/CC';
import { PageText_Stroke2_Corner0_Rounded as PageTextIcon } from '#/components/icons/PageText';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
import { SubtitleFilePicker } from './SubtitleFilePicker';
var MAX_NUM_CAPTIONS = 1;
export function SubtitleDialogBtn(props) {
    var control = Dialog.useDialogControl();
    var _ = useLingui()._;
    return (_jsxs(View, { style: [a.flex_row, a.my_xs], children: [_jsxs(Button, { label: IS_WEB ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Captions & alt text"], ["Captions & alt text"])))) : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Alt text"], ["Alt text"])))), accessibilityHint: IS_WEB
                    ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Opens captions and alt text dialog"], ["Opens captions and alt text dialog"]))))
                    : _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Opens alt text dialog"], ["Opens alt text dialog"])))), size: "small", color: "secondary", variant: "ghost", onPress: function () {
                    if (Keyboard.isVisible())
                        Keyboard.dismiss();
                    control.open();
                }, children: [_jsx(ButtonIcon, { icon: CCIcon }), _jsx(ButtonText, { children: IS_WEB ? (_jsx(Trans, { children: "Captions & alt text" })) : (_jsx(Trans, { children: "Alt text" })) })] }), _jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(SubtitleDialogInner, __assign({}, props))] })] }));
}
function SubtitleDialogInner(_a) {
    var defaultAltText = _a.defaultAltText, saveAltText = _a.saveAltText, captions = _a.captions, setCaptions = _a.setCaptions;
    var control = Dialog.useDialogContext();
    var _ = useLingui()._;
    var t = useTheme();
    var primaryLanguage = useLanguagePrefs().primaryLanguage;
    var _b = useState(defaultAltText), altText = _b[0], setAltText = _b[1];
    var handleSelectFile = useCallback(function (file) {
        setCaptions(function (subs) { return __spreadArray(__spreadArray([], subs, true), [
            {
                lang: subs.some(function (s) { return s.lang === primaryLanguage; })
                    ? ''
                    : primaryLanguage,
                file: file,
            },
        ], false); });
    }, [setCaptions, primaryLanguage]);
    var subtitleMissingLanguage = captions.some(function (sub) { return sub.lang === ''; });
    var isOverMaxLength = isOverMaxGraphemeCount({
        text: altText,
        maxCount: MAX_ALT_TEXT,
    });
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Video settings"], ["Video settings"])))), children: [_jsxs(View, { style: a.gap_md, children: [_jsx(Text, { style: [a.text_xl, a.font_semi_bold, a.leading_tight], children: _jsx(Trans, { children: "Alt text" }) }), _jsx(TextField.Root, { isInvalid: isOverMaxLength, children: _jsx(Dialog.Input, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Alt text"], ["Alt text"])))), placeholder: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Add alt text (optional)"], ["Add alt text (optional)"])))), value: altText, onChangeText: setAltText, maxLength: MAX_ALT_TEXT * 10, multiline: true, style: { maxHeight: 300 }, numberOfLines: 3, onKeyPress: function (_a) {
                                var nativeEvent = _a.nativeEvent;
                                if (nativeEvent.key === 'Escape') {
                                    control.close();
                                }
                            } }) }), isOverMaxLength && (_jsx(Text, { style: [
                            a.text_md,
                            { color: t.palette.negative_500 },
                            a.leading_snug,
                            a.mt_md,
                        ], children: _jsx(Plural, { value: MAX_ALT_TEXT, other: "Alt text must be less than # characters." }) })), IS_WEB && (_jsxs(_Fragment, { children: [_jsx(View, { style: [
                                    a.border_t,
                                    a.w_full,
                                    t.atoms.border_contrast_medium,
                                    a.my_md,
                                ] }), _jsx(Text, { style: [a.text_xl, a.font_semi_bold, a.leading_tight], children: _jsx(Trans, { children: "Captions (.vtt)" }) }), _jsx(SubtitleFilePicker, { onSelectFile: handleSelectFile, disabled: subtitleMissingLanguage || captions.length >= MAX_NUM_CAPTIONS }), _jsx(View, { children: captions.map(function (subtitle, i) { return (_jsx(SubtitleFileRow, { language: subtitle.lang, file: subtitle.file, setCaptions: setCaptions, otherLanguages: LANGUAGES.filter(function (lang) {
                                        return langCode(lang) === subtitle.lang ||
                                            !captions.some(function (s) { return s.lang === langCode(lang); });
                                    }), style: [i % 2 === 0 && t.atoms.bg_contrast_25] }, subtitle.lang)); }) }), subtitleMissingLanguage && (_jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Ensure you have selected a language for each caption file." }) }))] })), _jsx(View, { style: web([a.flex_row, a.justify_end]), children: _jsx(Button, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Done"], ["Done"])))), size: IS_WEB ? 'small' : 'large', color: "primary", variant: "solid", onPress: function () {
                                saveAltText(altText);
                                control.close();
                            }, style: a.mt_lg, disabled: isOverMaxLength, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Done" }) }) }) })] }), _jsx(Dialog.Close, {})] }));
}
function SubtitleFileRow(_a) {
    var language = _a.language, file = _a.file, otherLanguages = _a.otherLanguages, setCaptions = _a.setCaptions, style = _a.style;
    var _ = useLingui()._;
    var t = useTheme();
    var handleValueChange = useCallback(function (lang) {
        if (lang) {
            setCaptions(function (subs) {
                return subs.map(function (s) { return (s.lang === language ? { lang: lang, file: s.file } : s); });
            });
        }
    }, [setCaptions, language]);
    return (_jsxs(View, { style: [
            a.flex_row,
            a.justify_between,
            a.py_md,
            a.px_lg,
            a.rounded_md,
            a.gap_md,
            style,
        ], children: [_jsx(View, { style: [a.flex_1, a.gap_xs, a.justify_center], children: _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_sm], children: [language === '' ? (_jsx(WarningIcon, { style: a.flex_shrink_0, fill: t.palette.negative_500, size: "sm" })) : (_jsx(PageTextIcon, { style: [t.atoms.text, a.flex_shrink_0], size: "sm" })), _jsx(Text, { style: [a.flex_1, a.leading_snug, a.font_semi_bold, a.mb_2xs], numberOfLines: 1, children: file.name }), _jsxs("select", { value: language, onChange: function (evt) { return handleValueChange(evt.target.value); }, style: { maxWidth: 200, flex: 1 }, children: [_jsx("option", { value: "", disabled: true, selected: true, hidden: true, children: _jsx(Trans, { children: "Select language..." }) }), otherLanguages.map(function (lang) { return (_jsx("option", { value: langCode(lang), children: "".concat(lang.name, " (").concat(langCode(lang), ")") }, langCode(lang))); })] })] }) }), _jsx(Button, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Remove caption file"], ["Remove caption file"])))), size: "tiny", shape: "round", variant: "outline", color: "secondary", onPress: function () {
                    return setCaptions(function (subs) { return subs.filter(function (s) { return s.lang !== language; }); });
                }, style: [a.ml_sm], children: _jsx(ButtonIcon, { icon: X }) })] }));
}
function langCode(lang) {
    return lang.code2 || lang.code3;
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
