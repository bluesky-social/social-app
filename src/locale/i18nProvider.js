import { jsx as _jsx } from "react/jsx-runtime";
import { i18n } from '@lingui/core';
import { I18nProvider as DefaultI18nProvider } from '@lingui/react';
import { useLocaleLanguage } from './i18n';
export default function I18nProvider(_a) {
    var children = _a.children;
    useLocaleLanguage();
    return _jsx(DefaultI18nProvider, { i18n: i18n, children: children });
}
