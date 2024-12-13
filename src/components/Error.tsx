import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGoBack} from '#/lib/hooks/useGoBack'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function Error({
  title,
  message,
  onRetry,
  onGoBack,
  hideBackButton,
  sideBorders = true,
}: {
  title?: string
  message?: string
  onRetry?: () => unknown
  onGoBack?: () => unknown
  hideBackButton?: boolean
  sideBorders?: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const goBack = useGoBack(onGoBack)

  return (
    <CenteredView
      style={[
        a.h_full_vh,
        a.align_center,
        a.gap_5xl,
        !gtMobile && a.justify_between,
        t.atoms.border_contrast_low,
        {paddingTop: 175, paddingBottom: 110},
      ]}
      sideBorders={sideBorders}>
      <View style={[a.w_full, a.align_center, a.gap_lg]}>
        <Text style={[a.font_bold, a.text_3xl]}>{title}</Text>
        <Text
          style={[
            a.text_md,
            a.text_center,
            t.atoms.text_contrast_high,
            {lineHeight: 1.4},
            gtMobile ? {width: 450} : [a.w_full, a.px_lg],
          ]}>
          {message}
        </Text>
      </View>
      <View style={[a.gap_md, gtMobile ? {width: 350} : [a.w_full, a.px_lg]]}>
        {onRetry && (
          <Button
            variant="solid"
            color="primary"
            label={_(msg`Press to retry`)}
            onPress={onRetry}
            size="large"
            style={[a.rounded_sm, a.overflow_hidden, {paddingVertical: 10}]}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
          </Button>
        )}
        {!hideBackButton && (
          <Button
            variant="solid"
            color={onRetry ? 'secondary' : 'primary'}
            label={_(msg`Return to previous page`)}
            onPress={goBack}
            size="large"
            style={[a.rounded_sm, a.overflow_hidden, {paddingVertical: 10}]}>
            <ButtonText>
              <Trans>Go Back</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
    </CenteredView>
  )
}
