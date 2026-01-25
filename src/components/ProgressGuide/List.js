var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useSession } from '#/state/session';
import { useProgressGuide, useProgressGuideControls, } from '#/state/shell/progress-guide';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useBreakpoints, useLayoutBreakpoints, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { Person_Stroke2_Corner2_Rounded as PersonIcon } from '#/components/icons/Person';
import { TimesLarge_Stroke2_Corner0_Rounded as Times } from '#/components/icons/Times';
import { Text } from '#/components/Typography';
import { FollowDialog } from './FollowDialog';
import { ProgressGuideTask } from './Task';
var TOTAL_AVATARS = 10;
export function ProgressGuideList(_a) {
    var _b, _c, _d, _e, _f, _g;
    var style = _a.style;
    var t = useTheme();
    var _ = useLingui()._;
    var gtPhone = useBreakpoints().gtPhone;
    var rightNavVisible = useLayoutBreakpoints().rightNavVisible;
    var currentAccount = useSession().currentAccount;
    var followProgressGuide = useProgressGuide('follow-10');
    var followAndLikeProgressGuide = useProgressGuide('like-10-and-follow-7');
    var guide = followProgressGuide || followAndLikeProgressGuide;
    var endProgressGuide = useProgressGuideControls().endProgressGuide;
    var follows = useProfileFollowsQuery(currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did, {
        limit: TOTAL_AVATARS,
    }).data;
    var actualFollowsCount = (_e = (_d = (_c = (_b = follows === null || follows === void 0 ? void 0 : follows.pages) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.follows) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0 ? _e : 0;
    // Hide if user already follows 10+ people
    if ((guide === null || guide === void 0 ? void 0 : guide.guide) === 'follow-10' && actualFollowsCount >= TOTAL_AVATARS) {
        return null;
    }
    // Inline layout when left nav visible but no right sidebar (800-1100px)
    var inlineLayout = gtPhone && !rightNavVisible;
    if (guide) {
        return (_jsxs(View, { style: [
                a.flex_col,
                a.gap_md,
                a.rounded_md,
                t.atoms.bg_contrast_25,
                a.p_lg,
                style,
            ], children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.justify_between], children: [_jsx(Text, { style: [t.atoms.text, a.font_semi_bold, a.text_md], children: _jsx(Trans, { children: "Follow 10 people to get started" }) }), _jsx(Button, { variant: "ghost", size: "tiny", color: "secondary", shape: "round", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Dismiss getting started guide"], ["Dismiss getting started guide"])))), onPress: endProgressGuide, style: [a.bg_transparent, { marginTop: -6, marginRight: -6 }], children: _jsx(ButtonIcon, { icon: Times, size: "xs" }) })] }), guide.guide === 'follow-10' && (_jsxs(View, { style: [
                        inlineLayout
                            ? [
                                a.flex_row,
                                a.flex_wrap,
                                a.align_center,
                                a.justify_between,
                                a.gap_sm,
                            ]
                            : a.flex_col,
                        !inlineLayout && a.gap_md,
                    ], children: [_jsx(StackedAvatars, { follows: (_g = (_f = follows === null || follows === void 0 ? void 0 : follows.pages) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.follows }), _jsx(FollowDialog, { guide: guide, showArrow: inlineLayout })] })), guide.guide === 'like-10-and-follow-7' && (_jsxs(_Fragment, { children: [_jsx(ProgressGuideTask, { current: guide.numLikes + 1, total: 10 + 1, title: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Like 10 posts"], ["Like 10 posts"])))), subtitle: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Teach our algorithm what you like"], ["Teach our algorithm what you like"])))) }), _jsx(ProgressGuideTask, { current: guide.numFollows + 1, total: 7 + 1, title: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Follow 7 accounts"], ["Follow 7 accounts"])))), subtitle: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Bluesky is better with friends!"], ["Bluesky is better with friends!"])))) })] }))] }));
    }
    return null;
}
function StackedAvatars(_a) {
    var _b;
    var follows = _a.follows;
    var t = useTheme();
    var centerColumnOffset = useLayoutBreakpoints().centerColumnOffset;
    // Smaller avatars for narrower viewport
    var avatarSize = centerColumnOffset ? 30 : 37;
    var overlap = centerColumnOffset ? 9 : 11;
    var iconSize = centerColumnOffset ? 14 : 18;
    // Use actual follows count, not the guide's event counter
    var followedAvatars = (_b = follows === null || follows === void 0 ? void 0 : follows.slice(0, TOTAL_AVATARS)) !== null && _b !== void 0 ? _b : [];
    var remainingSlots = TOTAL_AVATARS - followedAvatars.length;
    // Total width calculation: first avatar + (remaining * visible portion)
    var totalWidth = avatarSize + (TOTAL_AVATARS - 1) * (avatarSize - overlap);
    return (_jsxs(View, { style: [a.flex_row, a.self_start, { width: totalWidth }], children: [followedAvatars.map(function (follow, i) { return (_jsx(View, { style: [
                    a.rounded_full,
                    {
                        marginLeft: i === 0 ? 0 : -overlap,
                        zIndex: TOTAL_AVATARS - i,
                        borderWidth: 2,
                        borderColor: t.atoms.bg_contrast_25.backgroundColor,
                    },
                ], children: _jsx(UserAvatar, { type: "user", size: avatarSize - 4, avatar: follow.avatar }) }, follow.did)); }), Array(remainingSlots)
                .fill(0)
                .map(function (_, i) { return (_jsx(View, { style: [
                    a.align_center,
                    a.justify_center,
                    a.rounded_full,
                    t.atoms.bg_contrast_100,
                    {
                        width: avatarSize,
                        height: avatarSize,
                        marginLeft: followedAvatars.length === 0 && i === 0 ? 0 : -overlap,
                        zIndex: TOTAL_AVATARS - followedAvatars.length - i,
                        borderWidth: 2,
                        borderColor: t.atoms.bg_contrast_25.backgroundColor,
                    },
                ], children: _jsx(PersonIcon, { width: iconSize, height: iconSize, fill: t.atoms.text_contrast_low.color }) }, "placeholder-".concat(i))); })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
