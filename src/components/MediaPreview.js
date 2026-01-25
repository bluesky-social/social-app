import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Trans } from '@lingui/macro';
import { isTenorGifUri } from '#/lib/strings/embed-player';
import { atoms as a, useTheme } from '#/alf';
import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import { Text } from '#/components/Typography';
import { PlayButtonIcon } from '#/components/video/PlayButtonIcon';
import * as bsky from '#/types/bsky';
/**
 * Streamlined MediaPreview component which just handles images, gifs, and videos
 */
export function Embed(_a) {
    var embed = _a.embed, style = _a.style;
    var e = bsky.post.parseEmbed(embed);
    if (!e)
        return null;
    if (e.type === 'images') {
        return (_jsx(Outer, { style: style, children: e.view.images.map(function (image) { return (_jsx(ImageItem, { thumbnail: image.thumb, alt: image.alt }, image.thumb)); }) }));
    }
    else if (e.type === 'link') {
        if (!e.view.external.thumb)
            return null;
        if (!isTenorGifUri(e.view.external.uri))
            return null;
        return (_jsx(Outer, { style: style, children: _jsx(GifItem, { thumbnail: e.view.external.thumb, alt: e.view.external.title }) }));
    }
    else if (e.type === 'video') {
        return (_jsx(Outer, { style: style, children: _jsx(VideoItem, { thumbnail: e.view.thumbnail, alt: e.view.alt }) }));
    }
    else if (e.type === 'post_with_media' &&
        // ignore further "nested" RecordWithMedia
        e.media.type !== 'post_with_media' &&
        // ignore any unknowns
        e.media.view !== null) {
        return _jsx(Embed, { embed: e.media.view, style: style });
    }
    return null;
}
export function Outer(_a) {
    var children = _a.children, style = _a.style;
    return _jsx(View, { style: [a.flex_row, a.gap_xs, style], children: children });
}
export function ImageItem(_a) {
    var thumbnail = _a.thumbnail, alt = _a.alt, children = _a.children;
    var t = useTheme();
    return (_jsxs(View, { style: [a.relative, a.flex_1, a.aspect_square, { maxWidth: 100 }], children: [_jsx(Image, { source: { uri: thumbnail }, alt: alt, style: [a.flex_1, a.rounded_xs, t.atoms.bg_contrast_25], contentFit: "cover", accessible: true, accessibilityIgnoresInvertColors: true }, thumbnail), _jsx(MediaInsetBorder, { style: [a.rounded_xs] }), children] }));
}
export function GifItem(_a) {
    var thumbnail = _a.thumbnail, alt = _a.alt;
    return (_jsxs(ImageItem, { thumbnail: thumbnail, alt: alt, children: [_jsx(View, { style: [a.absolute, a.inset_0, a.justify_center, a.align_center], children: _jsx(PlayButtonIcon, { size: 24 }) }), _jsx(View, { style: styles.altContainer, children: _jsx(Text, { style: styles.alt, children: _jsx(Trans, { children: "GIF" }) }) })] }));
}
export function VideoItem(_a) {
    var thumbnail = _a.thumbnail, alt = _a.alt;
    if (!thumbnail) {
        return (_jsx(View, { style: [
                { backgroundColor: 'black' },
                a.flex_1,
                a.aspect_square,
                { maxWidth: 100 },
                a.justify_center,
                a.align_center,
            ], children: _jsx(PlayButtonIcon, { size: 24 }) }));
    }
    return (_jsx(ImageItem, { thumbnail: thumbnail, alt: alt, children: _jsx(View, { style: [a.absolute, a.inset_0, a.justify_center, a.align_center], children: _jsx(PlayButtonIcon, { size: 24 }) }) }));
}
var styles = StyleSheet.create({
    altContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
        position: 'absolute',
        right: 5,
        bottom: 5,
        zIndex: 2,
    },
    alt: {
        color: 'white',
        fontSize: 7,
        fontWeight: '600',
    },
});
