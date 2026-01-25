var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedRef, } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { utils } from '@bsky.app/alf';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useLargeAltBadgeEnabled } from '#/state/preferences/large-alt-badge';
import { atoms as a, useTheme } from '#/alf';
import { ArrowsDiagonalOut_Stroke2_Corner0_Rounded as Fullscreen } from '#/components/icons/ArrowsDiagonal';
import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
export function ConstrainedImage(_a) {
    var aspectRatio = _a.aspectRatio, fullBleed = _a.fullBleed, children = _a.children, minMobileAspectRatio = _a.minMobileAspectRatio;
    var t = useTheme();
    /**
     * Computed as a % value to apply as `paddingTop`, this basically controls
     * the height of the image.
     */
    var outerAspectRatio = useMemo(function () {
        var ratio = IS_NATIVE
            ? Math.min(1 / aspectRatio, minMobileAspectRatio !== null && minMobileAspectRatio !== void 0 ? minMobileAspectRatio : 16 / 9) // 9:16 bounding box
            : Math.min(1 / aspectRatio, 1); // 1:1 bounding box
        return "".concat(ratio * 100, "%");
    }, [aspectRatio, minMobileAspectRatio]);
    return (_jsx(View, { style: [a.w_full], children: _jsx(View, { style: [a.overflow_hidden, { paddingTop: outerAspectRatio }], children: _jsx(View, { style: [a.absolute, a.inset_0, a.flex_row], children: _jsx(View, { style: [
                        a.h_full,
                        a.rounded_md,
                        a.overflow_hidden,
                        t.atoms.bg_contrast_25,
                        fullBleed ? a.w_full : { aspectRatio: aspectRatio },
                    ], children: children }) }) }) }));
}
export function AutoSizedImage(_a) {
    var image = _a.image, _b = _a.crop, crop = _b === void 0 ? 'constrained' : _b, hideBadge = _a.hideBadge, onPress = _a.onPress, onLongPress = _a.onLongPress, onPressIn = _a.onPressIn;
    var t = useTheme();
    var _ = useLingui()._;
    var largeAlt = useLargeAltBadgeEnabled();
    var containerRef = useAnimatedRef();
    var fetchedDimsRef = useRef(null);
    var aspectRatio;
    var dims = image.aspectRatio;
    if (dims) {
        aspectRatio = dims.width / dims.height;
        if (Number.isNaN(aspectRatio)) {
            aspectRatio = undefined;
        }
    }
    var constrained;
    var max;
    var rawIsCropped;
    if (aspectRatio !== undefined) {
        var ratio = 1 / 2; // max of 1:2 ratio in feeds
        constrained = Math.max(aspectRatio, ratio);
        max = Math.max(aspectRatio, 0.25); // max of 1:4 in thread
        rawIsCropped = aspectRatio < constrained;
    }
    var cropDisabled = crop === 'none';
    var isCropped = rawIsCropped && !cropDisabled;
    var isContain = aspectRatio === undefined;
    var hasAlt = !!image.alt;
    var contents = (_jsxs(Animated.View, { ref: containerRef, collapsable: false, style: { flex: 1 }, children: [_jsx(Image, { contentFit: isContain ? 'contain' : 'cover', style: [a.w_full, a.h_full], source: image.thumb, accessible: true, accessibilityIgnoresInvertColors: true, accessibilityLabel: image.alt, accessibilityHint: "", onLoad: function (e) {
                    if (!isContain) {
                        fetchedDimsRef.current = {
                            width: e.source.width,
                            height: e.source.height,
                        };
                    }
                }, loading: "lazy" }), _jsx(MediaInsetBorder, {}), (hasAlt || isCropped) && !hideBadge ? (_jsxs(View, { accessible: false, style: [
                    a.absolute,
                    a.flex_row,
                    {
                        bottom: a.p_xs.padding,
                        right: a.p_xs.padding,
                        gap: 3,
                    },
                    largeAlt && [
                        {
                            gap: 4,
                        },
                    ],
                ], children: [isCropped && (_jsx(View, { style: [
                            a.rounded_xs,
                            t.atoms.bg_contrast_25,
                            {
                                padding: 3,
                                opacity: 0.8,
                            },
                            largeAlt && [
                                {
                                    padding: 5,
                                },
                            ],
                        ], children: _jsx(Fullscreen, { fill: t.atoms.text_contrast_high.color, width: largeAlt ? 18 : 12 }) })), hasAlt && (_jsx(View, { style: [
                            a.justify_center,
                            a.rounded_xs,
                            t.atoms.bg_contrast_25,
                            {
                                padding: 3,
                                opacity: 0.8,
                            },
                            largeAlt && [
                                {
                                    padding: 5,
                                },
                            ],
                        ], children: _jsx(Text, { style: [a.font_bold, largeAlt ? a.text_xs : { fontSize: 8 }], children: "ALT" }) }))] })) : null] }));
    if (cropDisabled) {
        return (_jsx(Pressable, { onPress: function () { return onPress === null || onPress === void 0 ? void 0 : onPress(containerRef, fetchedDimsRef.current); }, onLongPress: onLongPress, onPressIn: onPressIn, 
            // alt here is what screen readers actually use
            accessibilityLabel: image.alt, accessibilityHint: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Views full image"], ["Views full image"])))), accessibilityRole: "button", android_ripple: {
                color: utils.alpha(t.atoms.bg.backgroundColor, 0.2),
                foreground: true,
            }, style: [
                a.w_full,
                a.rounded_md,
                a.overflow_hidden,
                t.atoms.bg_contrast_25,
                { aspectRatio: max !== null && max !== void 0 ? max : 1 },
            ], children: contents }));
    }
    else {
        return (_jsx(ConstrainedImage, { fullBleed: crop === 'square', aspectRatio: constrained !== null && constrained !== void 0 ? constrained : 1, children: _jsx(Pressable, { onPress: function () { return onPress === null || onPress === void 0 ? void 0 : onPress(containerRef, fetchedDimsRef.current); }, onLongPress: onLongPress, onPressIn: onPressIn, 
                // alt here is what screen readers actually use
                accessibilityLabel: image.alt, accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Views full image"], ["Views full image"])))), accessibilityRole: "button", android_ripple: {
                    color: utils.alpha(t.atoms.bg.backgroundColor, 0.2),
                    foreground: true,
                }, style: [a.h_full], children: contents }) }));
    }
}
var templateObject_1, templateObject_2;
