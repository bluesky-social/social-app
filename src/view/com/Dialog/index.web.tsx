import React from 'react'
import {View, TouchableWithoutFeedback, DimensionValue} from 'react-native'
import {FocusScope} from '@tamagui/focus-scope'
import Animated, {FadeInDown, FadeIn, FadeOut} from 'react-native-reanimated'

import {useTheme, atoms as a, useBreakpoints} from '#/alf'
import {EventStopper} from '#/view/com/util/EventStopper'
import {H3, Text} from '#/view/com/Typography'
import {Portal} from '#/view/com/Portal'
import {DialogProps} from '#/view/com/Dialog/types'
import {Button} from '#/view/com/Button'

const Context = React.createContext<{
  dismiss: () => void
}>({
  dismiss: () => {},
})

export function useDialog() {
  return React.useContext(Context)
}

export function Outer({
  isOpen,
  onDismiss,
  children,
}: React.PropsWithChildren<DialogProps>) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  const dismiss = React.useCallback(() => {
    onDismiss()
  }, [onDismiss])

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss()
    }

    document.addEventListener('keydown', handler)

    return () => document.removeEventListener('keydown', handler)
  }, [dismiss])

  const context = React.useMemo(() => ({dismiss}), [dismiss])

  return (
    <>
      {isOpen && (
        <Portal>
          <Context.Provider value={context}>
            <TouchableWithoutFeedback
              accessibilityRole="button"
              onPress={onDismiss}>
              <View
                style={[
                  a.absolute,
                  a.inset_0,
                  a.z_10,
                  a.flex_row,
                  a.justify_center,
                ]}>
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  style={[
                    a.absolute,
                    a.inset_0,
                    t.atoms.bg_contrast_200,
                    {opacity: 0.8},
                  ]}
                />

                <View
                  style={[
                    a.w_full,
                    a.z_20,
                    {
                      maxWidth: 600,
                      paddingTop: gtMobile ? ('10vh' as DimensionValue) : 0,
                    },
                  ]}>
                  <FocusScope loop enabled trapped>
                    <Animated.View
                      entering={FadeInDown.duration(200)}
                      exiting={FadeOut.duration(200)}
                      aria-role="dialog"
                    >
                      <EventStopper>
                        {children}
                      </EventStopper>
                    </Animated.View>
                  </FocusScope>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Context.Provider>
        </Portal>
      )}
    </>
  )
}

export function Inner(props: React.PropsWithChildren<{}>) {
  const t = useTheme()
  return (
    <View style={[
      a.relative,
      a.rounded_md,
      a.p_xl,
      t.atoms.bg,
    ]}>
      {props.children}
    </View>
  )
}

export function Header({ children, title }: React.PropsWithChildren<{ title: string }>) {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.justify_between, a.mb_lg]}>
      <H3 style={[t.atoms.text_contrast_500, a.pr_lg]}>{title}</H3>
      {children}
    </View>
  )
}

export function Close() {
  const t = useTheme()
  const {dismiss} = useDialog()
  return (
    <View style={[
      a.absolute,
      a.z_10,
      {
        top: a.pt_lg.paddingTop,
        right: a.pr_lg.paddingRight,
      }
    ]}>
      <Button onPress={dismiss} accessibilityLabel='Close dialog' accessibilityHint='Clicking this button will close the current dialog.'>
        {({ state}) => (
          <View style={[
            a.justify_center,
            a.align_center,
            a.rounded_full,
            t.atoms.bg_contrast_200,
            {
              pointerEvents: 'none',
              height: 32,
              width: 32,
            }
          ]}>
            <Text>X</Text>
          </View>
        )}
      </Button>
    </View>
  )
}
