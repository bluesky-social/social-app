var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { makeProfileLink } from '#/lib/routes/links';
import { formatCount } from '#/view/com/util/numeric/format';
import { atoms as a, useTheme } from '#/alf';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
export function ProfileHeaderMetrics(_a) {
    var profile = _a.profile;
    var t = useTheme();
    var _b = useLingui(), _ = _b._, i18n = _b.i18n;
    var following = formatCount(i18n, profile.followsCount || 0);
    var followers = formatCount(i18n, profile.followersCount || 0);
    var pluralizedFollowers = plural(profile.followersCount || 0, {
        one: 'follower',
        other: 'followers',
    });
    var pluralizedFollowings = plural(profile.followsCount || 0, {
        one: 'following',
        other: 'following',
    });
    return (_jsxs(View, { style: [a.flex_row, a.gap_sm, a.align_center], pointerEvents: "box-none", children: [_jsxs(InlineLinkText, { testID: "profileHeaderFollowersButton", style: [a.flex_row, t.atoms.text], to: makeProfileLink(profile, 'followers'), label: "".concat(profile.followersCount || 0, " ").concat(pluralizedFollowers), children: [_jsxs(Text, { style: [a.font_semi_bold, a.text_md], children: [followers, " "] }), _jsx(Text, { style: [t.atoms.text_contrast_medium, a.text_md], children: pluralizedFollowers })] }), _jsxs(InlineLinkText, { testID: "profileHeaderFollowsButton", style: [a.flex_row, t.atoms.text], to: makeProfileLink(profile, 'follows'), label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " following"], ["", " following"])), profile.followsCount || 0)), children: [_jsxs(Text, { style: [a.font_semi_bold, a.text_md], children: [following, " "] }), _jsx(Text, { style: [t.atoms.text_contrast_medium, a.text_md], children: pluralizedFollowings })] }), _jsxs(Text, { style: [a.font_semi_bold, t.atoms.text, a.text_md], children: [formatCount(i18n, profile.postsCount || 0), ' ', _jsx(Text, { style: [t.atoms.text_contrast_medium, a.font_normal, a.text_md], children: plural(profile.postsCount || 0, { one: 'post', other: 'posts' }) })] })] }));
}
var templateObject_1;
