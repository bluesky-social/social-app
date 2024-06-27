import * as React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {IStep, Labels} from 'rn-tourguide'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export interface TooltipComponentProps {
  isFirstStep?: boolean
  isLastStep?: boolean
  currentStep: IStep
  labels?: Labels
  handleNext?: () => void
  handlePrev?: () => void
  handleStop?: () => void
}

export function TooltipComponent({
  isLastStep,
  handleNext,
  handleStop,
  currentStep,
  labels,
}: TooltipComponentProps) {
  const t = useTheme()
  const {_} = useLingui()
  return (
    <View
      style={[
        t.atoms.bg,
        a.px_lg,
        a.py_lg,
        a.flex_col,
        a.gap_lg,
        a.rounded_sm,
        a.shadow_md,
        {maxWidth: 300},
      ]}>
      <View style={[]}>
        <Text testID="stepDescription" style={[a.text_lg, a.leading_snug]}>
          {currentStep && currentStep.text}
        </Text>
      </View>
      {!isLastStep ? (
        <Button
          variant="gradient"
          color="gradient_sky"
          size="medium"
          onPress={handleNext}
          label={labels?.next || _(msg`Next`)}>
          <ButtonText>{labels?.next || _(msg`Next`)}</ButtonText>
        </Button>
      ) : (
        <Button
          variant="gradient"
          color="gradient_sky"
          size="medium"
          onPress={handleStop}
          label={labels?.finish || _(msg`Let's go!`)}>
          <ButtonText>{labels?.finish || _(msg`Let's go!`)}</ButtonText>
        </Button>
      )}
    </View>
  )
}
