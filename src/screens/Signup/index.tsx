import React from 'react'
import {View} from 'react-native'
import {LayoutAnimationConfig} from 'react-native-reanimated'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {FEEDBACK_FORM_URL} from '#/lib/constants'
import {logEvent} from '#/lib/statsig/statsig'
import {createFullHandle} from '#/lib/strings/handles'
import {useServiceQuery} from '#/state/queries/service'
import {getAgent} from '#/state/session'
import {LoggedOutLayout} from '#/view/com/util/layouts/LoggedOutLayout'
import {
  initialState,
  reducer,
  SignupContext,
  SignupStep,
  useSubmitSignup,
} from '#/screens/Signup/state'
import {StepCaptcha} from '#/screens/Signup/StepCaptcha'
import {StepHandle} from '#/screens/Signup/StepHandle'
import {StepInfo} from '#/screens/Signup/StepInfo'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {InlineLink} from '#/components/Link'
import {Text} from '#/components/Typography'

export function Signup({onPressBack}: {onPressBack: () => void}) {
  const {_} = useLingui()
  const t = useTheme()
  const {screen} = useAnalytics()
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const submit = useSubmitSignup({state, dispatch})
  const {gtMobile} = useBreakpoints()

  const {
    data: serviceInfo,
    isFetching,
    isError,
    refetch,
  } = useServiceQuery(state.serviceUrl)

  React.useEffect(() => {
    screen('CreateAccount')
  }, [screen])

  React.useEffect(() => {
    if (isFetching) {
      dispatch({type: 'setIsLoading', value: true})
    } else if (!isFetching) {
      dispatch({type: 'setIsLoading', value: false})
    }
  }, [isFetching])

  React.useEffect(() => {
    if (isError) {
      dispatch({type: 'setServiceDescription', value: undefined})
      dispatch({
        type: 'setError',
        value: _(
          msg`Unable to contact your service. Please check your Internet connection.`,
        ),
      })
    } else if (serviceInfo) {
      dispatch({type: 'setServiceDescription', value: serviceInfo})
      dispatch({type: 'setError', value: ''})
    }
  }, [_, serviceInfo, isError])

  const onNextPress = React.useCallback(async () => {
    if (state.activeStep === SignupStep.HANDLE) {
      try {
        dispatch({type: 'setIsLoading', value: true})

        const res = await getAgent().resolveHandle({
          handle: createFullHandle(state.handle, state.userDomain),
        })

        if (res.data.did) {
          dispatch({
            type: 'setError',
            value: _(msg`That handle is already taken.`),
          })
          return
        }
      } catch (e) {
        // Don't have to handle
      } finally {
        dispatch({type: 'setIsLoading', value: false})
      }
    }

    // phoneVerificationRequired is actually whether a captcha is required
    if (
      state.activeStep === SignupStep.HANDLE &&
      !state.serviceDescription?.phoneVerificationRequired
    ) {
      submit()
      return
    }

    dispatch({type: 'next'})
    logEvent('signup:nextPressed', {
      activeStep: state.activeStep,
    })
  }, [
    _,
    state.activeStep,
    state.handle,
    state.serviceDescription?.phoneVerificationRequired,
    state.userDomain,
    submit,
  ])

  const onBackPress = React.useCallback(() => {
    if (state.activeStep !== SignupStep.INFO) {
      dispatch({type: 'prev'})
    } else {
      onPressBack()
    }
  }, [onPressBack, state.activeStep])

  return (
    <SignupContext.Provider value={{state, dispatch}}>
      <LoggedOutLayout
        leadin=""
        title={_(msg`Create Account`)}
        description={_(msg`We're so excited to have you join us!`)}
        scrollable>
        <View testID="createAccount" style={a.flex_1}>
          <View
            style={[
              a.flex_1,
              a.px_xl,
              a.pt_2xl,
              !gtMobile && {paddingBottom: 100},
            ]}>
            <View style={[a.gap_sm, a.pb_3xl]}>
              <Text style={[a.font_semibold, t.atoms.text_contrast_medium]}>
                <Trans>Step</Trans> {state.activeStep + 1} <Trans>of</Trans>{' '}
                {state.serviceDescription &&
                !state.serviceDescription.phoneVerificationRequired
                  ? '2'
                  : '3'}
              </Text>
              <Text style={[a.text_3xl, a.font_bold]}>
                {state.activeStep === SignupStep.INFO ? (
                  <Trans>Your account</Trans>
                ) : state.activeStep === SignupStep.HANDLE ? (
                  <Trans>Your user handle</Trans>
                ) : (
                  <Trans>Complete the challenge</Trans>
                )}
              </Text>
            </View>

            <View style={[a.pb_3xl]}>
              <LayoutAnimationConfig skipEntering skipExiting>
                {state.activeStep === SignupStep.INFO ? (
                  <StepInfo />
                ) : state.activeStep === SignupStep.HANDLE ? (
                  <StepHandle />
                ) : (
                  <StepCaptcha />
                )}
              </LayoutAnimationConfig>
            </View>

            <View style={[a.flex_row, a.justify_between, a.pb_lg]}>
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
              {state.activeStep !== SignupStep.CAPTCHA && (
                <>
                  {isError ? (
                    <Button
                      label={_(msg`Press to retry`)}
                      variant="solid"
                      color="primary"
                      size="medium"
                      disabled={state.isLoading}
                      onPress={() => refetch()}>
                      <ButtonText>
                        <Trans>Retry</Trans>
                      </ButtonText>
                    </Button>
                  ) : (
                    <Button
                      label={_(msg`Continue to next step`)}
                      variant="solid"
                      color="primary"
                      size="medium"
                      disabled={!state.canNext || state.isLoading}
                      onPress={onNextPress}>
                      <ButtonText>
                        <Trans>Next</Trans>
                      </ButtonText>
                    </Button>
                  )}
                </>
              )}
            </View>

            <Divider />

            <View style={[a.w_full, a.py_lg]}>
              <Text style={[t.atoms.text_contrast_medium]}>
                <Trans>Having trouble?</Trans>{' '}
                <InlineLink to={FEEDBACK_FORM_URL({email: state.email})}>
                  <Trans>Contact support</Trans>
                </InlineLink>
              </Text>
            </View>
          </View>
        </View>
      </LoggedOutLayout>
    </SignupContext.Provider>
  )
}
