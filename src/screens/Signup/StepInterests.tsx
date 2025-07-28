import React from 'react'
import { View } from 'react-native'
import { msg, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'

import { logger } from '#/logger'
import { ScreenTransition } from '#/screens/Login/ScreenTransition'
import { useSignupContext } from '#/screens/Signup/state'
import { atoms as a } from '#/alf'
import { Button, ButtonIcon, ButtonText } from '#/components/Button'
import { InterestsCard } from '#/components/InterestsCard'
import { Loader } from '#/components/Loader'
import { Text } from '#/components/Typography'

export function StepInterests() {
  const { _ } = useLingui()
  const { state, dispatch } = useSignupContext()

  const onNextPress = React.useCallback(() => {
    logger.metric(
      'signup:nextPressed',
      {
        activeStep: state.activeStep,
      },
      { statsig: true },
    )
    dispatch({ type: 'next' })
  }, [dispatch, state.activeStep])

  const onBackPress = React.useCallback(() => {
    dispatch({ type: 'prev' })
  }, [dispatch])

  return (
    <ScreenTransition>
      <View style={[a.gap_md]}>
        <View style={[a.align_start]}>
          <Text style={[{ fontSize: 17, fontWeight: 400, lineHeight: 21 }]}>
            <Trans>
              Let us know your interests. We’ll use this to help customize your
              feeds.
            </Trans>
          </Text>
        </View>
        <InterestsCard
          image={require('../../../assets/images/interests/book.png')}
        />
      </View>
      <View
        style={[
          a.border_t,
          a.mt_lg,
          { borderColor: '#D8D8D8', borderWidth: 1 },
        ]}
      />
      <View style={[a.flex_row, a.align_center, a.pt_lg]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onBackPress}>
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        <Button
          testID="nextBtn"
          label={_(msg`Continue to next step`)}
          accessibilityHint={_(msg`Continues to next step`)}
          variant="solid"
          color="primary"
          size="large"
          disabled={state.isLoading}
          onPress={onNextPress}>
          <ButtonText>
            <Trans>Next</Trans>
          </ButtonText>
          {state.isLoading && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </ScreenTransition>
  )
}
