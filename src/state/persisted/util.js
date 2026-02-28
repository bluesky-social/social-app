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
import { parse } from 'bcp-47';
import { dedupArray } from '#/lib/functions';
import { logger } from '#/logger';
export function normalizeData(data) {
    var next = __assign({}, data);
    /**
     * Normalize language prefs to ensure that these values only contain 2-letter
     * country codes without region.
     */
    try {
        var langPrefs = __assign({}, next.languagePrefs);
        langPrefs.primaryLanguage = normalizeLanguageTagToTwoLetterCode(langPrefs.primaryLanguage);
        langPrefs.contentLanguages = dedupArray(langPrefs.contentLanguages.map(function (lang) {
            return normalizeLanguageTagToTwoLetterCode(lang);
        }));
        langPrefs.postLanguage = langPrefs.postLanguage
            .split(',')
            .map(function (lang) { return normalizeLanguageTagToTwoLetterCode(lang); })
            .filter(Boolean)
            .join(',');
        langPrefs.postLanguageHistory = dedupArray(langPrefs.postLanguageHistory.map(function (postLanguage) {
            return postLanguage
                .split(',')
                .map(function (lang) { return normalizeLanguageTagToTwoLetterCode(lang); })
                .filter(Boolean)
                .join(',');
        }));
        next.languagePrefs = langPrefs;
    }
    catch (e) {
        logger.error("persisted state: failed to normalize language prefs", {
            safeMessage: e.message,
        });
    }
    return next;
}
export function normalizeLanguageTagToTwoLetterCode(lang) {
    var result = parse(lang).language;
    return result !== null && result !== void 0 ? result : lang;
}
