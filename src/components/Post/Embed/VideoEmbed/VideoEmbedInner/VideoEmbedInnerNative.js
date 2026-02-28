var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useImperativeHandle, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BlueskyVideoView } from '@haileyok/bluesky-video';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { HITSLOP_30 } from '#/lib/constants';
import { useAutoplayDisabled } from '#/state/preferences';
import { atoms as a, useTheme } from '#/alf';
import { useIsWithinMessage } from '#/components/dms/MessageContext';
import { Mute_Stroke2_Corner0_Rounded as MuteIcon } from '#/components/icons/Mute';
import { Pause_Filled_Corner0_Rounded as PauseIcon } from '#/components/icons/Pause';
import { Play_Filled_Corner0_Rounded as PlayIcon } from '#/components/icons/Play';
import { SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon } from '#/components/icons/Speaker';
import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import { useVideoMuteState } from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext';
import { GifPresentationControls } from '../GifPresentationControls';
import { TimeIndicator } from './TimeIndicator';
export function VideoEmbedInnerNative(_a) {
    var ref = _a.ref, embed = _a.embed, setStatus = _a.setStatus, setIsLoading = _a.setIsLoading, setIsActive = _a.setIsActive;
    var _ = useLingui()._;
    var videoRef = useRef(null);
    var autoplayDisabled = useAutoplayDisabled();
    var isWithinMessage = useIsWithinMessage();
    var _b = useVideoMuteState(), muted = _b[0], setMuted = _b[1];
    var _c = useState(false), isPlaying = _c[0], setIsPlaying = _c[1];
    var _d = useState(0), timeRemaining = _d[0], setTimeRemaining = _d[1];
    var _e = useState(), error = _e[0], setError = _e[1];
    useImperativeHandle(ref, function () { return ({
        togglePlayback: function () {
            var _a;
            (_a = videoRef.current) === null || _a === void 0 ? void 0 : _a.togglePlayback();
        },
    }); });
    if (error) {
        throw new Error(error);
    }
    var isGif = embed.presentation === 'gif';
    return (_jsxs(View, { style: [a.flex_1, a.relative], children: [_jsx(BlueskyVideoView, { url: embed.playlist, autoplay: !autoplayDisabled && !isWithinMessage, beginMuted: isGif || (autoplayDisabled ? false : muted), style: [a.rounded_sm], onActiveChange: function (e) {
                    setIsActive(e.nativeEvent.isActive);
                }, onLoadingChange: function (e) {
                    setIsLoading(e.nativeEvent.isLoading);
                }, onMutedChange: function (e) {
                    if (!isGif) {
                        setMuted(e.nativeEvent.isMuted);
                    }
                }, onStatusChange: function (e) {
                    setStatus(e.nativeEvent.status);
                    setIsPlaying(e.nativeEvent.status === 'playing');
                }, onTimeRemainingChange: function (e) {
                    setTimeRemaining(e.nativeEvent.timeRemaining);
                }, onError: function (e) {
                    setError(e.nativeEvent.error);
                }, ref: videoRef, accessibilityLabel: embed.alt ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Video: ", ""], ["Video: ", ""])), embed.alt)) : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Video"], ["Video"])))), accessibilityHint: "" }), isGif ? (_jsx(GifPresentationControls, { onPress: function () {
                    var _a;
                    (_a = videoRef.current) === null || _a === void 0 ? void 0 : _a.togglePlayback();
                }, isPlaying: isPlaying, isLoading: false, altText: embed.alt })) : (_jsx(VideoPresentationControls, { enterFullscreen: function () {
                    var _a;
                    (_a = videoRef.current) === null || _a === void 0 ? void 0 : _a.enterFullscreen(true);
                }, toggleMuted: function () {
                    var _a;
                    (_a = videoRef.current) === null || _a === void 0 ? void 0 : _a.toggleMuted();
                }, togglePlayback: function () {
                    var _a;
                    (_a = videoRef.current) === null || _a === void 0 ? void 0 : _a.togglePlayback();
                }, isPlaying: isPlaying, timeRemaining: timeRemaining })), _jsx(MediaInsetBorder, {})] }));
}
function VideoPresentationControls(_a) {
    var enterFullscreen = _a.enterFullscreen, toggleMuted = _a.toggleMuted, togglePlayback = _a.togglePlayback, timeRemaining = _a.timeRemaining, isPlaying = _a.isPlaying;
    var _ = useLingui()._;
    var t = useTheme();
    var muted = useVideoMuteState()[0];
    // show countdown when:
    // 1. timeRemaining is a number - was seeing NaNs
    // 2. duration is greater than 0 - means metadata has loaded
    // 3. we're less than 5 second into the video
    var showTime = !isNaN(timeRemaining);
    return (_jsxs(View, { style: [a.absolute, a.inset_0], children: [_jsx(Pressable, { onPress: enterFullscreen, style: a.flex_1, accessibilityLabel: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Video"], ["Video"])))), accessibilityHint: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Enters full screen"], ["Enters full screen"])))), accessibilityRole: "button" }), _jsx(ControlButton, { onPress: togglePlayback, label: isPlaying ? _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Pause"], ["Pause"])))) : _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Play"], ["Play"])))), accessibilityHint: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Plays or pauses the video"], ["Plays or pauses the video"])))), style: { left: 6 }, children: isPlaying ? (_jsx(PauseIcon, { width: 13, fill: t.palette.white })) : (_jsx(PlayIcon, { width: 13, fill: t.palette.white })) }), showTime && _jsx(TimeIndicator, { time: timeRemaining, style: { left: 33 } }), _jsx(ControlButton, { onPress: toggleMuted, label: muted
                    ? _(msg({ message: "Unmute", context: 'video' }))
                    : _(msg({ message: "Mute", context: 'video' })), accessibilityHint: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Toggles the sound"], ["Toggles the sound"])))), style: { right: 6 }, children: muted ? (_jsx(MuteIcon, { width: 13, fill: t.palette.white })) : (_jsx(UnmuteIcon, { width: 13, fill: t.palette.white })) })] }));
}
function ControlButton(_a) {
    var onPress = _a.onPress, children = _a.children, label = _a.label, accessibilityHint = _a.accessibilityHint, style = _a.style;
    return (_jsx(View, { style: [
            a.absolute,
            a.rounded_full,
            a.justify_center,
            {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                paddingHorizontal: 4,
                paddingVertical: 4,
                bottom: 6,
                minHeight: 21,
                minWidth: 21,
            },
            style,
        ], children: _jsx(Pressable, { onPress: onPress, style: a.flex_1, accessibilityLabel: label, accessibilityHint: accessibilityHint, accessibilityRole: "button", hitSlop: HITSLOP_30, children: children }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
