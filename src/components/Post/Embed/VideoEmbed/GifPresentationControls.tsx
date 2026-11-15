import {ActivityIndicator, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {atoms as a, useTheme} from '#/alf'
import {AltBadgeWithDialog} from '#/components/AltBadgeWithDialog'
import {Button} from '#/components/Button'
import {Fill} from '#/components/Fill'
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
  const largeBadge = useLargeAltBadgeEnabled()

  return (
    <>
      <Button
        label={isPlaying ? _(msg`Pause GIF`) : _(msg`Play GIF`)}
        accessibilityHint={_(msg`Plays or pauses the GIF`)}
        style={[
          a.absolute,
          a.align_center,
          a.justify_center,
          a.inset_0,
          {zIndex: 2},
        ]}
        onPress={onPress}>
        {isLoading ? (
          <View style={[a.align_center, a.justify_center]}>
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : !isPlaying ? (
          <PlayButtonIcon />
        ) : (
          <></>
        )}
      </Button>
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
      <View
        style={[
          a.absolute,
          a.flex_row,
          a.z_10,
          {
            bottom: a.p_xs.padding,
            right: a.p_xs.padding,
            gap: 3,
          },
          largeBadge && {
            gap: 4,
          },
        ]}>
        <View
          accessible={false}
          style={[
            a.justify_center,
            a.rounded_sm,
            a.p_xs,
            a.z_10,
            t.atoms.bg_contrast_25,
            largeBadge && {
              padding: 6,
            },
            {
              opacity: 0.8,
            },
          ]}>
          <Text style={[a.font_bold, largeBadge ? a.text_xs : {fontSize: 8}]}>
            <Trans>GIF</Trans>
          </Text>
        </View>
        {altText && <AltBadgeWithDialog text={altText} />}
      </View>
    </>
  )
}
