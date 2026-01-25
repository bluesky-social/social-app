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
import { Trans } from '@lingui/macro';
import { DISCOVER_FEED_URI } from '#/lib/constants';
import { useA11y } from '#/state/a11y';
import { useGetPopularFeedsQuery, usePopularFeedsSearch, useSavedFeeds, } from '#/state/queries/feed';
import { List } from '#/view/com/util/List';
import { useWizardState } from '#/screens/StarterPack/Wizard/State';
import { atoms as a, useTheme } from '#/alf';
import { SearchInput } from '#/components/forms/SearchInput';
import { useThrottledValue } from '#/components/hooks/useThrottledValue';
import { Loader } from '#/components/Loader';
import { ScreenTransition } from '#/components/ScreenTransition';
import { WizardFeedCard } from '#/components/StarterPack/Wizard/WizardListCard';
import { Text } from '#/components/Typography';
function keyExtractor(item) {
    return item.uri;
}
export function StepFeeds(_a) {
    var _b;
    var moderationOpts = _a.moderationOpts;
    var t = useTheme();
    var _c = useWizardState(), state = _c[0], dispatch = _c[1];
    var _d = useState(''), query = _d[0], setQuery = _d[1];
    var throttledQuery = useThrottledValue(query, 500);
    var screenReaderEnabled = useA11y().screenReaderEnabled;
    var _e = useSavedFeeds(), savedFeedsAndLists = _e.data, isFetchedSavedFeeds = _e.isFetchedAfterMount;
    var savedFeeds = savedFeedsAndLists === null || savedFeedsAndLists === void 0 ? void 0 : savedFeedsAndLists.feeds.filter(function (f) { return f.type === 'feed' && f.view.uri !== DISCOVER_FEED_URI; }).map(function (f) { return f.view; });
    var _f = useGetPopularFeedsQuery({
        limit: 30,
    }), popularFeedsPages = _f.data, fetchNextPage = _f.fetchNextPage, isLoadingPopularFeeds = _f.isLoading;
    var popularFeeds = (_b = popularFeedsPages === null || popularFeedsPages === void 0 ? void 0 : popularFeedsPages.pages.flatMap(function (p) { return p.feeds; })) !== null && _b !== void 0 ? _b : [];
    // If we have saved feeds already loaded, display them immediately
    // Then, when popular feeds have loaded we can concat them to the saved feeds
    var suggestedFeeds = savedFeeds || isFetchedSavedFeeds
        ? popularFeeds
            ? savedFeeds.concat(popularFeeds.filter(function (f) { return !savedFeeds.some(function (sf) { return sf.uri === f.uri; }); }))
            : savedFeeds
        : undefined;
    var _g = usePopularFeedsSearch({ query: throttledQuery }), searchedFeeds = _g.data, isFetchingSearchedFeeds = _g.isFetching;
    var isLoading = !isFetchedSavedFeeds || isLoadingPopularFeeds || isFetchingSearchedFeeds;
    var renderItem = function (_a) {
        var item = _a.item;
        return (_jsx(WizardFeedCard, { generator: item, btnType: "checkbox", state: state, dispatch: dispatch, moderationOpts: moderationOpts }));
    };
    return (_jsxs(ScreenTransition, { style: [a.flex_1], direction: state.transitionDirection, enabledWeb: true, children: [_jsx(View, { style: [a.border_b, t.atoms.border_contrast_medium], children: _jsx(View, { style: [a.py_sm, a.px_md, { height: 60 }], children: _jsx(SearchInput, { value: query, onChangeText: function (t) { return setQuery(t); }, onClearText: function () { return setQuery(''); } }) }) }), _jsx(List, { data: query ? searchedFeeds : suggestedFeeds, renderItem: renderItem, keyExtractor: keyExtractor, onEndReached: !query && !screenReaderEnabled ? function () { return fetchNextPage(); } : undefined, onEndReachedThreshold: 2, keyboardDismissMode: "on-drag", renderScrollComponent: function (props) { return _jsx(KeyboardAwareScrollView, __assign({}, props)); }, keyboardShouldPersistTaps: "handled", disableFullWindowScroll: true, sideBorders: false, style: { flex: 1 }, ListEmptyComponent: _jsx(View, { style: [a.flex_1, a.align_center, a.mt_lg, a.px_lg], children: isLoading ? (_jsx(Loader, { size: "lg" })) : (_jsx(Text, { style: [
                            a.font_semi_bold,
                            a.text_lg,
                            a.text_center,
                            a.mt_lg,
                            a.leading_snug,
                        ], children: _jsx(Trans, { children: "No feeds found. Try searching for something else." }) })) }) })] }));
}
