import {useCallback, useEffect, useLayoutEffect, useState} from 'react'
import {StyleSheet, TouchableWithoutFeedback, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {RemoveScrollBar} from 'react-remove-scroll-bar'

import {useIntentHandler} from '#/lib/hooks/useIntentHandler'
import {type NavigationProp} from '#/lib/routes/types'
import {useSession} from '#/state/session'
import {useIsDrawerOpen, useSetDrawerOpen} from '#/state/shell'
import {useCloseAllActiveElements} from '#/state/util'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {Deactivated} from '#/screens/Deactivated'
import {Takendown} from '#/screens/Takendown'
import {atoms as a, select, useBreakpoints, useTheme} from '#/alf'
import {EmailDialog} from '#/components/dialogs/EmailDialog'
import {LinkWarningDialog} from '#/components/dialogs/LinkWarning'
import {MutedWordsDialog} from '#/components/dialogs/MutedWords'
import {SigninDialog} from '#/components/dialogs/Signin'
import {Lightbox} from '#/components/Lightbox'
import {GlobalReportDialog} from '#/components/moderation/ReportDialog'
import {Outlet as PortalOutlet} from '#/components/Portal'
import {PassiveAnalytics} from '#/analytics/PassiveAnalytics'
import {FlatNavigator, RoutesContainer} from '#/Navigation'
import {Composer} from './Composer'
import {DrawerContent} from './Drawer'

function ShellInner() {
  const navigator = useNavigation<NavigationProp>()
  const closeAllActiveElements = useCloseAllActiveElements()

  useIntentHandler()

  useEffect(() => {
    const unsubscribe = navigator.addListener('state', () => {
      closeAllActiveElements()
    })
    return unsubscribe
  }, [navigator, closeAllActiveElements])

  const drawerLayout = useCallback(
    ({children}: {children: React.ReactNode}) => (
      <DrawerLayout>{children}</DrawerLayout>
    ),
    [],
  )
  return (
    <>
      <ErrorBoundary>
        <FlatNavigator layout={drawerLayout} />
      </ErrorBoundary>
      <Composer />
      <MutedWordsDialog />
      <SigninDialog />
      <EmailDialog />
      <LinkWarningDialog />
      <Lightbox />
      <GlobalReportDialog />
      <PortalOutlet />
    </>
  )
}

function DrawerLayout({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const isDrawerOpen = useIsDrawerOpen()
  const setDrawerOpen = useSetDrawerOpen()
  const {gtTablet} = useBreakpoints()
  const {_} = useLingui()
  const showDrawer = !gtTablet && isDrawerOpen
  const [showDrawerDelayedExit, setShowDrawerDelayedExit] = useState(showDrawer)

  useLayoutEffect(() => {
    if (showDrawer !== showDrawerDelayedExit) {
      if (showDrawer) {
        setShowDrawerDelayedExit(true)
      } else {
        const timeout = setTimeout(() => {
          setShowDrawerDelayedExit(false)
        }, 160)
        return () => clearTimeout(timeout)
      }
    }
  }, [showDrawer, showDrawerDelayedExit])

  return (
    <>
      {children}
      {showDrawerDelayedExit && (
        <>
          <RemoveScrollBar />
          <TouchableWithoutFeedback
            onPress={ev => {
              // Only close if press happens outside of the drawer
              if (ev.target === ev.currentTarget) {
                setDrawerOpen(false)
              }
            }}
            accessibilityLabel={_(msg`Close drawer menu`)}
            accessibilityHint="">
            <View
              style={[
                styles.drawerMask,
                {
                  backgroundColor: showDrawer
                    ? select(t.name, {
                        light: 'rgba(0, 57, 117, 0.1)',
                        dark: 'rgba(1, 82, 168, 0.1)',
                        dim: 'rgba(10, 13, 16, 0.8)',
                      })
                    : 'transparent',
                },
                a.transition_color,
              ]}>
              <View
                style={[
                  styles.drawerContainer,
                  showDrawer ? a.slide_in_left : a.slide_out_left,
                ]}>
                <DrawerContent />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </>
      )}
    </>
  )
}

export function Shell() {
  const t = useTheme()
  const {currentAccount} = useSession()
  return (
    <View style={[a.util_screen_outer, t.atoms.bg]}>
      {currentAccount?.status === 'takendown' ? (
        <Takendown />
      ) : currentAccount?.status === 'deactivated' ? (
        <Deactivated />
      ) : (
        <RoutesContainer>
          <ShellInner />
        </RoutesContainer>
      )}

      <PassiveAnalytics />
    </View>
  )
}

const styles = StyleSheet.create({
  drawerMask: {
    ...a.fixed,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  drawerContainer: {
    display: 'flex',
    ...a.fixed,
    top: 0,
    left: 0,
    height: '100%',
    width: 330,
    maxWidth: '80%',
  },
})
