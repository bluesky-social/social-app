import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateIcon} from '#/components/icons/ArrowRotateCounterClockwise'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text as TypoText} from '#/components/Typography'

export function Container({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_1,
        t.atoms.bg_contrast_25,
        a.justify_center,
        a.align_center,
        a.px_lg,
        a.rounded_md,
        a.overflow_hidden,
        a.gap_lg,
      ]}>
      {children}
      <MediaInsetBorder />
    </View>
  )
}

export function Text({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <TypoText
      style={[
        a.text_center,
        t.atoms.text_contrast_high,
        a.text_md,
        a.leading_snug,
        {maxWidth: 300},
      ]}>
      {children}
    </TypoText>
  )
}

export function RetryButton({onPress}: {onPress: () => void}) {
  const {_} = useLingui()

  return (
    <Button
      onPress={onPress}
      size="small"
      color="secondary_inverted"
      label={_(msg`Retry`)}>
      <ButtonIcon icon={ArrowRotateIcon} />
      <ButtonText>
        <Trans>Retry</Trans>
      </ButtonText>
    </Button>
  )
}
