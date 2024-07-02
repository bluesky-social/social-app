import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Loader} from '#/components/Loader'

export interface BackNextButtonsProps {
  hideNext?: boolean
  showRetry?: boolean
  isLoading: boolean
  isNextDisabled?: boolean
  onBackPress: () => void
  onNextPress?: () => void
  onRetryPress?: () => void
}

export function BackNextButtons({
  hideNext,
  showRetry,
  isLoading,
  isNextDisabled,
  onBackPress,
  onNextPress,
  onRetryPress,
}: BackNextButtonsProps) {
  const {_} = useLingui()

  return (
    <View style={[a.flex_row, a.justify_between, a.pb_lg, a.pt_3xl]}>
      <Button
        label={_(msg`Go back to previous step`)}
        variant="solid"
        color="secondary"
        size="medium"
        onPress={onBackPress}>
        <ButtonText>
          <Trans>Back</Trans>
        </ButtonText>
      </Button>
      {!hideNext &&
        (showRetry ? (
          <Button
            label={_(msg`Press to retry`)}
            variant="solid"
            color="primary"
            size="medium"
            onPress={onRetryPress}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
            {isLoading && <ButtonIcon icon={Loader} />}
          </Button>
        ) : (
          <Button
            testID="nextBtn"
            label={_(msg`Continue to next step`)}
            variant="solid"
            color="primary"
            size="medium"
            disabled={isLoading || isNextDisabled}
            onPress={onNextPress}>
            <ButtonText>
              <Trans>Next</Trans>
            </ButtonText>
            {isLoading && <ButtonIcon icon={Loader} />}
          </Button>
        ))}
    </View>
  )
}
