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
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { TIMELINE_SAVED_FEED } from '#/lib/constants';
import { useAddSavedFeedsMutation } from '#/state/queries/preferences';
import { atoms as a, useTheme } from '#/alf';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
export function NoFollowingFeed(_a) {
    var onAddFeed = _a.onAddFeed;
    var t = useTheme();
    var _ = useLingui()._;
    var addSavedFeeds = useAddSavedFeedsMutation().mutateAsync;
    var addRecommendedFeeds = function (e) {
        e.preventDefault();
        addSavedFeeds([
            __assign(__assign({}, TIMELINE_SAVED_FEED), { pinned: true }),
        ]);
        onAddFeed === null || onAddFeed === void 0 ? void 0 : onAddFeed();
        // prevent navigation
        return false;
    };
    return (_jsx(View, { style: [a.flex_row, a.flex_wrap, a.align_center, a.py_md, a.px_lg], children: _jsx(Text, { style: [a.leading_snug, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["Looks like you're missing a following feed.", ' ', _jsx(InlineLinkText, { to: "#", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Add the default feed of only people you follow"], ["Add the default feed of only people you follow"])))), onPress: addRecommendedFeeds, style: [a.leading_snug], children: "Click here to add one." })] }) }) }));
}
var templateObject_1;
