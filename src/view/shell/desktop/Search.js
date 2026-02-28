var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { StackActions, useNavigation } from '@react-navigation/native';
import { usePalette } from '#/lib/hooks/usePalette';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { Link } from '#/view/com/util/Link';
import { Text } from '#/view/com/util/text/Text';
import { SearchProfileCard } from '#/screens/Search/components/SearchProfileCard';
import { atoms as a } from '#/alf';
import { SearchInput } from '#/components/forms/SearchInput';
var SearchLinkCard = function (_a) {
    var label = _a.label, to = _a.to, onPress = _a.onPress, style = _a.style;
    var pal = usePalette('default');
    var inner = (_jsx(View, { style: [pal.border, { paddingVertical: 16, paddingHorizontal: 12 }, style], children: _jsx(Text, { type: "md", style: [pal.text], children: label }) }));
    if (onPress) {
        return (_jsx(TouchableOpacity, { onPress: onPress, accessibilityLabel: label, accessibilityHint: "", children: inner }));
    }
    return (_jsx(Link, { href: to, asAnchor: true, anchorNoUnderline: true, children: _jsx(View, { style: [
                pal.border,
                { paddingVertical: 16, paddingHorizontal: 12 },
                style,
            ], children: _jsx(Text, { type: "md", style: [pal.text], children: label }) }) }));
};
SearchLinkCard = React.memo(SearchLinkCard);
export { SearchLinkCard };
export function DesktopSearch() {
    var _a;
    var _ = useLingui()._;
    var pal = usePalette('default');
    var navigation = useNavigation();
    var _b = React.useState(false), isActive = _b[0], setIsActive = _b[1];
    var _c = React.useState(''), query = _c[0], setQuery = _c[1];
    var _d = useActorAutocompleteQuery(query, true), autocompleteData = _d.data, isFetching = _d.isFetching;
    var moderationOpts = useModerationOpts();
    var onChangeText = React.useCallback(function (text) {
        setQuery(text);
        setIsActive(text.length > 0);
    }, []);
    var onPressCancelSearch = React.useCallback(function () {
        setQuery('');
        setIsActive(false);
    }, [setQuery]);
    var onSubmit = React.useCallback(function () {
        setIsActive(false);
        if (!query.length)
            return;
        navigation.dispatch(StackActions.push('Search', { q: query }));
    }, [query, navigation]);
    var onSearchProfileCardPress = React.useCallback(function () {
        setQuery('');
        setIsActive(false);
    }, []);
    return (_jsxs(View, { style: [styles.container, pal.view], children: [_jsx(SearchInput, { value: query, onChangeText: onChangeText, onClearText: onPressCancelSearch, onSubmitEditing: onSubmit }), query !== '' && isActive && moderationOpts && (_jsx(View, { style: [
                    pal.view,
                    pal.borderDark,
                    styles.resultsContainer,
                    a.overflow_hidden,
                ], children: isFetching && !(autocompleteData === null || autocompleteData === void 0 ? void 0 : autocompleteData.length) ? (_jsx(View, { style: { padding: 8 }, children: _jsx(ActivityIndicator, {}) })) : (_jsxs(_Fragment, { children: [_jsx(SearchLinkCard, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Search for \"", "\""], ["Search for \"", "\""])), query)), to: "/search?q=".concat(encodeURIComponent(query)), style: ((_a = autocompleteData === null || autocompleteData === void 0 ? void 0 : autocompleteData.length) !== null && _a !== void 0 ? _a : 0) > 0
                                ? { borderBottomWidth: 1 }
                                : undefined }), autocompleteData === null || autocompleteData === void 0 ? void 0 : autocompleteData.map(function (item) { return (_jsx(SearchProfileCard, { profile: item, moderationOpts: moderationOpts, onPress: onSearchProfileCardPress }, item.did)); })] })) }))] }));
}
var styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: '100%',
    },
    resultsContainer: {
        marginTop: 10,
        flexDirection: 'column',
        width: '100%',
        borderWidth: 1,
        borderRadius: 6,
    },
});
var templateObject_1;
