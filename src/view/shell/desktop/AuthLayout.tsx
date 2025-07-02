import {createContext, useContext} from 'react'
import {Pressable, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {DismissableLayer, FocusGuards, FocusScope} from 'radix-ui/internal'
import {createPortal} from 'react-dom'
import {RemoveScrollBar} from 'react-remove-scroll-bar'

import {useA11y} from '#/state/a11y'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a, flatten, useTheme, web} from '#/alf'

const stopPropagation = (e: any) => e.stopPropagation()
const preventDefault = (e: any) => e.preventDefault()

const WithinAuthLayoutContext = createContext(false)

export function AuthModal({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const {_} = useLingui()
  const {reduceMotionEnabled} = useA11y()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  FocusGuards.useFocusGuards()

  console.log('auth modal')

  return createPortal(
    <Pressable
      accessibilityLabel={_(msg`Close active dialog`)}
      accessibilityHint={undefined}
      onPress={() => setShowLoggedOut(false)}>
      <RemoveScrollBar />
      <View
        style={[
          a.fixed,
          a.inset_0,
          a.z_10,
          a.px_xl,
          a.align_center,
          a.justify_center,
          web({overflowY: 'auto'}),
          {zIndex: 999999},
        ]}>
        <Backdrop />
        <View
          style={[
            a.w_full,
            a.z_20,
            a.align_center,
            web({minHeight: '60vh', position: 'static'}),
          ]}>
          <FocusScope.FocusScope loop asChild trapped>
            <View
              role="dialog"
              aria-role="dialog"
              aria-label={_(msg`Log in or sign up`)}
              // @ts-expect-error web only -prf
              onClick={stopPropagation}
              onStartShouldSetResponder={_ => true}
              onTouchEnd={stopPropagation}
              style={flatten([
                a.relative,
                a.rounded_md,
                a.w_full,
                a.border,
                t.atoms.bg,
                {
                  minHeight: '100%',
                  maxWidth: 600,
                  borderColor: t.palette.contrast_200,
                  shadowColor: t.palette.black,
                  shadowOpacity: t.name === 'light' ? 0.1 : 0.4,
                  shadowRadius: 30,
                },
                !reduceMotionEnabled && a.zoom_fade_in,
                a.p_xl,
              ])}>
              <DismissableLayer.DismissableLayer
                onInteractOutside={preventDefault}
                onFocusOutside={preventDefault}
                onDismiss={close}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1 1 0',
                }}>
                <WithinAuthLayoutContext.Provider value={true}>
                  {children}
                </WithinAuthLayoutContext.Provider>
              </DismissableLayer.DismissableLayer>
            </View>
          </FocusScope.FocusScope>
        </View>
      </View>
    </Pressable>,
    document.querySelector('#root')!,
  )
}

function Backdrop() {
  const t = useTheme()
  const {reduceMotionEnabled} = useA11y()
  return (
    <View style={{opacity: 0.8}}>
      <View
        style={[
          a.fixed,
          a.inset_0,
          {backgroundColor: t.palette.black},
          !reduceMotionEnabled && a.fade_in,
        ]}
      />
    </View>
  )
}

export function useIsWithinAuthLayout() {
  return useContext(WithinAuthLayoutContext)
}
