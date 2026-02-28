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
import { useState } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Trans } from '@lingui/react/macro';
import { useA11y } from '#/state/a11y';
import { useActorAutocompleteQuery } from '#/state/queries/actor-autocomplete';
import { useActorSearch } from '#/state/queries/actor-search';
import { List } from '#/view/com/util/List';
import { useWizardState } from '#/screens/StarterPack/Wizard/State';
import { atoms as a, useTheme } from '#/alf';
import { SearchInput } from '#/components/forms/SearchInput';
import { Loader } from '#/components/Loader';
import { ScreenTransition } from '#/components/ScreenTransition';
import { WizardProfileCard } from '#/components/StarterPack/Wizard/WizardListCard';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
function keyExtractor(item) {
    var _a;
    return (_a = item === null || item === void 0 ? void 0 : item.did) !== null && _a !== void 0 ? _a : '';
}
export function StepProfiles(_a) {
    var moderationOpts = _a.moderationOpts;
    var t = useTheme();
    var _b = useWizardState(), state = _b[0], dispatch = _b[1];
    var _c = useState(''), query = _c[0], setQuery = _c[1];
    var screenReaderEnabled = useA11y().screenReaderEnabled;
    var _d = useActorSearch({
        query: encodeURIComponent('*'),
    }), topPages = _d.data, fetchNextPage = _d.fetchNextPage, isLoadingTopPages = _d.isLoading;
    var topFollowers = topPages === null || topPages === void 0 ? void 0 : topPages.pages.flatMap(function (p) { return p.actors; }).filter(function (p) { var _a; return !((_a = p.associated) === null || _a === void 0 ? void 0 : _a.labeler); });
    var _e = useActorAutocompleteQuery(query, true, 12), resultsUnfiltered = _e.data, isFetchingResults = _e.isFetching;
    var results = resultsUnfiltered === null || resultsUnfiltered === void 0 ? void 0 : resultsUnfiltered.filter(function (p) { var _a; return !((_a = p.associated) === null || _a === void 0 ? void 0 : _a.labeler); });
    var isLoading = isLoadingTopPages || isFetchingResults;
    var renderItem = function (_a) {
        var item = _a.item;
        return (_jsx(WizardProfileCard, { profile: item, btnType: "checkbox", state: state, dispatch: dispatch, moderationOpts: moderationOpts }));
    };
    return (_jsxs(ScreenTransition, { style: [a.flex_1], direction: state.transitionDirection, enabledWeb: true, children: [_jsx(View, { style: [a.border_b, t.atoms.border_contrast_medium], children: _jsx(View, { style: [a.py_sm, a.px_md, { height: 60 }], children: _jsx(SearchInput, { value: query, onChangeText: setQuery, onClearText: function () { return setQuery(''); } }) }) }), _jsx(List, { data: query ? results : topFollowers, renderItem: renderItem, keyExtractor: keyExtractor, renderScrollComponent: function (props) { return _jsx(KeyboardAwareScrollView, __assign({}, props)); }, keyboardShouldPersistTaps: "handled", disableFullWindowScroll: true, sideBorders: false, style: [a.flex_1], onEndReached: !query && !screenReaderEnabled ? function () { return fetchNextPage(); } : undefined, onEndReachedThreshold: IS_NATIVE ? 2 : 0.25, keyboardDismissMode: "on-drag", ListEmptyComponent: _jsx(View, { style: [a.flex_1, a.align_center, a.mt_lg, a.px_lg], children: isLoading ? (_jsx(Loader, { size: "lg" })) : (_jsx(Text, { style: [
                            a.font_semi_bold,
                            a.text_lg,
                            a.text_center,
                            a.mt_lg,
                            a.leading_snug,
                        ], children: _jsx(Trans, { children: "Nobody was found. Try searching for someone else." }) })) }) })] }));
}
