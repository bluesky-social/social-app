import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {useSignupContext} from '#/screens/Signup/state'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function StepVerification() {
  const {_} = useLingui()
  const {state, dispatch} = useSignupContext()

  const onNextPress = React.useCallback(() => {
    logger.metric(
      'signup:nextPressed',
      {
        activeStep: state.activeStep,
      },
      {statsig: true},
    )
    dispatch({type: 'next'})
  }, [dispatch, state.activeStep])

  const onBackPress = React.useCallback(() => {
    dispatch({type: 'prev'})
  }, [dispatch])

  return (
    <ScreenTransition>
      <View style={[a.gap_md]}>
        <View style={[a.align_center]}>
          <Text style={[{fontSize: 17, fontWeight: 400, lineHeight: 21}]}>
            <Trans>
              At Gander, we’re working hard to create a safer, more positive
              space by reducing bots, disinformation, and bad actors.
              {'\n\n'}We use goConfirm, a Canadian third-party, to verify that
              every user is a real person.
            </Trans>
          </Text>
        </View>
        <View style={[a.align_center, a.mt_sm]}>
          <Text style={[{fontSize: 17, fontWeight: 700, lineHeight: 21}]}>
            <Trans>
              Gander never sees your personal info, and you can choose to have
              it destroyed right after verification.
            </Trans>
          </Text>
        </View>
      </View>
      <View
        style={[a.border_t, a.mt_lg, {borderColor: '#D8D8D8', borderWidth: 1}]}
      />
      <View style={[a.flex_row, a.align_center, a.pt_lg]}>
        <Button
          label={_(msg`Cancel`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onBackPress}>
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        <Button
          testID="nextBtn"
          label={_(msg`Start verification`)}
          accessibilityHint={_(msg`Starts verification process`)}
          variant="solid"
          color="primary"
          size="large"
          disabled={state.isLoading}
          onPress={onNextPress}>
          <ButtonText>
            <Trans>Start Verification</Trans>
          </ButtonText>
          {state.isLoading && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </ScreenTransition>
  )
}
