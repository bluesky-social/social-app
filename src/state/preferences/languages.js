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
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
import { AnalyticsContext, utils } from '#/analytics';
var stateContext = React.createContext(persisted.defaults.languagePrefs);
stateContext.displayName = 'LanguagePrefsStateContext';
var apiContext = React.createContext({
    setPrimaryLanguage: function (_) { },
    setPostLanguage: function (_) { },
    setContentLanguage: function (_) { },
    toggleContentLanguage: function (_) { },
    togglePostLanguage: function (_) { },
    savePostLanguageToHistory: function () { },
    setAppLanguage: function (_) { },
});
apiContext.displayName = 'LanguagePrefsApiContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(persisted.get('languagePrefs')), state = _b[0], setState = _b[1];
    var setStateWrapped = React.useCallback(function (fn) {
        var s = fn(persisted.get('languagePrefs'));
        setState(s);
        persisted.write('languagePrefs', s);
    }, [setState]);
    React.useEffect(function () {
        return persisted.onUpdate('languagePrefs', function (nextLanguagePrefs) {
            setState(nextLanguagePrefs);
        });
    }, [setStateWrapped]);
    var api = React.useMemo(function () { return ({
        setPrimaryLanguage: function (code2) {
            setStateWrapped(function (s) { return (__assign(__assign({}, s), { primaryLanguage: code2 })); });
        },
        setPostLanguage: function (commaSeparatedLangCodes) {
            setStateWrapped(function (s) { return (__assign(__assign({}, s), { postLanguage: commaSeparatedLangCodes })); });
        },
        setContentLanguage: function (code2) {
            setStateWrapped(function (s) { return (__assign(__assign({}, s), { contentLanguages: [code2] })); });
        },
        toggleContentLanguage: function (code2) {
            setStateWrapped(function (s) {
                var exists = s.contentLanguages.includes(code2);
                var next = exists
                    ? s.contentLanguages.filter(function (lang) { return lang !== code2; })
                    : s.contentLanguages.concat(code2);
                return __assign(__assign({}, s), { contentLanguages: next });
            });
        },
        togglePostLanguage: function (code2) {
            setStateWrapped(function (s) {
                var exists = hasPostLanguage(state.postLanguage, code2);
                var next = s.postLanguage;
                if (exists) {
                    next = toPostLanguages(s.postLanguage)
                        .filter(function (lang) { return lang !== code2; })
                        .join(',');
                }
                else {
                    // sort alphabetically for deterministic comparison in context menu
                    next = toPostLanguages(s.postLanguage)
                        .concat([code2])
                        .sort(function (a, b) { return a.localeCompare(b); })
                        .join(',');
                }
                return __assign(__assign({}, s), { postLanguage: next });
            });
        },
        /**
         * Saves whatever language codes are currently selected into a history array,
         * which is then used to populate the language selector menu.
         */
        savePostLanguageToHistory: function () {
            // filter out duplicate `this.postLanguage` if exists, and prepend
            // value to start of array
            setStateWrapped(function (s) { return (__assign(__assign({}, s), { postLanguageHistory: [s.postLanguage]
                    .concat(s.postLanguageHistory.filter(function (commaSeparatedLangCodes) {
                    return commaSeparatedLangCodes !== s.postLanguage;
                }))
                    .slice(0, 6) })); });
        },
        setAppLanguage: function (code2) {
            setStateWrapped(function (s) { return (__assign(__assign({}, s), { appLanguage: code2 })); });
        },
    }); }, [state, setStateWrapped]);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(apiContext.Provider, { value: api, children: _jsx(AnalyticsContext, { metadata: utils.useMeta({
                    preferences: {
                        appLanguage: state.appLanguage,
                        contentLanguages: state.contentLanguages,
                    },
                }), children: children }) }) }));
}
export function useLanguagePrefs() {
    return React.useContext(stateContext);
}
export function useLanguagePrefsApi() {
    return React.useContext(apiContext);
}
export function getContentLanguages() {
    return persisted.get('languagePrefs').contentLanguages;
}
/**
 * Be careful with this. It's used for the PWI home screen so that users can
 * select a UI language and have it apply to the fetched Discover feed.
 *
 * We only support BCP-47 two-letter codes here, hence the split.
 */
export function getAppLanguageAsContentLanguage() {
    return persisted.get('languagePrefs').appLanguage.split('-')[0];
}
export function toPostLanguages(postLanguage) {
    // filter out empty strings if exist
    return postLanguage.split(',').filter(Boolean);
}
export function fromPostLanguages(languages) {
    return languages.filter(Boolean).join(',');
}
export function hasPostLanguage(postLanguage, code2) {
    return toPostLanguages(postLanguage).includes(code2);
}
