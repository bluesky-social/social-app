import {Pressable, StyleSheet, TouchableOpacity, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_20} from '#/lib/constants'
import {atoms as a, useTheme} from '#/alf'
import {Fill} from '#/components/Fill'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'

export function GifPresentationControls({
  onPress,
  isPlaying,
  isLoading,
  altText,
}: {
  onPress: () => void
  isPlaying: boolean
  isLoading?: boolean
  altText?: string
}) {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={_(msg`Plays or pauses the GIF`)}
        accessibilityLabel={isPlaying ? _(msg`Pause`) : _(msg`Play`)}
        style={[
          a.absolute,
          a.align_center,
          a.justify_center,
          a.inset_0,
          a.w_full,
          a.h_full,
          {zIndex: 2},
        ]}
        onPress={onPress}>
        {isLoading ? (
          <View style={[a.align_center, a.justify_center]}>
            <Loader size="xl" />
          </View>
        ) : !isPlaying ? (
          <PlayButtonIcon />
        ) : undefined}
      </Pressable>
      {!isPlaying && (
        <Fill
          style={[
            t.name === 'light' ? t.atoms.bg_contrast_975 : t.atoms.bg,
            {
              opacity: 0.2,
              zIndex: 1,
            },
          ]}
        />
      )}
      <View style={styles.gifBadgeContainer}>
        <Text style={[{color: 'white'}, a.font_bold, a.text_xs]}>
          <Trans>GIF</Trans>
        </Text>
      </View>
      {altText && <AltBadge text={altText} />}
    </>
  )
}

function AltBadge({text}: {text: string}) {
  const control = Prompt.usePromptControl()
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
        style={styles.altBadgeContainer}>
        <Text
          style={[{color: 'white'}, a.font_bold, a.text_xs]}
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
  gifBadgeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 3,
    position: 'absolute',
    left: 6,
    bottom: 6,
    zIndex: 2,
  },
  altBadgeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 3,
    position: 'absolute',
    right: 6,
    bottom: 6,
    zIndex: 2,
  },
})
