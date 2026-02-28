var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { makeProfileLink } from '#/lib/routes/links';
import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';
import { atoms as a, useTheme } from '#/alf';
import { Link } from '#/components/Link';
import * as ProfileCard from '#/components/ProfileCard';
export function SearchProfileCard(_a) {
    var profile = _a.profile, moderationOpts = _a.moderationOpts, onPressInner = _a.onPress;
    var t = useTheme();
    var _ = useLingui()._;
    var qc = useQueryClient();
    var onPress = useCallback(function () {
        unstableCacheProfileView(qc, profile);
        onPressInner === null || onPressInner === void 0 ? void 0 : onPressInner();
    }, [qc, profile, onPressInner]);
    return (_jsx(Link, { testID: "searchAutoCompleteResult-".concat(profile.handle), to: makeProfileLink(profile), label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View ", "'s profile"], ["View ", "'s profile"])), profile.handle)), onPress: onPress, children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsx(View, { style: [
                    a.flex_1,
                    a.px_md,
                    a.py_sm,
                    (hovered || pressed) && t.atoms.bg_contrast_25,
                ], children: _jsx(ProfileCard.Outer, { children: _jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts }), _jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts })] }) }) }));
        } }));
}
var templateObject_1;
