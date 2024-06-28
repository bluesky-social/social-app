import * as React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {IStep, Labels} from 'rn-tourguide'

import {Logo} from '#/view/icons/Logo'
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
        a.gap_md,
        a.rounded_sm,
        a.shadow_md,
        {maxWidth: 300},
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <Logo width={16} style={{position: 'relative', top: 0}} />
        <Text
          style={[a.text_sm, a.font_semibold, t.atoms.text_contrast_medium]}>
          <Trans>Quick tip</Trans>
        </Text>
      </View>
      <Text
        testID="stepDescription"
        style={[a.text_md, a.leading_snug, a.pb_sm]}>
        {currentStep && currentStep.text}
      </Text>
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
