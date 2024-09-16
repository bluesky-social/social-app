import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {ControlButton} from './ControlButton'

export function VolumeControl({
  muted,
  onMute,
}: {
  muted: boolean
  // volume: number
  // onVolumeChange: (volume: number) => void
  onMute: () => void
  onHover: (hovered: boolean) => void
}) {
  const {_} = useLingui()
  return (
    <ControlButton
      active={muted}
      activeLabel={_(msg({message: `Unmute`, context: 'video'}))}
      inactiveLabel={_(msg({message: `Mute`, context: 'video'}))}
      activeIcon={MuteIcon}
      inactiveIcon={UnmuteIcon}
      onPress={onMute}
    />
  )
}
