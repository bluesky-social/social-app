import React from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

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
  const {_} = useLingui()
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

  const paddingTop = gtMobile ? a.py_5xl : a.py_lg
  const dialogLabel = _(msg`Set up your account`)

  return (
    <View
      aria-modal
      role="dialog"
      aria-role="dialog"
      aria-label={dialogLabel}
      accessibilityLabel={dialogLabel}
      accessibilityHint={_(
        msg`The following steps will help customize your Bluesky experience.`,
      )}
      style={[
        // @ts-ignore web only -prf
        isWeb ? a.fixed : a.absolute,
        a.inset_0,
        a.flex_1,
        t.atoms.bg,
      ]}>
      {IS_DEV && (
        <View style={[a.absolute, a.p_xl, a.z_10, {right: 0, top: insets.top}]}>
          <Button
            variant="ghost"
            color="negative"
            size="small"
            onPress={() => onboardDispatch({type: 'skip'})}
            // DEV ONLY
            label="Clear onboarding state">
            Clear
          </Button>
        </View>
      )}

      {!gtMobile && state.hasPrev && (
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
              top: paddingTop.paddingTop + insets.top - 1,
            },
          ]}>
          <View style={[a.w_full, a.align_start, {maxWidth: COL_WIDTH}]}>
            <Button
              key={state.activeStep} // remove focus state on nav
              variant="ghost"
              color="secondary"
              size="small"
              shape="round"
              label={_(msg`Go back to previous step`)}
              style={[a.absolute]}
              onPress={() => dispatch({type: 'prev'})}>
              <ButtonIcon icon={ChevronLeft} />
            </Button>
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollview}
        style={[a.h_full, a.w_full, {paddingTop: insets.top}]}
        contentContainerStyle={{borderWidth: 0}}
        // @ts-ignore web only --prf
        dataSet={{'stable-gutters': 1}}>
        <View
          style={[a.flex_row, a.justify_center, gtMobile ? a.px_5xl : a.px_xl]}>
          <View style={[a.flex_1, {maxWidth: COL_WIDTH}]}>
            <View style={[a.w_full, a.align_center, paddingTop]}>
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

            <View
              style={[a.w_full, a.mb_5xl, {paddingTop: gtMobile ? 20 : 40}]}>
              {children}
            </View>

            <View style={{height: 200}} />
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          // @ts-ignore web only -prf
          isWeb ? a.fixed : a.absolute,
          {bottom: 0, left: 0, right: 0},
          t.atoms.bg,
          t.atoms.border,
          a.border_t,
          a.align_center,
          gtMobile ? a.px_5xl : a.px_xl,
          isWeb
            ? a.py_2xl
            : {
                paddingTop: a.pt_lg.paddingTop,
                paddingBottom: insets.bottom + 10,
              },
        ]}>
        <View
          style={[
            a.w_full,
            {maxWidth: COL_WIDTH},
            gtMobile && [a.flex_row, a.justify_between],
          ]}>
          {gtMobile &&
            (state.hasPrev ? (
              <Button
                key={state.activeStep} // remove focus state on nav
                variant="solid"
                color="secondary"
                size="large"
                shape="round"
                label={_(msg`Go back to previous step`)}
                onPress={() => dispatch({type: 'prev'})}>
                <ButtonIcon icon={ChevronLeft} />
              </Button>
            ) : (
              <View style={{height: 54}} />
            ))}
          <OnboardingControls.Outlet />
        </View>
      </View>
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
