import React from 'react'
import {Pressable, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import {EmbedPlayerParams} from 'lib/strings/embed-player'
import {useAutoplayDisabled} from 'state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {GifView} from '../../../../../modules/expo-bluesky-gif-view'
import {GifViewStateChangeEvent} from '../../../../../modules/expo-bluesky-gif-view/src/GifView.types'

function PlaybackControls({
  onPress,
  isPlaying,
  isLoaded,
}: {
  onPress: () => void
  isPlaying: boolean
  isLoaded: boolean
}) {
  const t = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        a.absolute,
        a.align_center,
        a.justify_center,
        !isLoaded && a.border,
        t.atoms.border_contrast_medium,
        {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 2,
          backgroundColor: !isLoaded
            ? t.atoms.bg_contrast_25.backgroundColor
            : !isPlaying
            ? 'rgba(0, 0, 0, 0.3)'
            : undefined,
        },
      ]}
      onPress={onPress}>
      {!isLoaded ? (
        <View>
          <View style={[a.align_center, a.justify_center]}>
            <Loader size="xl" />
          </View>
        </View>
      ) : !isPlaying ? (
        <View
          style={[
            a.rounded_full,
            a.align_center,
            a.justify_center,
            {
              backgroundColor: t.palette.primary_500,
              width: 60,
              height: 60,
            },
          ]}>
          <FontAwesomeIcon
            icon="play"
            size={42}
            color="white"
            style={{marginLeft: 8}}
          />
        </View>
      ) : undefined}
    </Pressable>
  )
}

export function GifEmbed({
  params,
  thumb,
}: {
  params: EmbedPlayerParams
  thumb?: string
}) {
  const autoplayDisabled = useAutoplayDisabled()

  const playerRef = React.useRef<GifView>(null)

  const [playerState, setPlayerState] = React.useState<{
    isPlaying: boolean
    isLoaded: boolean
  }>({
    isPlaying: !autoplayDisabled,
    isLoaded: false,
  })

  const onPlayerStateChange = React.useCallback(
    (e: GifViewStateChangeEvent) => {
      setPlayerState(e.nativeEvent)
    },
    [],
  )

  const onPress = React.useCallback(() => {
    playerRef.current?.toggleAsync()
  }, [])

  return (
    <View style={[a.rounded_sm, a.overflow_hidden, a.mt_sm]}>
      <View
        style={[
          a.rounded_sm,
          a.overflow_hidden,
          {
            aspectRatio: params.dimensions!.width / params.dimensions!.height,
          },
        ]}>
        <PlaybackControls
          onPress={onPress}
          isPlaying={playerState.isPlaying}
          isLoaded={playerState.isLoaded}
        />
        <GifView
          source={params.playerUri}
          placeholderSource={thumb}
          style={[a.flex_1, a.rounded_sm]}
          autoplay={!autoplayDisabled}
          onPlayerStateChange={onPlayerStateChange}
          ref={playerRef}
        />
      </View>
    </View>
  )
}
