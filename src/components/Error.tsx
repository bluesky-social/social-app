import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useGoBack} from '#/lib/hooks/useGoBack'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {type Props as SVGIconProps} from '#/components/icons/common'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function Error({
  icon: Icon,
  title,
  message,
  onRetry,
  onGoBack,
  hideBackButton,
  secondaryAction,
  isRetrying,
}: {
  icon?: React.ComponentType<SVGIconProps>
  title?: string
  message?: string
  onRetry?: () => unknown
  onGoBack?: () => unknown
  hideBackButton?: boolean
  isRetrying?: boolean
  secondaryAction?: {
    label: string
    accessibilityLabel?: string
    onPress: () => unknown
  }
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

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
      <View style={[a.w_full, a.align_center, a.gap_lg, a.px_md]}>
        {Icon && <Icon size="4xl" fill={t.atoms.text_contrast_medium.color} />}
        <Text style={[a.font_semi_bold, a.text_3xl, a.text_center]}>
          {title}
        </Text>
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
            color="primary"
            label={l`Press to retry`}
            onPress={onRetry}
            disabled={isRetrying}
            size="large">
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
            {isRetrying && <ButtonIcon icon={Loader} />}
          </Button>
        )}
        {!hideBackButton && secondaryAction ? (
          <Button
            color={onRetry ? 'secondary' : 'primary'}
            label={secondaryAction.accessibilityLabel ?? secondaryAction.label}
            onPress={secondaryAction.onPress}
            disabled={isRetrying}
            size="large">
            <ButtonText>{secondaryAction.label}</ButtonText>
          </Button>
        ) : !hideBackButton ? (
          <GoBackButton
            hasRetry={Boolean(onRetry)}
            isRetrying={isRetrying}
            onGoBack={onGoBack}
          />
        ) : null}
      </View>
    </Layout.Center>
  )
}

function GoBackButton({
  hasRetry,
  isRetrying,
  onGoBack,
}: {
  hasRetry: boolean
  isRetrying?: boolean
  onGoBack?: () => unknown
}) {
  const {t: l} = useLingui()
  const goBack = useGoBack(onGoBack)

  return (
    <Button
      variant="solid"
      color={hasRetry ? 'secondary' : 'primary'}
      label={l`Return to previous page`}
      onPress={goBack}
      disabled={isRetrying}
      size="large">
      <ButtonText>
        <Trans>Go Back</Trans>
      </ButtonText>
    </Button>
  )
}
