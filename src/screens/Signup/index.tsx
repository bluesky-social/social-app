import {useEffect, useReducer, useState} from 'react'
import {AppState, type AppStateStatus, View} from 'react-native'
import Animated, {FadeIn, LayoutAnimationConfig} from 'react-native-reanimated'
import Svg, {Path} from 'react-native-svg'
import {AppGndrGraphStarterpack} from '@gander-social-atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

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
import {StepGandle} from '#/screens/Signup/StepGandle'
import {StepInfo} from '#/screens/Signup/StepInfo'
import {StepVerification} from '#/screens/Signup/StepVerification'
import {atoms as a, useBreakpoints} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import {Text} from '#/components/Typography'
import * as gndr from '#/types/gndr'

export function Signup({onPressBack}: {onPressBack: () => void}) {
  const {_} = useLingui()
  // const t = useTheme()
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

  return (
    <SignupContext.Provider value={{state, dispatch}}>
      <LoggedOutLayout
        leadin=""
        title={_(msg`Create Account`)}
        description={_(msg`We're so excited to have you join us!`)}
        scrollable>
        <View testID="createAccount" style={a.flex_1}>
          {showStarterPackCard &&
          gndr.dangerousIsType<AppGndrGraphStarterpack.Record>(
            starterPack.record,
            AppGndrGraphStarterpack.isRecord,
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
              <View style={[a.flex_row, a.justify_between, a.align_center]}>
                <Text
                  style={[{fontWeight: '700', color: '#000000', fontSize: 16}]}>
                  <Trans>
                    Step {state.activeStep + 1} of{' '}
                    {state.serviceDescription &&
                    !state.serviceDescription.phoneVerificationRequired
                      ? '3'
                      : '4'}
                  </Trans>
                </Text>
                <Button
                  style={[a.self_start]}
                  label={_(msg`Cancel`)}
                  variant="solid"
                  color="soft_neutral"
                  size="small"
                  onPress={onPressBack}>
                  <ButtonText style={[{color: '#000000', fontSize: 16}]}>
                    <Trans>Cancel</Trans>
                  </ButtonText>
                </Button>
              </View>
              {state.activeStep === SignupStep.INFO && (
                <View style={[a.mt_lg, a.mb_md]}>
                  <Svg width={48} height={49} viewBox="0 0 48 49" fill="none">
                    <Path
                      d="M24 2.57129C36.1109 2.57136 45.9286 12.3893 45.9287 24.5C45.9286 36.6109 36.1109 46.4286 24 46.4287C11.8893 46.4286 2.07136 36.6109 2.07129 24.5C2.07137 12.3893 11.8893 2.57136 24 2.57129ZM24 33.8613C21.5619 33.8613 19.1647 34.4885 17.0391 35.6826H17.0381C15.2917 36.6635 13.7773 38.0009 12.5889 39.6016C15.7618 42.0029 19.7141 43.4287 24 43.4287C28.2859 43.4287 32.2382 42.0029 35.4111 39.6016C34.2225 38.001 32.7084 36.6635 30.9619 35.6826C28.8361 34.4883 26.4383 33.8614 24 33.8613ZM24 5.57129C13.5461 5.57136 5.07137 14.0462 5.07129 24.5C5.07133 29.5851 7.07703 34.2017 10.3398 37.6025C11.7543 35.7575 13.5313 34.2121 15.5693 33.0674L16.0557 32.8047C18.5069 31.5294 21.2316 30.8613 24 30.8613C26.9528 30.8614 29.8562 31.6211 32.4307 33.0674L32.9082 33.3457C34.7469 34.4575 36.3572 35.9025 37.6602 37.6016C40.9228 34.2007 42.9287 29.5849 42.9287 24.5C42.9286 14.0462 34.454 5.57136 24 5.57129ZM24 10.4287C29.1677 10.4289 33.3564 14.6184 33.3564 19.7861C33.3562 24.9536 29.1675 29.1424 24 29.1426C18.8325 29.1424 14.6428 24.9537 14.6426 19.7861C14.6426 14.6184 18.8323 10.4288 24 10.4287ZM24 13.4287C20.4892 13.4288 17.6426 16.2753 17.6426 19.7861C17.6428 23.2968 20.4893 26.1424 24 26.1426C27.5107 26.1424 30.3562 23.2968 30.3564 19.7861C30.3564 16.2753 27.5108 13.4289 24 13.4287Z"
                      fill="#C30B0D"
                    />
                  </Svg>
                </View>
              )}
              {state.activeStep === SignupStep.VERIFICATION && (
                <View style={[a.mt_lg, a.mb_md]}>
                  <Svg width={48} height={49} viewBox="0 0 48 49" fill="none">
                    <Path
                      d="M41.3573 40.2147V33.9286C41.3573 33.1001 42.0289 32.4286 42.8573 32.4286C43.6857 32.4286 44.3573 33.1002 44.3573 33.9286V40.2147C44.3572 41.4459 43.8674 42.6265 42.9969 43.4969C42.1265 44.3674 40.9459 44.8572 39.7147 44.8573H33.4286C32.6002 44.8573 31.9287 44.1856 31.9286 43.3573C31.9286 42.5288 32.6002 41.8573 33.4286 41.8573H39.7147C40.1502 41.8572 40.5679 41.6838 40.8759 41.3758C41.1838 41.0679 41.3572 40.6501 41.3573 40.2147Z"
                      fill="#C30B0D"
                    />
                    <Path
                      d="M41.3573 15.0716V8.78543C41.3572 8.40444 41.2247 8.0368 40.9852 7.74442L40.8759 7.6243C40.5681 7.31646 40.1503 7.14296 39.7147 7.14285H33.4286C32.6002 7.14285 31.9286 6.47128 31.9286 5.64285C31.9286 4.81443 32.6002 4.14285 33.4286 4.14285H39.7147C40.9458 4.14296 42.1264 4.63248 42.9969 5.5032C43.8673 6.3737 44.3572 7.554 44.3573 8.78543V15.0716C44.3572 15.8999 43.6856 16.5715 42.8573 16.5716C42.0289 16.5716 41.3574 15.8999 41.3573 15.0716Z"
                      fill="#C30B0D"
                    />
                    <Path
                      d="M3.64282 15.0716V8.78543C3.6429 7.55436 4.1319 6.37379 5.0022 5.5032L5.00317 5.50223C5.87376 4.63193 7.05433 4.14293 8.2854 4.14285H14.5715L14.7249 4.15067C15.4812 4.22753 16.0715 4.86624 16.0715 5.64285C16.0715 6.41947 15.4812 7.05818 14.7249 7.13504L14.5715 7.14285H8.2854C7.84981 7.14293 7.43233 7.31627 7.12427 7.6243C6.81624 7.93236 6.6429 8.34984 6.64282 8.78543V15.0716C6.64275 15.8999 5.9712 16.5716 5.14282 16.5716C4.31444 16.5716 3.6429 15.8999 3.64282 15.0716Z"
                      fill="#C30B0D"
                    />
                    <Path
                      d="M3.64282 40.2147V33.9286C3.64282 33.1001 4.3144 32.4286 5.14282 32.4286C5.97125 32.4286 6.64282 33.1001 6.64282 33.9286V40.2147C6.64293 40.6503 6.81643 41.068 7.12427 41.3758L7.24438 41.4852C7.53677 41.7247 7.90441 41.8572 8.2854 41.8573H14.5715L14.7249 41.8651C15.4812 41.9419 16.0715 42.5807 16.0715 43.3573C16.0715 44.1338 15.4812 44.7726 14.7249 44.8495L14.5715 44.8573H8.2854C7.05397 44.8572 5.87367 44.3672 5.00317 43.4969C4.13245 42.6263 3.64293 41.4458 3.64282 40.2147Z"
                      fill="#C30B0D"
                    />
                    <Path
                      d="M22.4995 15.8571C22.4995 15.0289 23.1713 14.3574 23.9995 14.3571C24.8279 14.3571 25.4995 15.0287 25.4995 15.8571V26.8571C25.4995 27.6856 24.8279 28.3571 23.9995 28.3571H19.2856C18.4572 28.3571 17.7856 27.6856 17.7856 26.8571C17.7856 26.0287 18.4572 25.3571 19.2856 25.3571H22.4995V15.8571Z"
                      fill="#C30B0D"
                    />
                    <Path
                      d="M30.8244 32.055C31.4251 31.4848 32.3741 31.5092 32.9446 32.1096C33.5151 32.7103 33.4905 33.6602 32.8899 34.2307C30.491 36.5092 27.3088 37.7795 24.0002 37.7796C20.8983 37.7796 17.907 36.663 15.5686 34.6458L15.1096 34.2307L15.0041 34.1194C14.5084 33.5428 14.52 32.6728 15.0549 32.1096C15.5899 31.5464 16.4585 31.4898 17.0598 31.9553L17.176 32.055L17.5276 32.3743C19.3226 33.9228 21.6191 34.7796 24.0002 34.7796C26.5399 34.7795 28.983 33.804 30.8244 32.055Z"
                      fill="#C30B0D"
                    />
                    <Path
                      d="M14.7251 13.5792C15.4813 13.6562 16.0718 14.2949 16.0718 15.0714C16.0718 15.3597 15.9882 15.6279 15.8472 15.8566C15.9885 16.0853 16.0718 16.3541 16.0718 16.6427C16.0718 17.4192 15.4813 18.0579 14.7251 18.1349L14.5718 18.1427L14.3374 18.131C13.2618 18.0216 12.4066 17.1666 12.2974 16.0909L12.2856 15.8575L12.2974 15.6232C12.4145 14.4707 13.3884 13.5714 14.5718 13.5714L14.7251 13.5792Z"
                      fill="#C30B0D"
                    />
                    <Path
                      d="M16.8575 15.8575C16.8573 17.1197 15.8336 18.1427 14.5714 18.1427C13.743 18.1427 13.0714 17.4711 13.0714 16.6427C13.0714 16.3542 13.1539 16.0853 13.295 15.8566C13.1541 15.628 13.0714 15.3596 13.0714 15.0714C13.0714 14.243 13.743 13.5714 14.5714 13.5714C15.8338 13.5714 16.8575 14.5952 16.8575 15.8575Z"
                      fill="#C30B0D"
                    />
                    <Path
                      d="M33.5823 13.5792C34.3385 13.6562 34.929 14.2949 34.929 15.0714C34.929 15.3597 34.8453 15.6279 34.7043 15.8566C34.8456 16.0853 34.9289 16.3541 34.929 16.6427C34.929 17.4192 34.3385 18.0579 33.5823 18.1349L33.429 18.1427L33.1946 18.131C32.119 18.0216 31.2638 17.1665 31.1545 16.0909L31.1428 15.8575L31.1545 15.6232C31.2717 14.4707 32.2456 13.5714 33.429 13.5714L33.5823 13.5792Z"
                      fill="#C30B0D"
                    />
                    <Path
                      d="M35.7147 15.8575C35.7145 17.1196 34.691 18.1427 33.4286 18.1427C32.6002 18.1427 31.9286 17.4711 31.9286 16.6427C31.9286 16.3542 32.011 16.0853 32.1522 15.8566C32.0113 15.628 31.9286 15.3596 31.9286 15.0714C31.9286 14.243 32.6002 13.5714 33.4286 13.5714C34.6912 13.5714 35.7147 14.5953 35.7147 15.8575Z"
                      fill="#C30B0D"
                    />
                  </Svg>
                </View>
              )}
              {state.activeStep === SignupStep.GANDLE && (
                <View style={[a.mt_lg, a.mb_md]}>
                  <Svg width={42} height={41} viewBox="0 0 42 41" fill="none">
                    <Path
                      d="M36.7142 0.142853C39.2783 0.142853 41.3566 2.22142 41.3568 4.78543V36.2141C41.3568 38.7784 39.2784 40.8567 36.7142 40.8567H5.28546C2.72145 40.8566 0.642883 38.7783 0.642883 36.2141V4.78543C0.643034 2.22149 2.72152 0.143004 5.28546 0.142853H36.7142ZM5.28546 3.14285C4.37837 3.143 3.64303 3.87834 3.64288 4.78543V36.2141C3.64288 37.1214 4.37826 37.8566 5.28546 37.8567H36.7142C37.6215 37.8567 38.3568 37.1215 38.3568 36.2141V4.78543C38.3566 3.87823 37.6214 3.14285 36.7142 3.14285H5.28546ZM20.9993 7.99832C27.9033 7.99832 33.5009 13.5954 33.5013 20.4993V22.0706C33.5013 24.635 31.422 26.714 28.8577 26.7141C27.4108 26.7141 26.1185 26.0525 25.2669 25.0149C24.7172 25.5344 24.0779 25.9506 23.3782 26.2405C22.6243 26.5528 21.8153 26.7141 20.9993 26.7141C20.1835 26.714 19.3751 26.5527 18.6214 26.2405C17.8678 25.9282 17.1826 25.4707 16.6058 24.8938C16.0289 24.3169 15.5704 23.632 15.2581 22.8782C14.9459 22.1243 14.7855 21.3152 14.7855 20.4993C14.7856 19.6835 14.9459 18.8751 15.2581 18.1214C15.5704 17.3675 16.0288 16.6827 16.6058 16.1057C17.1828 15.5288 17.8675 15.0704 18.6214 14.7581C19.3751 14.4459 20.1835 14.2855 20.9993 14.2854C21.8153 14.2854 22.6244 14.4459 23.3782 14.7581C24.132 15.0703 24.8169 15.5289 25.3939 16.1057C25.9707 16.6826 26.4283 17.3677 26.7405 18.1214C27.0527 18.8751 27.2141 19.6835 27.2142 20.4993V22.0706C27.2142 22.9781 27.9502 23.7141 28.8577 23.7141C29.7652 23.714 30.5013 22.9781 30.5013 22.0706V20.4993C30.5009 15.2522 26.2465 10.9983 20.9993 10.9983C15.7523 10.9985 11.4987 15.2524 11.4984 20.4993C11.4984 25.7465 15.7521 30.001 20.9993 30.0013C22.2994 30.0013 23.5351 29.7407 24.6595 29.2708L24.804 29.218C25.5314 28.9972 26.3227 29.3601 26.6224 30.0764C26.9415 30.8407 26.5809 31.7189 25.8167 32.0384C24.3321 32.6589 22.7036 33.0013 20.9993 33.0013C14.0953 33.001 8.49835 27.4034 8.49835 20.4993C8.49873 13.5955 14.0955 7.99854 20.9993 7.99832ZM20.9993 17.2854C20.5775 17.2855 20.1596 17.3691 19.7698 17.5305C19.3799 17.6921 19.0253 17.9284 18.7269 18.2268C18.4284 18.5253 18.1921 18.8799 18.0306 19.2698C17.8691 19.6596 17.7856 20.0774 17.7855 20.4993C17.7855 20.9213 17.8691 21.3399 18.0306 21.7298C18.1921 22.1196 18.4286 22.4744 18.7269 22.7727C19.0252 23.0711 19.38 23.3075 19.7698 23.469C20.1596 23.6305 20.5775 23.714 20.9993 23.7141C21.4214 23.7141 21.8399 23.6305 22.2298 23.469C22.6197 23.3075 22.9743 23.0712 23.2728 22.7727C23.5712 22.4743 23.8075 22.1197 23.9691 21.7298C24.1306 21.3398 24.2142 20.9214 24.2142 20.4993C24.2141 20.0774 24.1305 19.6596 23.9691 19.2698C23.8075 18.88 23.5711 18.5252 23.2728 18.2268C22.9744 17.9285 22.6196 17.692 22.2298 17.5305C21.8399 17.3691 21.4213 17.2854 20.9993 17.2854Z"
                      fill="#C30B0D"
                    />
                  </Svg>
                </View>
              )}
              <Text style={[{fontSize: 32, fontWeight: '600'}]}>
                {state.activeStep === SignupStep.INFO ? (
                  <>
                    <Trans>Sign up for a {'\n'}Gander Social account.</Trans>
                  </>
                ) : state.activeStep === SignupStep.VERIFICATION ? (
                  <Trans>Super. {'\n'}Let's verify your identity.</Trans>
                ) : state.activeStep === SignupStep.GANDLE ? (
                  <Trans>Nnnnext...{'\n'}Choose your gandle.</Trans>
                ) : (
                  <Trans>Complete the challenge</Trans>
                )}
              </Text>
            </View>
            <View style={[a.flex_1, a.h_full]}>
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
                ) : state.activeStep === SignupStep.VERIFICATION ? (
                  <StepVerification />
                ) : state.activeStep === SignupStep.GANDLE ? (
                  <StepGandle />
                ) : (
                  <StepCaptcha />
                )}
              </LayoutAnimationConfig>
            </View>

            {/* <Divider /> */}

            {/* <View
              style={[a.w_full, a.py_lg, a.flex_row, a.gap_md, a.align_center]}>
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
            </View> */}
          </View>
        </View>
      </LoggedOutLayout>
    </SignupContext.Provider>
  )
}
