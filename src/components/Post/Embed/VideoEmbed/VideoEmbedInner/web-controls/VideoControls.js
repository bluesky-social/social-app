var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { clamp } from '#/lib/numbers';
import { useAutoplayDisabled, useSetSubtitlesEnabled, useSubtitlesEnabled, } from '#/state/preferences';
import { atoms as a, useTheme, web } from '#/alf';
import { useIsWithinMessage } from '#/components/dms/MessageContext';
import { useFullscreen } from '#/components/hooks/useFullscreen';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { ArrowsDiagonalIn_Stroke2_Corner0_Rounded as ArrowsInIcon, ArrowsDiagonalOut_Stroke2_Corner0_Rounded as ArrowsOutIcon, } from '#/components/icons/ArrowsDiagonal';
import { CC_Filled_Corner0_Rounded as CCActiveIcon, CC_Stroke2_Corner0_Rounded as CCInactiveIcon, } from '#/components/icons/CC';
import { Pause_Filled_Corner0_Rounded as PauseIcon } from '#/components/icons/Pause';
import { Play_Filled_Corner0_Rounded as PlayIcon } from '#/components/icons/Play';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { IS_WEB_MOBILE_IOS, IS_WEB_TOUCH_DEVICE } from '#/env';
import { TimeIndicator } from '../TimeIndicator';
import { ControlButton } from './ControlButton';
import { Scrubber } from './Scrubber';
import { formatTime, useVideoElement } from './utils';
import { VolumeControl } from './VolumeControl';
export function Controls(_a) {
    var videoRef = _a.videoRef, hlsRef = _a.hlsRef, active = _a.active, setActive = _a.setActive, focused = _a.focused, setFocused = _a.setFocused, onScreen = _a.onScreen, fullscreenRef = _a.fullscreenRef, hlsLoading = _a.hlsLoading, hasSubtitleTrack = _a.hasSubtitleTrack;
    var _b = useVideoElement(videoRef), play = _b.play, pause = _b.pause, playing = _b.playing, muted = _b.muted, changeMuted = _b.changeMuted, togglePlayPause = _b.togglePlayPause, currentTime = _b.currentTime, duration = _b.duration, buffering = _b.buffering, error = _b.error, canPlay = _b.canPlay;
    var t = useTheme();
    var _ = useLingui()._;
    var subtitlesEnabled = useSubtitlesEnabled();
    var setSubtitlesEnabled = useSetSubtitlesEnabled();
    var _c = useInteractionState(), hovered = _c.state, onHover = _c.onIn, onEndHover = _c.onOut;
    var _d = useFullscreen(fullscreenRef), isFullscreen = _d[0], toggleFullscreen = _d[1];
    var _e = useInteractionState(), hasFocus = _e.state, onFocus = _e.onIn, onBlur = _e.onOut;
    var _f = useState(false), interactingViaKeypress = _f[0], setInteractingViaKeypress = _f[1];
    var showSpinner = hlsLoading || buffering;
    var _g = useInteractionState(), volumeHovered = _g.state, onVolumeHover = _g.onIn, onVolumeEndHover = _g.onOut;
    var onKeyDown = useCallback(function () {
        setInteractingViaKeypress(true);
    }, []);
    useEffect(function () {
        if (interactingViaKeypress) {
            document.addEventListener('click', function () { return setInteractingViaKeypress(false); });
            return function () {
                document.removeEventListener('click', function () {
                    return setInteractingViaKeypress(false);
                });
            };
        }
    }, [interactingViaKeypress]);
    useEffect(function () {
        if (isFullscreen) {
            document.documentElement.style.scrollbarGutter = 'unset';
            return function () {
                document.documentElement.style.removeProperty('scrollbar-gutter');
            };
        }
    }, [isFullscreen]);
    // pause + unfocus when another video is active
    useEffect(function () {
        if (!active) {
            pause();
            setFocused(false);
        }
    }, [active, pause, setFocused]);
    // autoplay/pause based on visibility
    var isWithinMessage = useIsWithinMessage();
    var autoplayDisabled = useAutoplayDisabled() || isWithinMessage;
    useEffect(function () {
        if (active) {
            if (onScreen) {
                if (!autoplayDisabled)
                    play();
            }
            else {
                pause();
            }
        }
    }, [onScreen, pause, active, play, autoplayDisabled]);
    // use minimal quality when not focused
    useEffect(function () {
        if (!hlsRef.current)
            return;
        if (focused) {
            // allow 30s of buffering
            hlsRef.current.config.maxMaxBufferLength = 30;
        }
        else {
            // back to what we initially set
            hlsRef.current.config.maxMaxBufferLength = 10;
        }
    }, [hlsRef, focused]);
    useEffect(function () {
        if (!hlsRef.current)
            return;
        if (hasSubtitleTrack && subtitlesEnabled && canPlay) {
            hlsRef.current.subtitleTrack = 0;
        }
        else {
            hlsRef.current.subtitleTrack = -1;
        }
    }, [hasSubtitleTrack, subtitlesEnabled, hlsRef, canPlay]);
    // clicking on any button should focus the player, if it's not already focused
    var drawFocus = useCallback(function () {
        if (!active) {
            setActive();
        }
        setFocused(true);
    }, [active, setActive, setFocused]);
    var onPressEmptySpace = useCallback(function () {
        if (!focused) {
            drawFocus();
            if (autoplayDisabled)
                play();
        }
        else {
            togglePlayPause();
        }
    }, [togglePlayPause, drawFocus, focused, autoplayDisabled, play]);
    var onPressPlayPause = useCallback(function () {
        drawFocus();
        togglePlayPause();
    }, [drawFocus, togglePlayPause]);
    var onPressSubtitles = useCallback(function () {
        drawFocus();
        setSubtitlesEnabled(!subtitlesEnabled);
    }, [drawFocus, setSubtitlesEnabled, subtitlesEnabled]);
    var onPressFullscreen = useCallback(function () {
        drawFocus();
        toggleFullscreen();
    }, [drawFocus, toggleFullscreen]);
    var onSeek = useCallback(function (time) {
        if (!videoRef.current)
            return;
        if (videoRef.current.fastSeek) {
            videoRef.current.fastSeek(time);
        }
        else {
            videoRef.current.currentTime = time;
        }
    }, [videoRef]);
    var playStateBeforeSeekRef = useRef(false);
    var onSeekStart = useCallback(function () {
        drawFocus();
        playStateBeforeSeekRef.current = playing;
        pause();
    }, [playing, pause, drawFocus]);
    var onSeekEnd = useCallback(function () {
        if (playStateBeforeSeekRef.current) {
            play();
        }
    }, [play]);
    var seekLeft = useCallback(function () {
        if (!videoRef.current)
            return;
        var currentTime = videoRef.current.currentTime;
        var duration = videoRef.current.duration || 0;
        onSeek(clamp(currentTime - 5, 0, duration));
    }, [onSeek, videoRef]);
    var seekRight = useCallback(function () {
        if (!videoRef.current)
            return;
        var currentTime = videoRef.current.currentTime;
        var duration = videoRef.current.duration || 0;
        onSeek(clamp(currentTime + 5, 0, duration));
    }, [onSeek, videoRef]);
    var _h = useState(true), showCursor = _h[0], setShowCursor = _h[1];
    var cursorTimeoutRef = useRef(undefined);
    var onPointerMoveEmptySpace = useCallback(function () {
        setShowCursor(true);
        if (cursorTimeoutRef.current) {
            clearTimeout(cursorTimeoutRef.current);
        }
        cursorTimeoutRef.current = setTimeout(function () {
            setShowCursor(false);
            onEndHover();
        }, 2000);
    }, [onEndHover]);
    var onPointerLeaveEmptySpace = useCallback(function () {
        setShowCursor(false);
        if (cursorTimeoutRef.current) {
            clearTimeout(cursorTimeoutRef.current);
        }
    }, []);
    // these are used to trigger the hover state. on mobile, the hover state
    // should stick around for a bit after they tap, and if the controls aren't
    // present this initial tab should *only* show the controls and not activate anything
    var onPointerDown = useCallback(function (evt) {
        if (evt.pointerType !== 'mouse' && !hovered) {
            evt.preventDefault();
        }
        clearTimeout(timeoutRef.current);
    }, [hovered]);
    var timeoutRef = useRef(undefined);
    var onHoverWithTimeout = useCallback(function () {
        onHover();
        clearTimeout(timeoutRef.current);
    }, [onHover]);
    var onEndHoverWithTimeout = useCallback(function (evt) {
        // if touch, end after 3s
        // if mouse, end immediately
        if (evt.pointerType !== 'mouse') {
            setTimeout(onEndHover, 3000);
        }
        else {
            onEndHover();
        }
    }, [onEndHover]);
    var showControls = ((focused || autoplayDisabled) && !playing) ||
        (interactingViaKeypress ? hasFocus : hovered);
    return (_jsxs("div", { style: {
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        }, onClick: function (evt) {
            evt.stopPropagation();
            setInteractingViaKeypress(false);
        }, onPointerEnter: onHoverWithTimeout, onPointerMove: onHoverWithTimeout, onPointerLeave: onEndHoverWithTimeout, onPointerDown: onPointerDown, onFocus: onFocus, onBlur: onBlur, onKeyDown: onKeyDown, children: [_jsx(Pressable, { accessibilityRole: "button", onPointerEnter: onPointerMoveEmptySpace, onPointerMove: onPointerMoveEmptySpace, onPointerLeave: onPointerLeaveEmptySpace, accessibilityLabel: _(!focused
                    ? msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Unmute video"], ["Unmute video"]))) : playing
                    ? msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Pause video"], ["Pause video"]))) : msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Play video"], ["Play video"])))), accessibilityHint: "", style: [
                    a.flex_1,
                    web({ cursor: showCursor || !playing ? 'pointer' : 'none' }),
                ], onPress: onPressEmptySpace }), !showControls && !focused && duration > 0 && (_jsx(TimeIndicator, { time: Math.floor(duration - currentTime) })), _jsxs(View, { style: [
                    a.flex_shrink_0,
                    a.w_full,
                    a.px_xs,
                    web({
                        background: 'linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7))',
                    }),
                    { opacity: showControls ? 1 : 0 },
                    { transition: 'opacity 0.2s ease-in-out' },
                ], children: [(!volumeHovered || IS_WEB_TOUCH_DEVICE) && (_jsx(Scrubber, { duration: duration, currentTime: currentTime, onSeek: onSeek, onSeekStart: onSeekStart, onSeekEnd: onSeekEnd, seekLeft: seekLeft, seekRight: seekRight, togglePlayPause: togglePlayPause, drawFocus: drawFocus })), _jsxs(View, { style: [
                            a.flex_1,
                            a.px_xs,
                            a.pb_sm,
                            a.gap_sm,
                            a.flex_row,
                            a.align_center,
                        ], children: [_jsx(ControlButton, { active: playing, activeLabel: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Pause"], ["Pause"])))), inactiveLabel: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Play"], ["Play"])))), activeIcon: PauseIcon, inactiveIcon: PlayIcon, onPress: onPressPlayPause }), _jsx(View, { style: a.flex_1 }), Math.round(duration) > 0 && (_jsxs(Text, { style: [
                                    a.px_xs,
                                    { color: t.palette.white, fontVariant: ['tabular-nums'] },
                                ], children: [formatTime(currentTime), " / ", formatTime(duration)] })), hasSubtitleTrack && (_jsx(ControlButton, { active: subtitlesEnabled, activeLabel: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Disable subtitles"], ["Disable subtitles"])))), inactiveLabel: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Enable subtitles"], ["Enable subtitles"])))), activeIcon: CCActiveIcon, inactiveIcon: CCInactiveIcon, onPress: onPressSubtitles })), _jsx(VolumeControl, { muted: muted, changeMuted: changeMuted, hovered: volumeHovered, onHover: onVolumeHover, onEndHover: onVolumeEndHover, drawFocus: drawFocus }), !IS_WEB_MOBILE_IOS && (_jsx(ControlButton, { active: isFullscreen, activeLabel: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Exit fullscreen"], ["Exit fullscreen"])))), inactiveLabel: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Enter fullscreen"], ["Enter fullscreen"])))), activeIcon: ArrowsInIcon, inactiveIcon: ArrowsOutIcon, onPress: onPressFullscreen }))] })] }), (showSpinner || error) && (_jsxs(View, { pointerEvents: "none", style: [a.absolute, a.inset_0, a.justify_center, a.align_center], children: [showSpinner && _jsx(Loader, { fill: t.palette.white, size: "lg" }), error && (_jsx(Text, { style: { color: t.palette.white }, children: _jsx(Trans, { children: "An error occurred" }) }))] }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
