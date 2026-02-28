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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, withTiming, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateProfile, } from '@atproto/api';
import { useIsFocused } from '@react-navigation/native';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSetLightStatusBar } from '#/state/shell/light-status-bar';
import { usePagerHeaderContext } from '#/view/com/pager/PagerHeaderContext';
import { LoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { atoms as a, useTheme } from '#/alf';
import { Header } from '#/components/Layout';
import * as ProfileCard from '#/components/ProfileCard';
import { IS_NATIVE } from '#/env';
import { HeaderLabelerButtons, ProfileHeaderLabeler, } from './ProfileHeaderLabeler';
import { HeaderStandardButtons, ProfileHeaderStandard, } from './ProfileHeaderStandard';
var ProfileHeaderLoading = function (_props) {
    var t = useTheme();
    return (_jsxs(View, { style: t.atoms.bg, children: [_jsx(LoadingPlaceholder, { width: "100%", height: 150, style: { borderRadius: 0 } }), _jsx(View, { style: [
                    t.atoms.bg,
                    { borderColor: t.atoms.bg.backgroundColor },
                    styles.avi,
                ], children: _jsx(LoadingPlaceholder, { width: 90, height: 90, style: styles.br45 }) }), _jsx(View, { style: styles.content, children: _jsx(View, { style: [styles.buttonsLine], children: _jsx(LoadingPlaceholder, { width: 140, height: 34, style: styles.br50 }) }) })] }));
};
ProfileHeaderLoading = memo(ProfileHeaderLoading);
export { ProfileHeaderLoading };
var ProfileHeader = function (_a) {
    var _b;
    var setMinimumHeight = _a.setMinimumHeight, props = __rest(_a, ["setMinimumHeight"]);
    var content;
    if ((_b = props.profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) {
        if (!props.labeler) {
            content = _jsx(ProfileHeaderLoading, {});
        }
        else {
            content = _jsx(ProfileHeaderLabeler, __assign({}, props, { labeler: props.labeler }));
        }
    }
    else {
        content = _jsx(ProfileHeaderStandard, __assign({}, props));
    }
    return (_jsxs(_Fragment, { children: [IS_NATIVE && (_jsx(MinimalHeader, { onLayout: function (evt) { return setMinimumHeight(evt.nativeEvent.layout.height); }, profile: props.profile, labeler: props.labeler, hideBackButton: props.hideBackButton })), content] }));
};
ProfileHeader = memo(ProfileHeader);
export { ProfileHeader };
var MinimalHeader = memo(function MinimalHeader(_a) {
    var _b;
    var onLayout = _a.onLayout, profileUnshadowed = _a.profile, labeler = _a.labeler, _c = _a.hideBackButton, hideBackButton = _c === void 0 ? false : _c;
    var t = useTheme();
    var insets = useSafeAreaInsets();
    var ctx = usePagerHeaderContext();
    var profile = useProfileShadow(profileUnshadowed);
    var moderationOpts = useModerationOpts();
    var moderation = useMemo(function () { return (moderationOpts ? moderateProfile(profile, moderationOpts) : null); }, [moderationOpts, profile]);
    var _d = useState(false), visible = _d[0], setVisible = _d[1];
    var _e = useState(insets.top), minimalHeaderHeight = _e[0], setMinimalHeaderHeight = _e[1];
    var isScreenFocused = useIsFocused();
    if (!ctx)
        throw new Error('MinimalHeader cannot be used on web');
    var scrollY = ctx.scrollY, headerHeight = ctx.headerHeight;
    var animatedStyle = useAnimatedStyle(function () {
        // if we don't yet have the min header height in JS, hide
        if (!_WORKLET || minimalHeaderHeight === 0) {
            return {
                opacity: 0,
            };
        }
        var pastThreshold = scrollY.get() > 100;
        return {
            opacity: pastThreshold
                ? withTiming(1, { duration: 75 })
                : withTiming(0, { duration: 75 }),
            transform: [
                {
                    translateY: Math.min(scrollY.get(), headerHeight - minimalHeaderHeight),
                },
            ],
        };
    });
    useAnimatedReaction(function () { return scrollY.get() > 100; }, function (value, prev) {
        if (prev !== value) {
            runOnJS(setVisible)(value);
        }
    });
    useSetLightStatusBar(isScreenFocused && !visible);
    return (_jsx(Animated.View, { pointerEvents: visible ? 'auto' : 'none', "aria-hidden": !visible, accessibilityElementsHidden: !visible, importantForAccessibility: visible ? 'auto' : 'no-hide-descendants', onLayout: function (evt) {
            setMinimalHeaderHeight(evt.nativeEvent.layout.height);
            onLayout(evt);
        }, style: [
            a.absolute,
            a.z_50,
            t.atoms.bg,
            {
                top: 0,
                left: 0,
                right: 0,
                paddingTop: insets.top,
            },
            animatedStyle,
        ], children: _jsxs(Header.Outer, { noBottomBorder: true, children: [hideBackButton ? _jsx(Header.MenuButton, {}) : _jsx(Header.BackButton, {}), _jsxs(Header.Content, { align: "left", children: [moderationOpts ? (_jsx(ProfileCard.Name, { profile: profile, moderationOpts: moderationOpts, textStyle: [a.font_bold] })) : (_jsx(ProfileCard.NamePlaceholder, {})), _jsx(Header.SubtitleText, { children: sanitizeHandle(profile.handle, '@') })] }), !((_b = profile.associated) === null || _b === void 0 ? void 0 : _b.labeler)
                    ? moderationOpts &&
                        moderation && (_jsx(View, { style: [a.flex_row, a.justify_end, a.gap_xs], children: _jsx(HeaderStandardButtons, { profile: profile, moderation: moderation, moderationOpts: moderationOpts, minimal: true }) }))
                    : labeler && (_jsx(View, { style: [a.flex_row, a.justify_end, a.gap_xs], children: _jsx(HeaderLabelerButtons, { profile: profile, minimal: true }) }))] }) }));
});
MinimalHeader.displayName = 'MinimalHeader';
var styles = StyleSheet.create({
    avi: {
        position: 'absolute',
        top: 110,
        left: 10,
        width: 94,
        height: 94,
        borderRadius: 47,
        borderWidth: 2,
    },
    content: {
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    buttonsLine: {
        flexDirection: 'row',
        marginLeft: 'auto',
    },
    br45: { borderRadius: 45 },
    br50: { borderRadius: 50 },
});
