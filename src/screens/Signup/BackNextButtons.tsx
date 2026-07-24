import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Loader} from '#/components/Loader'

export interface BackNextButtonsProps {
  hideNext?: boolean
  showRetry?: boolean
  isLoading?: boolean
  isNextDisabled?: boolean
  onBackPress: () => void
  onNextPress?: () => void
  onRetryPress?: () => void
  overrideNextText?: string
}

export function BackNextButtons({
  hideNext,
  showRetry,
  isLoading,
  isNextDisabled,
  onBackPress,
  onNextPress,
  onRetryPress,
  overrideNextText,
}: BackNextButtonsProps) {
  const {t: l} = useLingui()

  return (
    <View style={[a.flex_row, a.justify_between, a.pb_lg, a.pt_3xl]}>
      <Button
        label={l`Go back to previous step`}
        variant="solid"
        color="secondary"
        size="large"
        onPress={onBackPress}>
        <ButtonText>
          <Trans>Back</Trans>
        </ButtonText>
      </Button>
      {!hideNext &&
        (showRetry ? (
          <Button
            label={l`Press to retry`}
            variant="solid"
            color="primary"
            size="large"
            onPress={onRetryPress}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
            {isLoading && <ButtonIcon icon={Loader} />}
          </Button>
        ) : (
          <Button
            testID="nextBtn"
            label={l`Continue to next step`}
            variant="solid"
            color="primary"
            size="large"
            disabled={isLoading || isNextDisabled}
            onPress={onNextPress}>
            <ButtonText>
              {overrideNextText ? overrideNextText : <Trans>Next</Trans>}
            </ButtonText>
            {isLoading && <ButtonIcon icon={Loader} />}
          </Button>
        ))}
    </View>
  )
}
