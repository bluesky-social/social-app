var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Text as RNText, View } from 'react-native';
import { parseLanguage } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import lande from 'lande';
import { code3ToCode2Strict, codeToLanguageName } from '#/locale/helpers';
import { useLanguagePrefs } from '#/state/preferences/languages';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { Earth_Stroke2_Corner2_Rounded as EarthIcon } from '#/components/icons/Globe';
import { Text } from '#/components/Typography';
// fallbacks for safari
var onIdle = globalThis.requestIdleCallback || (function (cb) { return setTimeout(cb, 1); });
var cancelIdle = globalThis.cancelIdleCallback || clearTimeout;
export function SuggestedLanguage(_a) {
    var text = _a.text, replyToLanguagesProp = _a.replyToLanguages, currentLanguages = _a.currentLanguages, onAcceptSuggestedLanguage = _a.onAcceptSuggestedLanguage;
    var langPrefs = useLanguagePrefs();
    var replyToLanguages = replyToLanguagesProp
        .map(function (lang) { return cleanUpLanguage(lang); })
        .filter(Boolean);
    var _b = useState(false), hasInteracted = _b[0], setHasInteracted = _b[1];
    var _c = useState(undefined), suggestedLanguage = _c[0], setSuggestedLanguage = _c[1];
    useEffect(function () {
        if (text.length > 0 && !hasInteracted) {
            setHasInteracted(true);
        }
    }, [text, hasInteracted]);
    useEffect(function () {
        var textTrimmed = text.trim();
        // Don't run the language model on small posts, the results are likely
        // to be inaccurate anyway.
        if (textTrimmed.length < 40) {
            setSuggestedLanguage(undefined);
            return;
        }
        var idle = onIdle(function () {
            setSuggestedLanguage(guessLanguage(textTrimmed));
        });
        return function () { return cancelIdle(idle); };
    }, [text]);
    /*
     * We've detected a language, and the user hasn't already selected it.
     */
    var hasLanguageSuggestion = suggestedLanguage && !currentLanguages.includes(suggestedLanguage);
    /*
     * We have not detected a different language, and the user is not already
     * using or has not already selected one of the languages of the post they
     * are replying to.
     */
    var hasSuggestedReplyLanguage = !hasInteracted &&
        !suggestedLanguage &&
        replyToLanguages.length &&
        !replyToLanguages.some(function (l) { return currentLanguages.includes(l); });
    if (hasLanguageSuggestion) {
        var suggestedLanguageName = codeToLanguageName(suggestedLanguage, langPrefs.appLanguage);
        return (_jsx(LanguageSuggestionButton, { label: _jsx(RNText, { children: _jsxs(Trans, { children: ["Are you writing in", ' ', _jsx(Text, { style: [a.font_bold], children: suggestedLanguageName }), "?"] }) }), value: suggestedLanguage, onAccept: onAcceptSuggestedLanguage }));
    }
    else if (hasSuggestedReplyLanguage) {
        var suggestedLanguageName = codeToLanguageName(replyToLanguages[0], langPrefs.appLanguage);
        return (_jsx(LanguageSuggestionButton, { label: _jsx(RNText, { children: _jsxs(Trans, { children: ["The post you're replying to was marked as being written in", ' ', suggestedLanguageName, " by its author. Would you like to reply in", ' ', _jsx(Text, { style: [a.font_bold], children: suggestedLanguageName }), "?"] }) }), value: replyToLanguages[0], onAccept: onAcceptSuggestedLanguage }));
    }
    else {
        return null;
    }
}
function LanguageSuggestionButton(_a) {
    var label = _a.label, value = _a.value, onAccept = _a.onAccept;
    var t = useTheme();
    var _ = useLingui()._;
    return (_jsx(View, { style: [a.px_lg, a.py_sm], children: _jsxs(View, { style: [
                a.gap_md,
                a.border,
                a.flex_row,
                a.align_center,
                a.rounded_sm,
                a.p_md,
                a.pl_lg,
                t.atoms.bg,
                t.atoms.border_contrast_low,
            ], children: [_jsx(EarthIcon, {}), _jsx(View, { style: [a.flex_1], children: _jsx(Text, { style: [
                            a.leading_snug,
                            {
                                maxWidth: 400,
                            },
                        ], children: label }) }), _jsx(Button, { size: "small", color: "secondary", onPress: function () { return onAccept(value); }, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Accept this language suggestion"], ["Accept this language suggestion"])))), children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Yes" }) }) })] }) }));
}
/**
 * This function is using the lande language model to attempt to detect the language
 * We want to only make suggestions when we feel a high degree of certainty
 * The magic numbers are based on debugging sessions against some test strings
 */
function guessLanguage(text) {
    var scores = lande(text).filter(function (_a) {
        var _lang = _a[0], value = _a[1];
        return value >= 0.0002;
    });
    // if the model has multiple items with a score higher than 0.0002, it isn't certain enough
    if (scores.length !== 1) {
        return undefined;
    }
    var _a = scores[0], lang = _a[0], value = _a[1];
    // if the model doesn't give a score of 0.97 or above, it isn't certain enough
    if (value < 0.97) {
        return undefined;
    }
    return code3ToCode2Strict(lang);
}
function cleanUpLanguage(text) {
    var _a;
    if (!text) {
        return undefined;
    }
    return (_a = parseLanguage(text)) === null || _a === void 0 ? void 0 : _a.language;
}
var templateObject_1;
