import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { i18n } from '@lingui/core';
import { I18nProvider as DefaultI18nProvider } from '@lingui/react';
import { useLocaleLanguage } from './i18n';
var DateLocaleContext = createContext(undefined);
DateLocaleContext.displayName = 'DateLocaleContext';
export default function I18nProvider(_a) {
    var children = _a.children;
    var dateLocale = useLocaleLanguage();
    return (_jsx(DateLocaleContext, { value: dateLocale, children: _jsx(DefaultI18nProvider, { i18n: i18n, children: children }) }));
}
/**
 * Returns a `date-fns` locale corresponding to the current app language
 */
export function useDateLocale() {
    var ctx = useContext(DateLocaleContext);
    if (!ctx) {
        throw new Error('useDateLocale must be used within an I18nProvider');
    }
    return ctx;
}
