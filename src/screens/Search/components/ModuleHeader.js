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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { View } from 'react-native';
import { AtUri } from '@atproto/api';
import { PressableScale } from '#/lib/custom-animations/PressableScale';
import { makeCustomFeedLink } from '#/lib/routes/links';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, native, useTheme } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import * as FeedCard from '#/components/FeedCard';
import { sizes as iconSizes } from '#/components/icons/common';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon } from '#/components/icons/MagnifyingGlass';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
export function Container(_a) {
    var style = _a.style, children = _a.children, bottomBorder = _a.bottomBorder;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.flex_row,
            a.align_center,
            a.px_lg,
            a.pt_2xl,
            a.pb_md,
            a.gap_sm,
            t.atoms.bg,
            bottomBorder && [a.border_b, t.atoms.border_contrast_low],
            style,
        ], children: children }));
}
export function FeedLink(_a) {
    var feed = _a.feed, children = _a.children;
    var t = useTheme();
    var _b = useMemo(function () { return new AtUri(feed.uri); }, [feed.uri]), did = _b.host, rkey = _b.rkey;
    return (_jsx(Link, { to: makeCustomFeedLink(did, rkey), label: feed.displayName, style: [a.flex_1], children: function (_a) {
            var focused = _a.focused, hovered = _a.hovered, pressed = _a.pressed;
            return (_jsx(View, { style: [
                    a.flex_1,
                    a.flex_row,
                    a.align_center,
                    { gap: 10 },
                    a.rounded_md,
                    a.p_xs,
                    { marginLeft: -6 },
                    (focused || hovered || pressed) && t.atoms.bg_contrast_25,
                ], children: children }));
        } }));
}
export function FeedAvatar(_a) {
    var feed = _a.feed;
    return _jsx(UserAvatar, { type: "algo", size: 38, avatar: feed.avatar });
}
export function Icon(_a) {
    var Comp = _a.icon, _b = _a.size, size = _b === void 0 ? 'lg' : _b;
    var iconSize = iconSizes[size];
    return (_jsx(View, { style: [a.z_20, { width: iconSize, height: iconSize, marginLeft: -2 }], children: _jsx(Comp, { width: iconSize }) }));
}
export function TitleText(_a) {
    var style = _a.style, props = __rest(_a, ["style"]);
    return (_jsx(Text, __assign({ style: [a.font_semi_bold, a.flex_1, a.text_xl, style], emoji: true }, props)));
}
export function SubtitleText(_a) {
    var style = _a.style, props = __rest(_a, ["style"]);
    var t = useTheme();
    return (_jsx(Text, __assign({ style: [
            t.atoms.text_contrast_medium,
            a.leading_tight,
            a.flex_1,
            a.text_sm,
            style,
        ] }, props)));
}
export function SearchButton(_a) {
    var label = _a.label, metricsTag = _a.metricsTag, onPress = _a.onPress;
    var ax = useAnalytics();
    return (_jsx(Button, { label: label, size: "small", variant: "ghost", color: "secondary", shape: "round", PressableComponent: native(PressableScale), onPress: function () {
            ax.metric('explore:module:searchButtonPress', { module: metricsTag });
            onPress === null || onPress === void 0 ? void 0 : onPress();
        }, style: [
            {
                right: -4,
            },
        ], children: _jsx(ButtonIcon, { icon: SearchIcon, size: "lg" }) }));
}
export function PinButton(_a) {
    var feed = _a.feed;
    return (_jsx(View, { style: [a.z_20, { marginRight: -6 }], children: _jsx(FeedCard.SaveButton, { pin: true, view: feed, size: "large", color: "secondary", variant: "ghost", shape: "square", text: false }) }));
}
