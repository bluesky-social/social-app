import React, {useCallback} from 'react'
import {View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isSafari, isTouchDevice} from '#/lib/browser'
import {atoms as a} from '#/alf'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {useVideoVolumeState} from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext'
import {ControlButton} from './ControlButton'

export function VolumeControl({
  muted,
  changeMuted,
  hovered,
  onHover,
  onEndHover,
  drawFocus,
}: {
  muted: boolean
  changeMuted: (muted: boolean | ((prev: boolean) => boolean)) => void
  hovered: boolean
  onHover: () => void
  onEndHover: () => void
  drawFocus: () => void
}) {
  const {_} = useLingui()
  const [volume, setVolume] = useVideoVolumeState()

  const onVolumeChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      drawFocus()
      const vol = sliderVolumeToVideoVolume(Number(evt.target.value))
      setVolume(vol)
      changeMuted(vol === 0)
    },
    [setVolume, drawFocus, changeMuted],
  )

  const sliderVolume = muted ? 0 : videoVolumeToSliderVolume(volume)

  const isZeroVolume = volume === 0
  const onPressMute = useCallback(() => {
    drawFocus()
    if (isZeroVolume) {
      setVolume(1)
      changeMuted(false)
    } else {
      changeMuted(prevMuted => !prevMuted)
    }
  }, [drawFocus, setVolume, isZeroVolume, changeMuted])

  return (
    <View
      onPointerEnter={onHover}
      onPointerLeave={onEndHover}
      style={[a.relative]}>
      {hovered && !isTouchDevice && (
        <Animated.View
          entering={FadeIn.duration(100)}
          exiting={FadeOut.duration(100)}
          style={[a.absolute, a.w_full, {height: 100, bottom: '100%'}]}>
          <View
            style={[
              a.flex_1,
              a.mb_xs,
              a.px_2xs,
              a.py_xs,
              {backgroundColor: 'rgba(0, 0, 0, 0.6)'},
              a.rounded_xs,
              a.align_center,
            ]}>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderVolume}
              aria-label={_(msg`Volume`)}
              style={
                // Ridiculous safari hack for old version of safari. Fixed in sonoma beta -h
                isSafari ? {height: 92, minHeight: '100%'} : {height: '100%'}
              }
              onChange={onVolumeChange}
              // @ts-expect-error for old versions of firefox, and then re-using it for targeting the CSS -sfn
              orient="vertical"
            />
          </View>
        </Animated.View>
      )}
      <ControlButton
        active={muted || volume === 0}
        activeLabel={_(msg({message: `Unmute`, context: 'video'}))}
        inactiveLabel={_(msg({message: `Mute`, context: 'video'}))}
        activeIcon={MuteIcon}
        inactiveIcon={UnmuteIcon}
        onPress={onPressMute}
      />
    </View>
  )
}

function sliderVolumeToVideoVolume(value: number) {
  return Math.pow(value / 100, 4)
}

function videoVolumeToSliderVolume(value: number) {
  return Math.round(Math.pow(value, 1 / 4) * 100)
}
