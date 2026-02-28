var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { SearchLinkCard } from '#/view/shell/desktop/Search';
import { SearchProfileCard } from '#/screens/Search/components/SearchProfileCard';
import { atoms as a, native } from '#/alf';
import * as Layout from '#/components/Layout';
import { IS_NATIVE } from '#/env';
var AutocompleteResults = function (_a) {
    var isAutocompleteFetching = _a.isAutocompleteFetching, autocompleteData = _a.autocompleteData, searchText = _a.searchText, onSubmit = _a.onSubmit, onResultPress = _a.onResultPress, onProfileClick = _a.onProfileClick;
    var _ = useLingui()._;
    var moderationOpts = useModerationOpts();
    return (_jsx(_Fragment, { children: (isAutocompleteFetching && !(autocompleteData === null || autocompleteData === void 0 ? void 0 : autocompleteData.length)) ||
            !moderationOpts ? (_jsx(Layout.Content, { children: _jsx(View, { style: [a.py_xl], children: _jsx(ActivityIndicator, {}) }) })) : (_jsxs(Layout.Content, { keyboardShouldPersistTaps: "handled", keyboardDismissMode: "on-drag", children: [_jsx(SearchLinkCard, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Search for \"", "\""], ["Search for \"", "\""])), searchText)), onPress: native(onSubmit), to: IS_NATIVE
                        ? undefined
                        : "/search?q=".concat(encodeURIComponent(searchText)), style: a.border_b }), autocompleteData === null || autocompleteData === void 0 ? void 0 : autocompleteData.map(function (item) { return (_jsx(SearchProfileCard, { profile: item, moderationOpts: moderationOpts, onPress: function () {
                        onProfileClick(item);
                        onResultPress();
                    } }, item.did)); }), _jsx(View, { style: { height: 200 } })] })) }));
};
AutocompleteResults = memo(AutocompleteResults);
export { AutocompleteResults };
var templateObject_1;
