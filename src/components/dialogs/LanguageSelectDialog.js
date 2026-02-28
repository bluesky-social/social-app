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
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { LANGUAGES, LANGUAGES_MAP_CODE2 } from '#/locale/languages';
import { useLanguagePrefs } from '#/state/preferences/languages';
import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';
import { atoms as a, tokens, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { SearchInput } from '#/components/forms/SearchInput';
import * as Toggle from '#/components/forms/Toggle';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Typography';
import { IS_LIQUID_GLASS, IS_NATIVE, IS_WEB } from '#/env';
export function LanguageSelectDialog(_a) {
    var titleText = _a.titleText, subtitleText = _a.subtitleText, control = _a.control, 
    /**
     * Optionally can be passed to show different values than what is saved in
     * langPrefs.
     */
    currentLanguages = _a.currentLanguages, onSelectLanguages = _a.onSelectLanguages, maxLanguages = _a.maxLanguages;
    var height = useWindowDimensions().height;
    var insets = useSafeAreaInsets();
    var renderErrorBoundary = useCallback(function (error) { return _jsx(DialogError, { details: String(error) }); }, []);
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: {
            minHeight: IS_LIQUID_GLASS ? height : height - insets.top,
        }, children: [_jsx(Dialog.Handle, {}), _jsx(ErrorBoundary, { renderError: renderErrorBoundary, children: _jsx(DialogInner, { titleText: titleText, subtitleText: subtitleText, currentLanguages: currentLanguages, onSelectLanguages: onSelectLanguages, maxLanguages: maxLanguages }) })] }));
}
export function DialogInner(_a) {
    var titleText = _a.titleText, subtitleText = _a.subtitleText, currentLanguages = _a.currentLanguages, onSelectLanguages = _a.onSelectLanguages, maxLanguages = _a.maxLanguages;
    var control = Dialog.useDialogContext();
    var _b = useState(0), headerHeight = _b[0], setHeaderHeight = _b[1];
    var _c = useState(0), footerHeight = _c[0], setFooterHeight = _c[1];
    var allowedLanguages = useMemo(function () {
        var uniqueLanguagesMap = LANGUAGES.filter(function (lang) { return !!lang.code2; }).reduce(function (acc, lang) {
            acc[lang.code2] = lang;
            return acc;
        }, {});
        return Object.values(uniqueLanguagesMap);
    }, []);
    var langPrefs = useLanguagePrefs();
    var _d = useState(currentLanguages || [langPrefs.primaryLanguage]), checkedLanguagesCode2 = _d[0], setCheckedLanguagesCode2 = _d[1];
    var _e = useState(''), search = _e[0], setSearch = _e[1];
    var t = useTheme();
    var _ = useLingui()._;
    var handleClose = function () {
        control.close(function () {
            onSelectLanguages === null || onSelectLanguages === void 0 ? void 0 : onSelectLanguages(checkedLanguagesCode2);
        });
    };
    // NOTE(@elijaharita): Displayed languages are split into 3 lists for
    // ordering.
    var displayedLanguages = useMemo(function () {
        function mapCode2List(code2List) {
            return code2List.map(function (code2) { return LANGUAGES_MAP_CODE2[code2]; }).filter(Boolean);
        }
        // NOTE(@elijaharita): Get recent language codes and map them to language
        // objects. Both the user account's saved language history and the current
        // checked languages are displayed here.
        var recentLanguagesCode2 = Array.from(new Set(__spreadArray(__spreadArray([], checkedLanguagesCode2, true), langPrefs.postLanguageHistory, true))).slice(0, 5) || [];
        var recentLanguages = mapCode2List(recentLanguagesCode2);
        // NOTE(@elijaharita): helper functions
        var matchesSearch = function (lang) {
            return lang.name.toLowerCase().includes(search.toLowerCase());
        };
        var isChecked = function (lang) {
            return checkedLanguagesCode2.includes(lang.code2);
        };
        var isInRecents = function (lang) {
            return recentLanguagesCode2.includes(lang.code2);
        };
        var checkedRecent = recentLanguages.filter(isChecked);
        if (search) {
            // NOTE(@elijaharita): if a search is active, we ALWAYS show checked
            // items, as well as any items that match the search.
            var uncheckedRecent = recentLanguages
                .filter(function (lang) { return !isChecked(lang); })
                .filter(matchesSearch);
            var unchecked = allowedLanguages.filter(function (lang) { return !isChecked(lang); });
            var all = unchecked
                .filter(matchesSearch)
                .filter(function (lang) { return !isInRecents(lang); });
            return {
                all: all,
                checkedRecent: checkedRecent,
                uncheckedRecent: uncheckedRecent,
            };
        }
        else {
            // NOTE(@elijaharita): if no search is active, we show everything.
            var uncheckedRecent = recentLanguages.filter(function (lang) { return !isChecked(lang); });
            var all = allowedLanguages
                .filter(function (lang) { return !recentLanguagesCode2.includes(lang.code2); })
                .filter(function (lang) { return !isInRecents(lang); });
            return {
                all: all,
                checkedRecent: checkedRecent,
                uncheckedRecent: uncheckedRecent,
            };
        }
    }, [
        allowedLanguages,
        search,
        langPrefs.postLanguageHistory,
        checkedLanguagesCode2,
    ]);
    var listHeader = (_jsxs(View, { style: [a.pb_xs, t.atoms.bg, IS_NATIVE && a.pt_2xl], onLayout: function (evt) { return setHeaderHeight(evt.nativeEvent.layout.height); }, children: [_jsxs(View, { style: [a.flex_row, a.w_full, a.justify_between], children: [_jsxs(View, { children: [_jsx(Text, { nativeID: "dialog-title", style: [
                                    t.atoms.text,
                                    a.text_left,
                                    a.font_semi_bold,
                                    a.text_xl,
                                    a.mb_sm,
                                ], children: titleText !== null && titleText !== void 0 ? titleText : _jsx(Trans, { children: "Choose languages" }) }), subtitleText && (_jsx(Text, { nativeID: "dialog-description", style: [
                                    t.atoms.text_contrast_medium,
                                    a.text_left,
                                    a.text_md,
                                    a.mb_lg,
                                ], children: subtitleText }))] }), IS_WEB && (_jsx(Button, { variant: "ghost", size: "small", color: "secondary", shape: "round", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close dialog"], ["Close dialog"])))), onPress: handleClose, children: _jsx(ButtonIcon, { icon: XIcon }) }))] }), _jsx(View, { style: [a.w_full, a.flex_row, a.align_stretch, a.gap_xs, a.pb_0], children: _jsx(SearchInput, { value: search, onChangeText: setSearch, placeholder: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Search languages"], ["Search languages"])))), label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Search languages"], ["Search languages"])))), maxLength: 50, onClearText: function () { return setSearch(''); } }) })] }));
    var isCheckedRecentEmpty = displayedLanguages.checkedRecent.length > 0 ||
        displayedLanguages.uncheckedRecent.length > 0;
    var isDisplayedLanguagesEmpty = displayedLanguages.all.length === 0;
    var flatListData = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], (isCheckedRecentEmpty
        ? [{ type: 'header', label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Recently used"], ["Recently used"])))) }]
        : []), true), displayedLanguages.checkedRecent.map(function (lang) { return ({ type: 'item', lang: lang }); }), true), displayedLanguages.uncheckedRecent.map(function (lang) { return ({ type: 'item', lang: lang }); }), true), (isDisplayedLanguagesEmpty
        ? []
        : [{ type: 'header', label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["All languages"], ["All languages"])))) }]), true), displayedLanguages.all.map(function (lang) { return ({ type: 'item', lang: lang }); }), true);
    var numItems = flatListData.length;
    return (_jsx(Toggle.Group, { values: checkedLanguagesCode2, onChange: setCheckedLanguagesCode2, type: "checkbox", maxSelections: maxLanguages, label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Select languages"], ["Select languages"])))), style: web([a.contents]), children: _jsx(Dialog.InnerFlatList, { data: flatListData, ListHeaderComponent: listHeader, stickyHeaderIndices: [0], contentContainerStyle: [
                a.gap_0,
                IS_NATIVE && { paddingBottom: footerHeight + tokens.space.xl },
            ], style: [IS_NATIVE && a.px_lg, IS_WEB && { paddingBottom: 120 }], scrollIndicatorInsets: { top: headerHeight, bottom: footerHeight }, renderItem: function (_a) {
                var item = _a.item, index = _a.index;
                if (item.type === 'header') {
                    return (_jsx(Text, { style: [
                            a.px_0,
                            a.py_md,
                            a.font_semi_bold,
                            a.text_xs,
                            t.atoms.text_contrast_low,
                            a.pt_3xl,
                        ], children: item.label }, index));
                }
                var lang = item.lang;
                var isLastItem = index === numItems - 1;
                return (_jsxs(Toggle.Item, { name: lang.code2, label: lang.name, style: [
                        t.atoms.border_contrast_low,
                        !isLastItem && a.border_b,
                        a.rounded_0,
                        a.px_0,
                        a.py_md,
                    ], children: [_jsx(Toggle.LabelText, { style: [a.flex_1], children: lang.name }), _jsx(Toggle.Checkbox, {})] }, lang.code2));
            }, footer: _jsx(Dialog.FlatListFooter, { onLayout: function (evt) { return setFooterHeight(evt.nativeEvent.layout.height); }, children: _jsx(Button, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Close dialog"], ["Close dialog"])))), onPress: handleClose, color: "primary", size: "large", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Done" }) }) }) }) }) }));
}
function DialogError(_a) {
    var details = _a.details;
    var _ = useLingui()._;
    var control = Dialog.useDialogContext();
    return (_jsxs(Dialog.ScrollableInner, { style: a.gap_md, label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["An error has occurred"], ["An error has occurred"])))), children: [_jsx(Dialog.Close, {}), _jsx(ErrorScreen, { title: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Oh no!"], ["Oh no!"])))), message: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["There was an unexpected issue in the application. Please let us know if this happened to you!"], ["There was an unexpected issue in the application. Please let us know if this happened to you!"])))), details: details }), _jsx(Button, { label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Close dialog"], ["Close dialog"])))), onPress: function () { return control.close(); }, color: "primary", size: "large", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11;
