import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon} from '#/components/icons/ArrowRotate'
import {Warning_Stroke2_Corner0_Rounded_Large as WarningIcon} from '#/components/icons/Warning'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function ErrorScreen({
  title,
  message,
  details,
  onPressTryAgain,
  testID,
  showHeader,
}: {
  title: string
  message: string
  details?: string
  onPressTryAgain?: () => void
  testID?: string
  showHeader?: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Layout.Center testID={testID}>
      {showHeader && (
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Error</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
      )}
      <View style={[a.px_xl, a.py_5xl]}>
        <View style={[a.mb_sm, a.align_center]}>
          <WarningIcon size="4xl" style={{color: t.palette.yellow}} />
        </View>
        <Text style={[a.text_center, a.font_semi_bold, a.text_xl, a.mb_xs]}>
          {title}
        </Text>
        <Text
          style={[
            a.text_center,
            a.text_md,
            t.atoms.text_contrast_high,
            a.mb_lg,
          ]}>
          {message}
        </Text>
        {details && (
          <View
            style={[
              a.w_full,
              a.border,
              t.atoms.border_contrast_medium,
              t.atoms.bg_contrast_25,
              a.mb_lg,
              a.py_sm,
              a.px_lg,
              a.rounded_sm,
              a.overflow_hidden,
            ]}>
            <Text
              testID={`${testID}-details`}
              style={[a.text_center, a.text_md, t.atoms.text_contrast_high]}>
              {details}
            </Text>
          </View>
        )}
        {onPressTryAgain && (
          <View style={[a.align_center]}>
            <Button
              testID="errorScreenTryAgainButton"
              onPress={onPressTryAgain}
              color="secondary_inverted"
              size="small"
              label={_(msg`Retry`)}
              accessibilityHint={_(
                msg`Retries the last action, which errored out`,
              )}>
              <ButtonIcon icon={ArrowRotateCounterClockwiseIcon} />
              <ButtonText>
                <Trans context="action">Try again</Trans>
              </ButtonText>
            </Button>
          </View>
        )}
      </View>
    </Layout.Center>
  )
}
