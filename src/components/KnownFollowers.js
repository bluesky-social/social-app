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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { moderateProfile, } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Plural, Trans } from '@lingui/react/macro';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme } from '#/alf';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
var AVI_SIZE = 30;
var AVI_SIZE_SMALL = 20;
var AVI_BORDER = 1;
/**
 * Shared logic to determine if `KnownFollowers` should be shown.
 *
 * Checks the # of actual returned users instead of the `count` value, because
 * `count` includes blocked users and `followers` does not.
 */
export function shouldShowKnownFollowers(knownFollowers) {
    return knownFollowers && knownFollowers.followers.length > 0;
}
export function KnownFollowers(_a) {
    var _b;
    var profile = _a.profile, moderationOpts = _a.moderationOpts, onLinkPress = _a.onLinkPress, minimal = _a.minimal, showIfEmpty = _a.showIfEmpty;
    var cache = React.useRef(new Map());
    /*
     * Results for `knownFollowers` are not sorted consistently, so when
     * revalidating we can see a flash of this data updating. This cache prevents
     * this happening for screens that remain in memory. When pushing a new
     * screen, or once this one is popped, this cache is empty, so new data is
     * displayed.
     */
    if (((_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.knownFollowers) && !cache.current.has(profile.did)) {
        cache.current.set(profile.did, profile.viewer.knownFollowers);
    }
    var cachedKnownFollowers = cache.current.get(profile.did);
    if (cachedKnownFollowers && shouldShowKnownFollowers(cachedKnownFollowers)) {
        return (_jsx(KnownFollowersInner, { profile: profile, cachedKnownFollowers: cachedKnownFollowers, moderationOpts: moderationOpts, onLinkPress: onLinkPress, minimal: minimal, showIfEmpty: showIfEmpty }));
    }
    return _jsx(EmptyFallback, { show: showIfEmpty });
}
function KnownFollowersInner(_a) {
    var profile = _a.profile, moderationOpts = _a.moderationOpts, cachedKnownFollowers = _a.cachedKnownFollowers, onLinkPress = _a.onLinkPress, minimal = _a.minimal, showIfEmpty = _a.showIfEmpty;
    var t = useTheme();
    var _ = useLingui()._;
    var textStyle = [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium];
    var slice = cachedKnownFollowers.followers.slice(0, 3).map(function (f) {
        var moderation = moderateProfile(f, moderationOpts);
        return {
            profile: __assign(__assign({}, f), { displayName: sanitizeDisplayName(f.displayName || f.handle, moderation.ui('displayName')) }),
            moderation: moderation,
        };
    });
    // Does not have blocks applied. Always >= slices.length
    var serverCount = cachedKnownFollowers.count;
    /*
     * We check above too, but here for clarity and a reminder to _check for
     * valid indices_
     */
    if (slice.length === 0)
        return _jsx(EmptyFallback, { show: showIfEmpty });
    var SIZE = minimal ? AVI_SIZE_SMALL : AVI_SIZE;
    return (_jsx(Link, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Press to view followers of this account that you also follow"], ["Press to view followers of this account that you also follow"])))), onPress: onLinkPress, to: makeProfileLink(profile, 'known-followers'), style: [
            a.max_w_full,
            a.flex_row,
            minimal ? a.gap_sm : a.gap_md,
            a.align_center,
            { marginLeft: -AVI_BORDER },
        ], children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsxs(_Fragment, { children: [_jsx(View, { style: [
                            a.flex_row,
                            {
                                height: SIZE,
                            },
                            pressed && {
                                opacity: 0.5,
                            },
                        ], children: slice.map(function (_a, i) {
                            var _b;
                            var prof = _a.profile, moderation = _a.moderation;
                            return (_jsx(View, { style: [
                                    a.rounded_full,
                                    {
                                        borderWidth: AVI_BORDER,
                                        borderColor: t.atoms.bg.backgroundColor,
                                        width: SIZE + AVI_BORDER * 2,
                                        height: SIZE + AVI_BORDER * 2,
                                        zIndex: AVI_BORDER - i,
                                        marginLeft: i > 0 ? -8 : 0,
                                    },
                                ], children: _jsx(UserAvatar, { size: SIZE, avatar: prof.avatar, moderation: moderation.ui('avatar'), type: ((_b = prof.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user', noBorder: true }) }, prof.did));
                        }) }), _jsx(Text, { style: [
                            a.flex_shrink,
                            textStyle,
                            hovered && {
                                textDecorationLine: 'underline',
                                textDecorationColor: t.atoms.text_contrast_medium.color,
                            },
                            pressed && {
                                opacity: 0.5,
                            },
                        ], numberOfLines: 2, children: slice.length >= 2 ? (
                        // 2-n followers, including blocks
                        serverCount > 2 ? (_jsxs(Trans, { children: ["Followed by", ' ', _jsx(Text, { emoji: true, style: textStyle, children: slice[0].profile.displayName }, slice[0].profile.did), ",", ' ', _jsx(Text, { emoji: true, style: textStyle, children: slice[1].profile.displayName }, slice[1].profile.did), ", and", ' ', _jsx(Plural, { value: serverCount - 2, one: "# other", other: "# others" })] }) // only 2
                        ) : (_jsxs(Trans, { children: ["Followed by", ' ', _jsx(Text, { emoji: true, style: textStyle, children: slice[0].profile.displayName }, slice[0].profile.did), ' ', "and", ' ', _jsx(Text, { emoji: true, style: textStyle, children: slice[1].profile.displayName }, slice[1].profile.did)] }))) : serverCount > 1 ? (
                        // 1-n followers, including blocks
                        _jsxs(Trans, { children: ["Followed by", ' ', _jsx(Text, { emoji: true, style: textStyle, children: slice[0].profile.displayName }, slice[0].profile.did), ' ', "and", ' ', _jsx(Plural, { value: serverCount - 1, one: "# other", other: "# others" })] })) : (
                        // only 1
                        _jsxs(Trans, { children: ["Followed by", ' ', _jsx(Text, { emoji: true, style: textStyle, children: slice[0].profile.displayName }, slice[0].profile.did)] })) })] }));
        } }));
}
function EmptyFallback(_a) {
    var show = _a.show;
    var t = useTheme();
    if (!show)
        return null;
    return (_jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Not followed by anyone you're following" }) }));
}
var templateObject_1;
