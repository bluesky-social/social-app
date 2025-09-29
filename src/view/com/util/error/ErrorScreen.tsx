import {View} from 'react-native'
import {
  FontAwesomeIcon,
  type FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon} from '#/components/icons/ArrowRotateCounterClockwise'
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
  const pal = usePalette('default')
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
      <View style={[a.px_xl, a.py_2xl]}>
        <View style={[a.mb_md, a.align_center]}>
          <View
            style={[
              a.rounded_full,
              {width: 50, height: 50},
              a.align_center,
              a.justify_center,
              {backgroundColor: t.palette.contrast_950},
            ]}>
            <FontAwesomeIcon
              icon="exclamation"
              style={pal.textInverted as FontAwesomeIconStyle}
              size={24}
            />
          </View>
        </View>
        <Text style={[a.text_center, a.font_bold, a.text_2xl, a.mb_md]}>
          {title}
        </Text>
        <Text style={[a.text_center, a.text_md, a.mb_xl]}>{message}</Text>
        {details && (
          <View
            style={[
              a.w_full,
              a.border,
              t.atoms.border_contrast_medium,
              t.atoms.bg_contrast_25,
              a.mb_xl,
              a.py_sm,
              a.px_lg,
              a.rounded_xs,
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
              variant="solid"
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
