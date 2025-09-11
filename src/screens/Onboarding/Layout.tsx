import React, {useState} from 'react'
import {ScrollView, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isWeb} from '#/platform/detection'
import {useOnboardingDispatch} from '#/state/shell'
import {Context} from '#/screens/Onboarding/state'
import {
  atoms as a,
  flatten,
  native,
  type TextStyleProp,
  tokens,
  useBreakpoints,
  useTheme,
  web,
} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft} from '#/components/icons/Arrow'
import {HEADER_SLOT_SIZE} from '#/components/Layout'
import {createPortalGroup} from '#/components/Portal'
import {P, Text} from '#/components/Typography'

const ONBOARDING_COL_WIDTH = 420

export const OnboardingControls = createPortalGroup()
export const OnboardingHeaderSlot = createPortalGroup()

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

  const [footerHeight, setFooterHeight] = useState(0)

  return (
    <View
      aria-modal
      role="dialog"
      aria-role="dialog"
      aria-label={dialogLabel}
      accessibilityLabel={dialogLabel}
      accessibilityHint={_(msg`Customizes your Bluesky experience`)}
      style={[
        // @ts-ignore web only -prf
        isWeb ? a.fixed : a.absolute,
        a.inset_0,
        a.flex_1,
        t.atoms.bg,
      ]}>
      {__DEV__ && (
        <Button
          variant="ghost"
          color="negative"
          size="tiny"
          onPress={() => onboardDispatch({type: 'skip'})}
          // DEV ONLY
          label="Clear onboarding state"
          style={[
            a.absolute,
            a.z_10,
            {
              left: '50%',
              top: insets.top + 2,
              transform: [{translateX: '-50%'}],
            },
          ]}>
          <ButtonText>[DEV] Clear</ButtonText>
        </Button>
      )}

      {!gtMobile && (
        <View
          pointerEvents="box-none"
          style={[
            web(a.fixed),
            native(a.absolute),
            a.left_0,
            a.right_0,
            a.flex_row,
            a.w_full,
            a.justify_center,
            a.z_20,
            a.px_xl,
            {top: paddingTop.paddingTop + insets.top - 1},
          ]}>
          <View
            pointerEvents="box-none"
            style={[
              a.w_full,
              a.align_start,
              a.flex_row,
              a.justify_between,
              {maxWidth: ONBOARDING_COL_WIDTH},
            ]}>
            {state.hasPrev ? (
              <Button
                key={state.activeStep} // remove focus state on nav
                color="secondary"
                variant="ghost"
                shape="square"
                size="small"
                label={_(msg`Go back to previous step`)}
                onPress={() => dispatch({type: 'prev'})}
                style={[a.bg_transparent]}>
                <ButtonIcon icon={ArrowLeft} size="lg" />
              </Button>
            ) : (
              <View />
            )}

            <OnboardingHeaderSlot.Outlet />
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollview}
        style={[a.h_full, a.w_full, {paddingTop: insets.top}]}
        contentContainerStyle={{borderWidth: 0}}
        scrollIndicatorInsets={{bottom: footerHeight - insets.bottom}}
        // @ts-expect-error web only --prf
        dataSet={{'stable-gutters': 1}}>
        <View
          style={[a.flex_row, a.justify_center, gtMobile ? a.px_5xl : a.px_xl]}>
          <View style={[a.flex_1, {maxWidth: ONBOARDING_COL_WIDTH}]}>
            <View style={[a.w_full, a.align_center, paddingTop]}>
              <View
                style={[
                  a.flex_row,
                  a.gap_sm,
                  a.w_full,
                  a.align_center,
                  {height: HEADER_SLOT_SIZE, maxWidth: '60%'},
                ]}>
                {Array(state.totalSteps)
                  .fill(0)
                  .map((__, i) => (
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

            <View style={[a.w_full, a.mb_5xl, a.pt_md]}>{children}</View>

            <View style={{height: 100 + footerHeight}} />
          </View>
        </View>
      </ScrollView>

      <View
        onLayout={evt => setFooterHeight(evt.nativeEvent.layout.height)}
        style={[
          isWeb ? a.fixed : a.absolute,
          {bottom: 0, left: 0, right: 0},
          t.atoms.bg,
          t.atoms.border_contrast_low,
          a.border_t,
          a.align_center,
          gtMobile ? a.px_5xl : a.px_xl,
          isWeb
            ? a.py_2xl
            : {
                paddingTop: tokens.space.md,
                paddingBottom: insets.bottom + tokens.space.md,
              },
        ]}>
        <View
          style={[
            a.w_full,
            {maxWidth: ONBOARDING_COL_WIDTH},
            gtMobile && [a.flex_row, a.justify_between, a.align_center],
          ]}>
          {gtMobile &&
            (state.hasPrev ? (
              <Button
                key={state.activeStep} // remove focus state on nav
                color="secondary"
                variant="ghost"
                shape="square"
                size="small"
                label={_(msg`Go back to previous step`)}
                onPress={() => dispatch({type: 'prev'})}>
                <ButtonIcon icon={ArrowLeft} size="lg" />
              </Button>
            ) : (
              <View style={{height: 33}} />
            ))}
          <OnboardingControls.Outlet />
        </View>
      </View>
    </View>
  )
}

export function TitleText({
  children,
  style,
}: React.PropsWithChildren<TextStyleProp>) {
  return (
    <Text
      style={[
        a.pb_sm,
        a.text_4xl,
        a.font_semi_bold,
        a.leading_tight,
        flatten(style),
      ]}>
      {children}
    </Text>
  )
}

export function DescriptionText({
  children,
  style,
}: React.PropsWithChildren<TextStyleProp>) {
  const t = useTheme()
  return (
    <P style={[t.atoms.text_contrast_medium, flatten(style)]}>{children}</P>
  )
}
