import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useGoBack} from '#/lib/hooks/useGoBack'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function Error({
  title,
  message,
  onRetry,
  onGoBack,
  hideBackButton,
}: {
  title?: string
  message?: string
  onRetry?: () => unknown
  onGoBack?: () => unknown
  hideBackButton?: boolean
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const goBack = useGoBack(onGoBack)

  return (
    <Layout.Center
      style={[
        a.h_full_vh,
        a.align_center,
        a.gap_5xl,
        !gtMobile && a.justify_between,
        t.atoms.border_contrast_low,
        {paddingTop: 175, paddingBottom: 110},
      ]}>
      <View style={[a.w_full, a.align_center, a.gap_lg]}>
        <Text style={[a.font_semi_bold, a.text_3xl]}>{title}</Text>
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
            label={l`Press to retry`}
            onPress={onRetry}
            size="large">
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
          </Button>
        )}
        {!hideBackButton && (
          <Button
            variant="solid"
            color={onRetry ? 'secondary' : 'primary'}
            label={l`Return to previous page`}
            onPress={goBack}
            size="large">
            <ButtonText>
              <Trans>Go Back</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
    </Layout.Center>
  )
}
