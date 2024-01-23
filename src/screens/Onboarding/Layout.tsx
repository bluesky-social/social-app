import React from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {IS_DEV} from '#/env'
import {isWeb} from '#/platform/detection'
import {useOnboardingDispatch} from '#/state/shell'

import {
  useTheme,
  atoms as a,
  useBreakpoints,
  web,
  native,
  flatten,
  TextStyleProp,
} from '#/alf'
import {H2, P, leading} from '#/components/Typography'
import {ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft} from '#/components/icons/Chevron'
import {Button, ButtonIcon} from '#/components/Button'
import {ScrollView} from '#/view/com/util/Views'
import {createPortalGroup} from '#/components/Portal'

import {Context} from '#/screens/Onboarding/state'

const COL_WIDTH = 500

export const OnboardingControls = createPortalGroup()

export function Layout({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()
  const onboardDispatch = useOnboardingDispatch()
  const {state, dispatch} = React.useContext(Context)
  const scrollview = React.useRef<ScrollView>(null)
  const prevActiveStep = React.useRef<string>(state.activeStep)

  React.useEffect(() => {
    if (state.activeStep !== prevActiveStep.current) {
      prevActiveStep.current = state.activeStep
      scrollview.current?.scrollTo({y: 0, animated: false})
    }
  }, [state])

  return (
    <View
      aria-modal
      role="dialog"
      aria-role="dialog"
      aria-label="Set up your account"
      accessibilityLabel="Set up your account"
      accessibilityHint="This onboarding flow will help you set up your account."
      style={[a.absolute, a.inset_0, a.flex_1, t.atoms.bg]}>
      {IS_DEV && (
        <View style={[a.absolute, a.p_xl, a.z_10, {right: 0, top: insets.top}]}>
          <Button
            variant="ghost"
            color="negative"
            size="small"
            onPress={() => onboardDispatch({type: 'skip'})}
            label="Clear onboarding state">
            Clear
          </Button>
        </View>
      )}

      {state.hasPrev && (
        <View
          style={[
            web(a.fixed),
            native(a.absolute),
            a.flex_row,
            a.w_full,
            a.justify_center,
            a.z_20,
            a.px_xl,
            {
              top: a.py_5xl.paddingTop + insets.top,
            },
          ]}>
          <View style={[a.w_full, a.align_start, {maxWidth: COL_WIDTH}]}>
            <Button
              key={state.activeStep} // remove focus state on nav
              variant="ghost"
              color="secondary"
              size="small"
              shape="round"
              label="Go back"
              style={[a.absolute, t.atoms.shadow_sm]}
              onPress={() => dispatch({type: 'prev'})}>
              <ButtonIcon icon={ChevronLeft} />
            </Button>
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollview}
        style={[a.h_full, a.w_full, {paddingTop: insets.top}]}
        contentContainerStyle={{borderWidth: 0}}>
        <View
          aria-modal
          style={[a.flex_row, a.justify_center, gtMobile ? a.px_5xl : a.px_xl]}>
          <View style={[a.flex_1, {maxWidth: COL_WIDTH}]}>
            <View style={[a.w_full, a.align_center, a.pt_5xl]}>
              <View
                style={[
                  a.flex_row,
                  a.gap_sm,
                  a.w_full,
                  {paddingTop: 17, maxWidth: '60%'},
                ]}>
                {Array(state.totalSteps)
                  .fill(0)
                  .map((_, i) => (
                    <View
                      key={i}
                      style={[
                        a.flex_1,
                        a.pt_xs,
                        a.rounded_full,
                        t.atoms.bg_contrast_50,
                        {
                          backgroundColor:
                            i + 1 <= state.activeStepIndex
                              ? t.palette.primary_500
                              : t.palette.contrast_100,
                        },
                      ]}
                    />
                  ))}
              </View>
            </View>

            <View style={[a.w_full, a.mb_5xl]}>
              {children}

              {isWeb && gtMobile && (
                <View style={[a.w_full, a.flex_row, a.justify_end, a.pt_5xl]}>
                  <OnboardingControls.Outlet />
                </View>
              )}
            </View>

            <View style={{height: 200}} />
          </View>
        </View>
      </ScrollView>

      {(!isWeb || !gtMobile) && (
        <View
          style={[
            a.align_center,
            gtMobile ? a.px_5xl : a.px_xl,
            {
              paddingBottom: Math.max(insets.bottom, a.pb_5xl.paddingBottom),
            },
          ]}>
          <View style={[a.w_full, {maxWidth: COL_WIDTH}]}>
            <OnboardingControls.Outlet />
          </View>
        </View>
      )}
    </View>
  )
}

export function Title({
  children,
  style,
}: React.PropsWithChildren<TextStyleProp>) {
  return (
    <H2
      style={[
        a.pb_sm,
        {
          lineHeight: leading(a.text_4xl, a.leading_tight),
        },
        flatten(style),
      ]}>
      {children}
    </H2>
  )
}

export function Description({
  children,
  style,
}: React.PropsWithChildren<TextStyleProp>) {
  const t = useTheme()
  return <P style={[t.atoms.text_contrast_700, flatten(style)]}>{children}</P>
}
