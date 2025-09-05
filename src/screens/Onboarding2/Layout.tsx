import React from 'react'
import {ScrollView, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isWeb} from '#/platform/detection'
import {Context} from '#/screens/Onboarding2/state'
import {
  atoms as a,
  flatten,
  type TextStyleProp,
  useBreakpoints,
  useTheme,
} from '#/alf'
import {leading} from '#/alf/typography'
import {Button, ButtonText} from '#/components/Button'
import {P, Text} from '#/components/Typography'

const COL_WIDTH = 420

export function Onboarding2Layout({
  children,
  onCancel,
}: React.PropsWithChildren<{
  onGoBack?: () => void
  onCancel?: () => void
  handle?: string
}>) {
  const {_} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()
  const {state} = React.useContext(Context)
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
      aria-label={_(msg`Set up your account`)}
      accessibilityLabel={_(msg`Set up your account`)}
      accessibilityHint={_(msg`Customizes your Bluesky experience`)}
      style={[
        // @ts-ignore web only -prf
        isWeb ? a.fixed : a.absolute,
        a.inset_0,
        a.flex_1,
        t.atoms.bg,
      ]}>
      <ScrollView
        ref={scrollview}
        style={[a.h_full, a.w_full, {paddingTop: insets.top}]}
        contentContainerStyle={{borderWidth: 0}}
        // @ts-ignore web only --prf
        dataSet={{'stable-gutters': 1}}>
        <View
          style={[a.flex_row, a.justify_center, gtMobile ? a.px_5xl : a.px_xl]}>
          <View style={[a.flex_1, {maxWidth: COL_WIDTH}]}>
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
                    style={[
                      {fontWeight: '700', color: '#000000', fontSize: 16},
                    ]}>
                    <Trans>Step {state.activeStepIndex + 4} of 7</Trans>
                  </Text>
                  <Button
                    style={[a.self_start]}
                    label={_(msg`Cancel`)}
                    variant="solid"
                    color="soft_neutral"
                    size="small"
                    onPress={onCancel}>
                    <ButtonText style={[{color: '#000000', fontSize: 16}]}>
                      <Trans>Cancel</Trans>
                    </ButtonText>
                  </Button>
                </View>
              </View>
              <View style={[a.flex_1, a.h_full]}>{children}</View>
            </View>
          </View>
        </View>
      </ScrollView>
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
        a.font_bold,
        {
          lineHeight: leading(a.text_4xl, a.leading_tight),
        },
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
