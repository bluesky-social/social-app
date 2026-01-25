var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View, } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { HITSLOP_20 } from '#/lib/constants';
import { clamp } from '#/lib/numbers';
import { useAutoplayDisabled } from '#/state/preferences';
import { useLargeAltBadgeEnabled } from '#/state/preferences/large-alt-badge';
import { atoms as a, useTheme } from '#/alf';
import { Fill } from '#/components/Fill';
import { Loader } from '#/components/Loader';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';
import { PlayButtonIcon } from '#/components/video/PlayButtonIcon';
import { IS_WEB } from '#/env';
import { GifView } from '../../../../../modules/expo-bluesky-gif-view';
function PlaybackControls(_a) {
    var onPress = _a.onPress, isPlaying = _a.isPlaying, isLoaded = _a.isLoaded;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsx(Pressable, { accessibilityRole: "button", accessibilityHint: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Plays or pauses the GIF"], ["Plays or pauses the GIF"])))), accessibilityLabel: isPlaying ? _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Pause"], ["Pause"])))) : _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Play"], ["Play"])))), style: [
            a.absolute,
            a.align_center,
            a.justify_center,
            !isLoaded && a.border,
            t.atoms.border_contrast_medium,
            a.inset_0,
            a.w_full,
            a.h_full,
            {
                zIndex: 2,
                backgroundColor: !isLoaded
                    ? t.atoms.bg_contrast_25.backgroundColor
                    : undefined,
            },
        ], onPress: onPress, children: !isLoaded ? (_jsx(View, { children: _jsx(View, { style: [a.align_center, a.justify_center], children: _jsx(Loader, { size: "xl" }) }) })) : !isPlaying ? (_jsx(PlayButtonIcon, {})) : undefined }));
}
export function GifEmbed(_a) {
    var params = _a.params, thumb = _a.thumb, altText = _a.altText, isPreferredAltText = _a.isPreferredAltText, hideAlt = _a.hideAlt, _b = _a.style, style = _b === void 0 ? { width: '100%' } : _b;
    var t = useTheme();
    var _ = useLingui()._;
    var autoplayDisabled = useAutoplayDisabled();
    var playerRef = React.useRef(null);
    var _c = React.useState({
        isPlaying: !autoplayDisabled,
        isLoaded: false,
    }), playerState = _c[0], setPlayerState = _c[1];
    var onPlayerStateChange = React.useCallback(function (e) {
        setPlayerState(e.nativeEvent);
    }, []);
    var onPress = React.useCallback(function () {
        var _a;
        (_a = playerRef.current) === null || _a === void 0 ? void 0 : _a.toggleAsync();
    }, []);
    var aspectRatio = 1;
    if (params.dimensions) {
        aspectRatio = clamp(params.dimensions.width / params.dimensions.height, 0.75, 4);
    }
    return (_jsx(View, { style: [
            a.rounded_md,
            a.overflow_hidden,
            a.border,
            t.atoms.border_contrast_low,
            { backgroundColor: t.palette.black },
            { aspectRatio: aspectRatio },
            style,
        ], children: _jsxs(View, { style: [
                a.absolute,
                /*
                 * Aspect ratio was being clipped weirdly on web -esb
                 */
                {
                    top: -2,
                    bottom: -2,
                    left: -2,
                    right: -2,
                },
            ], children: [_jsx(PlaybackControls, { onPress: onPress, isPlaying: playerState.isPlaying, isLoaded: playerState.isLoaded }), _jsx(GifView, { source: params.playerUri, placeholderSource: thumb, style: [a.flex_1], autoplay: !autoplayDisabled, onPlayerStateChange: onPlayerStateChange, ref: playerRef, accessibilityHint: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Animated GIF"], ["Animated GIF"])))), accessibilityLabel: altText }), !playerState.isPlaying && (_jsx(Fill, { style: [
                        t.name === 'light' ? t.atoms.bg_contrast_975 : t.atoms.bg,
                        {
                            opacity: 0.3,
                        },
                    ] })), !hideAlt && isPreferredAltText && _jsx(AltText, { text: altText })] }) }));
}
function AltText(_a) {
    var text = _a.text;
    var control = Prompt.usePromptControl();
    var largeAltBadge = useLargeAltBadgeEnabled();
    var _ = useLingui()._;
    return (_jsxs(_Fragment, { children: [_jsx(TouchableOpacity, { testID: "altTextButton", accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Show alt text"], ["Show alt text"])))), accessibilityHint: "", hitSlop: HITSLOP_20, onPress: control.open, style: styles.altContainer, children: _jsx(Text, { style: [styles.alt, largeAltBadge && a.text_xs], accessible: false, children: _jsx(Trans, { children: "ALT" }) }) }), _jsxs(Prompt.Outer, { control: control, children: [_jsx(Prompt.TitleText, { children: _jsx(Trans, { children: "Alt Text" }) }), _jsx(Prompt.DescriptionText, { selectable: true, children: text }), _jsx(Prompt.Actions, { children: _jsx(Prompt.Action, { onPress: function () { return control.close(); }, cta: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Close"], ["Close"])))), color: "secondary" }) })] })] }));
}
var styles = StyleSheet.create({
    altContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderRadius: 6,
        paddingHorizontal: IS_WEB ? 8 : 6,
        paddingVertical: IS_WEB ? 6 : 3,
        position: 'absolute',
        // Related to margin/gap hack. This keeps the alt label in the same position
        // on all platforms
        right: IS_WEB ? 8 : 5,
        bottom: IS_WEB ? 8 : 5,
        zIndex: 2,
    },
    alt: {
        color: 'white',
        fontSize: IS_WEB ? 10 : 7,
        fontWeight: '600',
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
