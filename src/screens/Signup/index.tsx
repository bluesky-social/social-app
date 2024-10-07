import React from 'react'
import {View} from 'react-native'
import Animated, {FadeIn, LayoutAnimationConfig} from 'react-native-reanimated'
import {AppBskyGraphStarterpack} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {FEEDBACK_FORM_URL} from '#/lib/constants'
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
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
import {Divider} from '#/components/Divider'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function Signup({onPressBack}: {onPressBack: () => void}) {
  const {_} = useLingui()
  const t = useTheme()
  const [state, dispatch] = React.useReducer(reducer, initialState)
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

  const [isFetchedAtMount] = React.useState(starterPack != null)
  const showStarterPackCard =
    activeStarterPack?.uri && !isFetchingStarterPack && starterPack

  const {
    data: serviceInfo,
    isFetching,
    isError,
    refetch,
  } = useServiceQuery(state.serviceUrl)

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

  React.useEffect(() => {
    if (state.pendingSubmit) {
      if (!state.pendingSubmit.mutableProcessed) {
        state.pendingSubmit.mutableProcessed = true
        submit(state, dispatch)
      }
    }
  }, [state, dispatch, submit])

  return (
    <SignupContext.Provider value={{state, dispatch}}>
      <LoggedOutLayout
        leadin=""
        title={_(msg`Create Account`)}
        description={_(msg`We're so excited to have you join us!`)}
        scrollable>
        <View testID="createAccount" style={a.flex_1}>
          {showStarterPackCard &&
          AppBskyGraphStarterpack.isRecord(starterPack.record) ? (
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
                      You'll follow the suggested users once you finish creating
                      your account!
                    </Trans>
                  )}
                </Text>
              </LinearGradientBackground>
            </Animated.View>
          ) : null}
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
                  <Trans>Your user handle</Trans>
                ) : (
                  <Trans>Complete the challenge</Trans>
                )}
              </Text>
            </View>

            <LayoutAnimationConfig skipEntering skipExiting>
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
            </LayoutAnimationConfig>

            <Divider />

            <View
              style={[a.w_full, a.py_lg, a.flex_row, a.gap_lg, a.align_center]}>
              <AppLanguageDropdown />
              <Text
                style={[t.atoms.text_contrast_medium, !gtMobile && a.text_md]}>
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
        </View>
      </LoggedOutLayout>
    </SignupContext.Provider>
  )
}
