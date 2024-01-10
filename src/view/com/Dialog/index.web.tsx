import React from 'react'
import {View, TouchableWithoutFeedback, DimensionValue} from 'react-native'
import {FocusScope} from '@tamagui/focus-scope'
import Animated, {FadeInDown, FadeIn, FadeOut} from 'react-native-reanimated'

import {useTheme, atoms as a, useBreakpoints} from '#/alf'
import {Portal} from '#/view/com/Portal'
import {DialogProps} from '#/view/com/Dialog/types'

const Context = React.createContext<{
  dismiss: () => void
}>({
  dismiss: () => {},
})

export function useDialog() {
  return React.useContext(Context)
}

export function Dialog({
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
                    t.atoms.bg_contrast_100,
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
                      aria-role="dialog">
                      {children}
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
