import React from 'react'
import {View, ViewProps,ViewStyle} from 'react-native'
import {StyleProp} from 'react-native'
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {atoms as a, useBreakpoints,useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'

// Every screen should have a Layout component wrapping it.
// This component provides a default padding for the top of the screen.
// This allows certain screens to avoid the top padding if they want to.
//
// In a future PR I will add a unified header component to this file and
// things like a preconfigured scrollview.

/**
 * Every screen should have a Layout.Screen component wrapping it.
 * This component provides a default padding for the top of the screen
 * and height/minHeight
 */
let Screen = ({
  disableTopPadding,
  style,
  ...props
}: React.ComponentProps<typeof View> & {
  disableTopPadding?: boolean
  style?: StyleProp<ViewStyle>
}): React.ReactNode => {
  const {top} = useSafeAreaInsets()
  return (
    <View
      style={[
        {paddingTop: disableTopPadding ? 0 : top},
        a.util_screen_outer,
        style,
      ]}
      {...props}
    />
  )
}
Screen = React.memo(Screen)
export {Screen}

export const ScrollView = React.forwardRef(function LayoutScrollView(
  {
    children,
    style,
    ...props
  }: KeyboardAwareScrollViewProps & {
    children: React.ReactNode
  },
  _ref: React.Ref<typeof KeyboardAwareScrollView>,
) {
  return (
    <KeyboardAwareScrollView
      style={[a.w_full, style, {transform: 'unset'}]}
      keyboardShouldPersistTaps="handled"
      {...props}>
      {children}
    </KeyboardAwareScrollView>
  )
})

export const Center = React.forwardRef(function LayoutContent(
  {children, style, ...props}: ViewProps & {children: React.ReactNode},
  ref: React.Ref<View>,
) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  return (
    <>
      {gtMobile && (
        <View
          style={[
            a.fixed,
            a.inset_0,
            a.border_l,
            a.border_r,
            t.atoms.border_contrast_low,
            {
              width: 600,
              left: '50%',
              transform: [
                {
                  translateX: '-50%',
                },
              ],
            },
          ]}
        />
      )}
      <View
        ref={ref}
        style={[
          a.util_screen_outer,
          a.w_full,
          a.mx_auto,
          gtMobile && {
            maxWidth: 600,
          },
          style,
        ]}
        {...props}>
        {children}
      </View>
    </>
  )
})

export function Gutter({
  children,
  top,
  bottom,
}: {
  children: React.ReactNode
  top?: boolean
  bottom?: boolean
}) {
  const {gtMobile} = useBreakpoints()
  return (
    <View
      style={[
        a.px_lg,
        top && a.pt_lg,
        bottom && a.pb_lg,
        gtMobile && [a.px_xl, top && a.pt_xl, bottom && a.pb_xl],
      ]}>
      {children}
    </View>
  )
}

export function Header({children}: {children: React.ReactNode}) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  return (
    <View style={[a.w_full]}>
      <Gutter>
        <View
          style={[
            a.flex_row,
            a.align_start,
            a.gap_md,
            a.pb_xs,
            a.pt_md,
            gtMobile && a.pt_lg,
          ]}>
          <Button
            label={_(msg`Go back`)}
            size="small"
            variant="solid"
            color="secondary"
            shape="round"
            onPress={onPressBack}>
            <ButtonIcon icon={ChevronLeft} />
          </Button>
          <View style={[a.pb_md, gtMobile && [a.pb_lg]]}>{children}</View>
        </View>
      </Gutter>

      <View style={[gtMobile && a.px_xl]}>
        <Divider />
      </View>
    </View>
  )
}

Header.TitleText = function HeaderTitleText({
  children,
}: {
  children: React.ReactNode
}) {
  const {gtMobile} = useBreakpoints()
  return (
    <Text
      style={[
        a.text_xl,
        a.font_heavy,
        a.leading_tight,
        {paddingTop: 6},
        gtMobile && [
          a.text_3xl,
          {
            paddingTop: 2,
          },
        ],
      ]}>
      {children}
    </Text>
  )
}
