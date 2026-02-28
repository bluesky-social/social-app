var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { clamp } from '#/lib/numbers';
import { useAutoplayDisabled } from '#/state/preferences';
import { ExternalEmbedRemoveBtn } from '#/view/com/composer/ExternalEmbedRemoveBtn';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a } from '#/alf';
import { PlayButtonIcon } from '#/components/video/PlayButtonIcon';
export function VideoPreview(_a) {
    var asset = _a.asset, video = _a.video, clear = _a.clear;
    var _ = useLingui()._;
    // TODO: figure out how to pause a GIF for reduced motion
    // it's not possible using an img tag -sfn
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
            { backgroundColor: 'black' },
            a.relative,
        ], children: [_jsx(ExternalEmbedRemoveBtn, { onRemove: clear }), video.mimeType === 'image/gif' ? (_jsx("img", { src: video.uri, style: { width: '100%', height: '100%', objectFit: 'cover' }, alt: "GIF" })) : (_jsxs(_Fragment, { children: [_jsx("video", { src: video.uri, style: { width: '100%', height: '100%', objectFit: 'cover' }, autoPlay: !autoplayDisabled, loop: true, muted: true, playsInline: true, onError: function (err) {
                            console.error('Error loading video', err);
                            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Could not process your video"], ["Could not process your video"])))), 'xmark');
                            clear();
                        } }), autoplayDisabled && (_jsx(View, { style: [a.absolute, a.inset_0, a.justify_center, a.align_center], children: _jsx(PlayButtonIcon, {}) }))] }))] }));
}
var templateObject_1;
