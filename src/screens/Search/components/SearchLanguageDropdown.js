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
import { useMemo } from 'react';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { languageName } from '#/locale/helpers';
import { APP_LANGUAGES, LANGUAGES } from '#/locale/languages';
import { useLanguagePrefs } from '#/state/preferences';
import { atoms as a, native, platform, tokens } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon, ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon, } from '#/components/icons/Chevron';
import { Earth_Stroke2_Corner0_Rounded as EarthIcon } from '#/components/icons/Globe';
import * as Menu from '#/components/Menu';
export function SearchLanguageDropdown(_a) {
    var _b, _c;
    var value = _a.value, onChange = _a.onChange;
    var _ = useLingui()._;
    var _d = useLanguagePrefs(), appLanguage = _d.appLanguage, contentLanguages = _d.contentLanguages;
    var languages = useMemo(function () {
        return LANGUAGES.filter(function (lang, index, self) {
            return Boolean(lang.code2) && // reduce to the code2 varieties
                index === self.findIndex(function (t) { return t.code2 === lang.code2; });
        })
            .map(function (l) { return ({
            label: languageName(l, appLanguage),
            value: l.code2,
            key: l.code2 + l.code3,
        }); })
            .sort(function (a, b) {
            // prioritize user's languages
            var aIsUser = contentLanguages.includes(a.value);
            var bIsUser = contentLanguages.includes(b.value);
            if (aIsUser && !bIsUser)
                return -1;
            if (bIsUser && !aIsUser)
                return 1;
            // prioritize "common" langs in the network
            var aIsCommon = !!APP_LANGUAGES.find(function (al) {
                // skip `ast`, because it uses a 3-letter code which conflicts with `as`
                // it begins with `a` anyway so still is top of the list
                return al.code2 !== 'ast' && al.code2.startsWith(a.value);
            });
            var bIsCommon = !!APP_LANGUAGES.find(function (al) {
                // ditto
                return al.code2 !== 'ast' && al.code2.startsWith(b.value);
            });
            if (aIsCommon && !bIsCommon)
                return -1;
            if (bIsCommon && !aIsCommon)
                return 1;
            // fall back to alphabetical
            return a.label.localeCompare(b.label);
        });
    }, [appLanguage, contentLanguages]);
    var currentLanguageLabel = (_c = (_b = languages.find(function (lang) { return lang.value === value; })) === null || _b === void 0 ? void 0 : _b.label) !== null && _c !== void 0 ? _c : _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["All languages"], ["All languages"]))));
    return (_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Filter search by language (currently: ", ")"], ["Filter search by language (currently: ", ")"])), currentLanguageLabel)), children: function (_a) {
                    var props = _a.props;
                    return (_jsxs(Button, __assign({}, props, { label: props.accessibilityLabel, size: "small", color: platform({ native: 'primary', default: 'secondary' }), variant: platform({ native: 'ghost', default: 'solid' }), style: native([
                            a.py_sm,
                            a.px_sm,
                            { marginRight: tokens.space.sm * -1 },
                        ]), children: [_jsx(ButtonIcon, { icon: EarthIcon }), _jsx(ButtonText, { children: currentLanguageLabel }), _jsx(ButtonIcon, { icon: platform({
                                    native: ChevronUpDownIcon,
                                    default: ChevronDownIcon,
                                }) })] })));
                } }), _jsxs(Menu.Outer, { children: [_jsx(Menu.LabelText, { children: _jsx(Trans, { children: "Filter search by language" }) }), _jsxs(Menu.Item, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["All languages"], ["All languages"])))), onPress: function () { return onChange(''); }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "All languages" }) }), _jsx(Menu.ItemRadio, { selected: value === '' })] }), _jsx(Menu.Divider, {}), _jsx(Menu.Group, { children: languages.map(function (lang) { return (_jsxs(Menu.Item, { label: lang.label, onPress: function () { return onChange(lang.value); }, children: [_jsx(Menu.ItemText, { children: lang.label }), _jsx(Menu.ItemRadio, { selected: value === lang.value })] }, lang.key)); }) })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
