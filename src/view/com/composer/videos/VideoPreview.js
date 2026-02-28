import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { BlueskyVideoView } from '@haileyok/bluesky-video';
import { clamp } from '#/lib/numbers';
import { useAutoplayDisabled } from '#/state/preferences';
import { ExternalEmbedRemoveBtn } from '#/view/com/composer/ExternalEmbedRemoveBtn';
import { atoms as a, useTheme } from '#/alf';
import { PlayButtonIcon } from '#/components/video/PlayButtonIcon';
import { VideoTranscodeBackdrop } from './VideoTranscodeBackdrop';
export function VideoPreview(_a) {
    var asset = _a.asset, video = _a.video, clear = _a.clear, isActivePost = _a.isActivePost;
    var t = useTheme();
    var playerRef = useRef(null);
    var autoplayDisabled = useAutoplayDisabled();
    var aspectRatio = asset.width / asset.height;
    if (isNaN(aspectRatio)) {
        aspectRatio = 16 / 9;
    }
    aspectRatio = clamp(aspectRatio, 1 / 1, 3 / 1);
    return (_jsxs(View, { style: [
            a.w_full,
            a.rounded_sm,
            { aspectRatio: aspectRatio },
            a.overflow_hidden,
            a.border,
            t.atoms.border_contrast_low,
            { backgroundColor: 'black' },
        ], children: [_jsx(View, { style: [a.absolute, a.inset_0], children: _jsx(VideoTranscodeBackdrop, { uri: asset.uri }) }), isActivePost && (_jsx(_Fragment, { children: video.mimeType === 'image/gif' ? (_jsx(Image, { style: [a.flex_1], autoplay: !autoplayDisabled, source: { uri: video.uri }, accessibilityIgnoresInvertColors: true, cachePolicy: "none" })) : (_jsx(BlueskyVideoView, { url: video.uri, autoplay: !autoplayDisabled, beginMuted: true, forceTakeover: true, ref: playerRef })) })), _jsx(ExternalEmbedRemoveBtn, { onRemove: clear }), autoplayDisabled && (_jsx(View, { style: [a.absolute, a.inset_0, a.justify_center, a.align_center], children: _jsx(PlayButtonIcon, {}) }))] }));
}
