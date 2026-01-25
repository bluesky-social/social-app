var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { utils } from '@bsky.app/alf';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useLargeAltBadgeEnabled } from '#/state/preferences/large-alt-badge';
import { atoms as a, useTheme } from '#/alf';
import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import { PostEmbedViewContext } from '#/components/Post/Embed/types';
import { Text } from '#/components/Typography';
export function GalleryItem(_a) {
    var images = _a.images, index = _a.index, imageStyle = _a.imageStyle, onPress = _a.onPress, onPressIn = _a.onPressIn, onLongPress = _a.onLongPress, viewContext = _a.viewContext, insetBorderStyle = _a.insetBorderStyle, containerRefs = _a.containerRefs, thumbDimsRef = _a.thumbDimsRef;
    var t = useTheme();
    var _ = useLingui()._;
    var largeAltBadge = useLargeAltBadgeEnabled();
    var image = images[index];
    var hasAlt = !!image.alt;
    var hideBadges = viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia;
    return (_jsxs(View, { style: a.flex_1, ref: containerRefs[index], collapsable: false, children: [_jsxs(Pressable, { onPress: onPress
                    ? function () { return onPress(index, containerRefs, thumbDimsRef.current.slice()); }
                    : undefined, onPressIn: onPressIn ? function () { return onPressIn(index); } : undefined, onLongPress: onLongPress ? function () { return onLongPress(index); } : undefined, android_ripple: {
                    color: utils.alpha(t.atoms.bg.backgroundColor, 0.2),
                    foreground: true,
                }, style: [
                    a.flex_1,
                    a.overflow_hidden,
                    t.atoms.bg_contrast_25,
                    imageStyle,
                ], accessibilityRole: "button", accessibilityLabel: image.alt || _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Image"], ["Image"])))), accessibilityHint: "", children: [_jsx(Image, { source: { uri: image.thumb }, style: [a.flex_1], accessible: true, accessibilityLabel: image.alt, accessibilityHint: "", accessibilityIgnoresInvertColors: true, onLoad: function (e) {
                            thumbDimsRef.current[index] = {
                                width: e.source.width,
                                height: e.source.height,
                            };
                        }, loading: "lazy" }), _jsx(MediaInsetBorder, { style: insetBorderStyle })] }), hasAlt && !hideBadges ? (_jsx(View, { accessible: false, style: [
                    a.absolute,
                    a.flex_row,
                    a.align_center,
                    a.rounded_xs,
                    t.atoms.bg_contrast_25,
                    {
                        gap: 3,
                        padding: 3,
                        bottom: a.p_xs.padding,
                        right: a.p_xs.padding,
                        opacity: 0.8,
                    },
                    largeAltBadge && [
                        {
                            gap: 4,
                            padding: 5,
                        },
                    ],
                ], children: _jsx(Text, { style: [a.font_bold, largeAltBadge ? a.text_xs : { fontSize: 8 }], children: "ALT" }) })) : null] }));
}
var templateObject_1;
