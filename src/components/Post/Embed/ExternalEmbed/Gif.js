var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { clamp } from '#/lib/numbers';
import { useAutoplayDisabled } from '#/state/preferences';
import { atoms as a, useTheme } from '#/alf';
import { Fill } from '#/components/Fill';
import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import { GifView } from '../../../../../modules/expo-bluesky-gif-view';
import { GifPresentationControls } from '../VideoEmbed/GifPresentationControls';
export function GifEmbed(_a) {
    var params = _a.params, thumb = _a.thumb, altText = _a.altText, isPreferredAltText = _a.isPreferredAltText, hideAlt = _a.hideAlt, _b = _a.style, style = _b === void 0 ? { width: '100%' } : _b;
    var t = useTheme();
    var _ = useLingui()._;
    var autoplayDisabled = useAutoplayDisabled();
    var playerRef = useRef(null);
    var _c = useState({
        isPlaying: !autoplayDisabled,
        isLoaded: false,
    }), playerState = _c[0], setPlayerState = _c[1];
    var onPlayerStateChange = function (e) {
        setPlayerState(e.nativeEvent);
    };
    var onPress = function () {
        var _a;
        void ((_a = playerRef.current) === null || _a === void 0 ? void 0 : _a.toggleAsync());
    };
    var aspectRatio = 1;
    if (params.dimensions) {
        var ratio = params.dimensions.width / params.dimensions.height;
        aspectRatio = clamp(ratio, 0.75, 4);
    }
    return (_jsx(View, { style: [
            a.rounded_md,
            a.overflow_hidden,
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
            ], children: [_jsx(MediaInsetBorder, {}), _jsx(GifPresentationControls, { onPress: onPress, isPlaying: playerState.isPlaying, isLoading: !playerState.isLoaded, altText: !hideAlt && isPreferredAltText ? altText : undefined }), _jsx(GifView, { source: params.playerUri, placeholderSource: thumb, style: [a.flex_1], autoplay: !autoplayDisabled, onPlayerStateChange: onPlayerStateChange, ref: playerRef, accessibilityHint: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Animated GIF"], ["Animated GIF"])))), accessibilityLabel: altText }), !playerState.isPlaying && (_jsx(Fill, { style: [
                        t.name === 'light' ? t.atoms.bg_contrast_975 : t.atoms.bg,
                        {
                            opacity: 0.3,
                        },
                    ] }))] }) }));
}
var templateObject_1;
