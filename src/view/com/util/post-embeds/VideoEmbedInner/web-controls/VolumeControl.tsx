import React, {useCallback} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {ControlButton} from './ControlButton'

export function VolumeControl({
  muted,
  onMute,
  volume,
  changeVolume,
  hovered,
  onHover,
  onEndHover,
  drawFocus,
}: {
  muted: boolean
  volume: number
  changeVolume: (volume: number) => void
  onMute: () => void
  hovered: boolean
  onHover: () => void
  onEndHover: () => void
  drawFocus: () => void
}) {
  const {_} = useLingui()

  const onVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      drawFocus()
      changeVolume(sliderVolumeToVideoVolume(Number(e.target.value)))
    },
    [changeVolume, drawFocus],
  )

  return (
    <View
      onPointerEnter={onHover}
      onPointerLeave={onEndHover}
      style={[a.relative]}>
      {hovered && (
        <View style={[a.absolute, a.w_full, {height: 100, bottom: '100%'}]}>
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
              value={videoVolumeToSliderVolume(volume)}
              style={{height: '100%'}}
              onChange={onVolumeChange}
              // @ts-expect-error for old versions of firefox -sfn
              orient="vertical"
            />
          </View>
        </View>
      )}
      <ControlButton
        active={muted}
        activeLabel={_(msg({message: `Unmute`, context: 'video'}))}
        inactiveLabel={_(msg({message: `Mute`, context: 'video'}))}
        activeIcon={MuteIcon}
        inactiveIcon={UnmuteIcon}
        onPress={onMute}
      />
    </View>
  )
}

function sliderVolumeToVideoVolume(value: number) {
  return Math.pow(value / 100, 4)
}

function videoVolumeToSliderVolume(value: number) {
  return Math.pow(value, 1 / 4) * 100
}
