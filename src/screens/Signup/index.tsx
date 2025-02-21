import {useEffect, useReducer, useState} from 'react'
import {AppState, type AppStateStatus, View} from 'react-native'
import ReactNativeDeviceAttest from 'react-native-device-attest'
import Animated, {FadeIn, LayoutAnimationConfig} from 'react-native-reanimated'
import {AppBskyGraphStarterpack} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {FEEDBACK_FORM_URL} from '#/lib/constants'
import {logger} from '#/logger'
import {isAndroid} from '#/platform/detection'
import {useServiceQuery} from '#/state/queries/service'
import {useStarterPackQuery} from '#/state/queries/starter-packs'
import {useActiveStarterPack} from '#/state/shell/starter-pack'
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
import {atoms as a, native, useBreakpoints, useTheme} from '#/alf'
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
import {Divider} from '#/components/Divider'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import {InlineLinkText} from '#/components/Link'
import {ScreenTransition} from '#/components/ScreenTransition'
import {Text} from '#/components/Typography'
import {GCP_PROJECT_ID} from '#/env'
import * as bsky from '#/types/bsky'

export function Signup({onPressBack}: {onPressBack: () => void}) {
  const {_} = useLingui()
  const t = useTheme()
  const [state, dispatch] = useReducer(reducer, initialState)
  const {gtMobile} = useBreakpoints()
  const submit = useSubmitSignup()

  const activeStarterPack = useActiveStarterPack()
  const {
    data: starterPack,
    isFetching: isFetchingStarterPack,
    isError: isErrorStarterPack,
  } = useStarterPackQuery({
    uri: activeStarterPack?.uri,
  })

  const [isFetchedAtMount] = useState(starterPack != null)
  const showStarterPackCard =
    activeStarterPack?.uri && !isFetchingStarterPack && starterPack

  const {
    data: serviceInfo,
    isFetching,
    isError,
    refetch,
  } = useServiceQuery(state.serviceUrl)

  useEffect(() => {
    if (isFetching) {
      dispatch({type: 'setIsLoading', value: true})
    } else if (!isFetching) {
      dispatch({type: 'setIsLoading', value: false})
    }
  }, [isFetching])

  useEffect(() => {
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

  useEffect(() => {
    if (state.pendingSubmit) {
      if (!state.pendingSubmit.mutableProcessed) {
        state.pendingSubmit.mutableProcessed = true
        submit(state, dispatch)
      }
    }
  }, [state, dispatch, submit])

  // Track app backgrounding during signup
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'background') {
          dispatch({type: 'incrementBackgroundCount'})
        }
      },
    )

    return () => subscription.remove()
  }, [])

  // On Android, warmup the Play Integrity API on the signup screen so it is ready by the time we get to the gate screen.
  useEffect(() => {
    if (!isAndroid) {
      return
    }
    ReactNativeDeviceAttest.warmupIntegrity(GCP_PROJECT_ID).catch(err =>
      logger.error(err),
    )
  }, [])

  return (
    <Animated.View exiting={native(FadeIn.duration(90))} style={a.flex_1}>
      <SignupContext.Provider value={{state, dispatch}}>
        <LoggedOutLayout
          leadin=""
          title={_(msg`Create Account`)}
          description={_(msg`We're so excited to have you join us!`)}
          scrollable>
          <View testID="createAccount" style={a.flex_1}>
            {showStarterPackCard &&
            bsky.dangerousIsType<AppBskyGraphStarterpack.Record>(
              starterPack.record,
              AppBskyGraphStarterpack.isRecord,
            ) ? (
              <Animated.View entering={!isFetchedAtMount ? FadeIn : undefined}>
                <LinearGradientBackground
                  style={[a.mx_lg, a.p_lg, a.gap_sm, a.rounded_sm]}>
                  <Text style={[a.font_bold, a.text_xl, {color: 'white'}]}>
                    {starterPack.record.name}
                  </Text>
                  <Text style={[{color: 'white'}]}>
                    {starterPack.feeds?.length ? (
                      <Trans>
                        You'll follow the suggested users and feeds once you
                        finish creating your account!
                      </Trans>
                    ) : (
                      <Trans>
                        You'll follow the suggested users once you finish
                        creating your account!
                      </Trans>
                    )}
                  </Text>
                </LinearGradientBackground>
              </Animated.View>
            ) : null}
            <LayoutAnimationConfig skipEntering>
              <ScreenTransition
                key={state.activeStep}
                direction={state.screenTransitionDirection}>
                <View
                  style={[
                    a.flex_1,
                    a.px_xl,
                    a.pt_2xl,
                    !gtMobile && {paddingBottom: 100},
                  ]}>
                  <View style={[a.gap_sm, a.pb_3xl]}>
                    <Text style={[a.font_bold, t.atoms.text_contrast_medium]}>
                      <Trans>
                        Step {state.activeStep + 1} of{' '}
                        {state.serviceDescription &&
                        !state.serviceDescription.phoneVerificationRequired
                          ? '2'
                          : '3'}
                      </Trans>
                    </Text>
                    <Text style={[a.text_3xl, a.font_bold]}>
                      {state.activeStep === SignupStep.INFO ? (
                        <Trans>Your account</Trans>
                      ) : state.activeStep === SignupStep.HANDLE ? (
                        <Trans>Choose your username</Trans>
                      ) : (
                        <Trans>Complete the challenge</Trans>
                      )}
                    </Text>
                  </View>

                  {state.activeStep === SignupStep.INFO ? (
                    <StepInfo
                      onPressBack={onPressBack}
                      isLoadingStarterPack={
                        isFetchingStarterPack && !isErrorStarterPack
                      }
                      isServerError={isError}
                      refetchServer={refetch}
                    />
                  ) : state.activeStep === SignupStep.HANDLE ? (
                    <StepHandle />
                  ) : (
                    <StepCaptcha />
                  )}

                  <Divider />

                  <View
                    style={[
                      a.w_full,
                      a.py_lg,
                      a.flex_row,
                      a.gap_md,
                      a.align_center,
                    ]}>
                    <AppLanguageDropdown />
                    <Text
                      style={[
                        a.flex_1,
                        t.atoms.text_contrast_medium,
                        !gtMobile && a.text_md,
                      ]}>
                      <Trans>Having trouble?</Trans>{' '}
                      <InlineLinkText
                        label={_(msg`Contact support`)}
                        to={FEEDBACK_FORM_URL({email: state.email})}
                        style={[!gtMobile && a.text_md]}>
                        <Trans>Contact support</Trans>
                      </InlineLinkText>
                    </Text>
                  </View>
                </View>
              </ScreenTransition>
            </LayoutAnimationConfig>
          </View>
        </LoggedOutLayout>
      </SignupContext.Provider>
    </Animated.View>
  )
}
