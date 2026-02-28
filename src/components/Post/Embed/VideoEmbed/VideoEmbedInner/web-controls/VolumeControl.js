var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { atoms as a } from '#/alf';
import { Mute_Stroke2_Corner0_Rounded as MuteIcon } from '#/components/icons/Mute';
import { SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon } from '#/components/icons/Speaker';
import { useVideoVolumeState } from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext';
import { IS_WEB_SAFARI, IS_WEB_TOUCH_DEVICE } from '#/env';
import { ControlButton } from './ControlButton';
export function VolumeControl(_a) {
    var muted = _a.muted, changeMuted = _a.changeMuted, hovered = _a.hovered, onHover = _a.onHover, onEndHover = _a.onEndHover, drawFocus = _a.drawFocus;
    var _ = useLingui()._;
    var _b = useVideoVolumeState(), volume = _b[0], setVolume = _b[1];
    var onVolumeChange = useCallback(function (evt) {
        drawFocus();
        var vol = sliderVolumeToVideoVolume(Number(evt.target.value));
        setVolume(vol);
        changeMuted(vol === 0);
    }, [setVolume, drawFocus, changeMuted]);
    var sliderVolume = muted ? 0 : videoVolumeToSliderVolume(volume);
    var isZeroVolume = volume === 0;
    var onPressMute = useCallback(function () {
        drawFocus();
        if (isZeroVolume) {
            setVolume(1);
            changeMuted(false);
        }
        else {
            changeMuted(function (prevMuted) { return !prevMuted; });
        }
    }, [drawFocus, setVolume, isZeroVolume, changeMuted]);
    return (_jsxs(View, { onPointerEnter: onHover, onPointerLeave: onEndHover, style: [a.relative], children: [hovered && !IS_WEB_TOUCH_DEVICE && (_jsx(Animated.View, { entering: FadeIn.duration(100), exiting: FadeOut.duration(100), style: [a.absolute, a.w_full, { height: 100, bottom: '100%' }], children: _jsx(View, { style: [
                        a.flex_1,
                        a.mb_xs,
                        a.px_2xs,
                        a.py_xs,
                        { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
                        a.rounded_xs,
                        a.align_center,
                    ], children: _jsx("input", { type: "range", min: 0, max: 100, value: sliderVolume, "aria-label": _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Volume"], ["Volume"])))), style: 
                        // Ridiculous safari hack for old version of safari. Fixed in sonoma beta -h
                        IS_WEB_SAFARI
                            ? { height: 92, minHeight: '100%' }
                            : { height: '100%' }, onChange: onVolumeChange, 
                        // @ts-expect-error for old versions of firefox, and then re-using it for targeting the CSS -sfn
                        orient: "vertical" }) }) })), _jsx(ControlButton, { active: muted || volume === 0, activeLabel: _(msg({ message: "Unmute", context: 'video' })), inactiveLabel: _(msg({ message: "Mute", context: 'video' })), activeIcon: MuteIcon, inactiveIcon: UnmuteIcon, onPress: onPressMute })] }));
}
function sliderVolumeToVideoVolume(value) {
    return Math.pow(value / 100, 4);
}
function videoVolumeToSliderVolume(value) {
    return Math.round(Math.pow(value, 1 / 4) * 100);
}
var templateObject_1;
