import {useRef, useState} from 'react'
import {
  type StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_20} from '#/lib/constants'
import {clamp} from '#/lib/numbers'
import {type EmbedPlayerParams} from '#/lib/strings/embed-player'
import {useAutoplayDisabled} from '#/state/preferences'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {atoms as a, useTheme} from '#/alf'
import {Fill} from '#/components/Fill'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {GifView} from '../../../../../modules/expo-bluesky-gif-view'
import {type GifViewStateChangeEvent} from '../../../../../modules/expo-bluesky-gif-view/src/GifView.types'
import {GifPresentationControls} from '../VideoEmbed/GifPresentationControls'

export function GifEmbed({
  params,
  thumb,
  altText,
  isPreferredAltText,
  hideAlt,
  style = {width: '100%'},
}: {
  params: EmbedPlayerParams
  thumb: string | undefined
  altText: string
  isPreferredAltText: boolean
  hideAlt?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const {_} = useLingui()
  const autoplayDisabled = useAutoplayDisabled()

  const playerRef = useRef<GifView>(null)

  const [playerState, setPlayerState] = useState<{
    isPlaying: boolean
    isLoaded: boolean
  }>({
    isPlaying: !autoplayDisabled,
    isLoaded: false,
  })

  const onPlayerStateChange = (e: GifViewStateChangeEvent) => {
    setPlayerState(e.nativeEvent)
  }

  const onPress = () => {
    void playerRef.current?.toggleAsync()
  }

  let aspectRatio = 1
  if (params.dimensions) {
    const ratio = params.dimensions.width / params.dimensions.height
    aspectRatio = clamp(ratio, 0.75, 4)
  }

  return (
    <View
      style={[
        a.rounded_md,
        a.overflow_hidden,
        {backgroundColor: t.palette.black},
        {aspectRatio},
        style,
      ]}>
      <View
        style={[
          a.absolute,
          /*
           * Aspect ratio was being clipped weirdly on web -esb
           */
          {
            top: -2,
            bottom: -2,
            left: -2,
            right: -2,
          },
        ]}>
        <MediaInsetBorder />
        <GifPresentationControls
          onPress={onPress}
          isPlaying={playerState.isPlaying}
          isLoading={!playerState.isLoaded}
        />
        <GifView
          source={params.playerUri}
          placeholderSource={thumb}
          style={[a.flex_1]}
          autoplay={!autoplayDisabled}
          onPlayerStateChange={onPlayerStateChange}
          ref={playerRef}
          accessibilityHint={_(msg`Animated GIF`)}
          accessibilityLabel={altText}
        />
        {!playerState.isPlaying && (
          <Fill
            style={[
              t.name === 'light' ? t.atoms.bg_contrast_975 : t.atoms.bg,
              {
                opacity: 0.3,
              },
            ]}
          />
        )}
        {!hideAlt && isPreferredAltText && <AltText text={altText} />}
      </View>
    </View>
  )
}

function AltText({text}: {text: string}) {
  const control = Prompt.usePromptControl()
  const largeAltBadge = useLargeAltBadgeEnabled()

  const {_} = useLingui()
  return (
    <>
      <TouchableOpacity
        testID="altTextButton"
        accessibilityRole="button"
        accessibilityLabel={_(msg`Show alt text`)}
        accessibilityHint=""
        hitSlop={HITSLOP_20}
        onPress={control.open}
        style={styles.altContainer}>
        <Text
          style={[styles.alt, largeAltBadge && a.text_xs]}
          accessible={false}>
          <Trans>ALT</Trans>
        </Text>
      </TouchableOpacity>
      <Prompt.Outer control={control}>
        <Prompt.Content>
          <Prompt.TitleText>
            <Trans>Alt Text</Trans>
          </Prompt.TitleText>
          <Prompt.DescriptionText selectable>{text}</Prompt.DescriptionText>
        </Prompt.Content>
        <Prompt.Actions>
          <Prompt.Action
            onPress={() => control.close()}
            cta={_(msg`Close`)}
            color="secondary"
          />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}

const styles = StyleSheet.create({
  altContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: IS_WEB ? 8 : 6,
    paddingVertical: IS_WEB ? 6 : 3,
    position: 'absolute',
    // Related to margin/gap hack. This keeps the alt label in the same position
    // on all platforms
    right: IS_WEB ? 8 : 5,
    bottom: IS_WEB ? 8 : 5,
    zIndex: 2,
  },
  alt: {
    color: 'white',
    fontSize: IS_WEB ? 10 : 7,
    fontWeight: '600',
  },
})
