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
import {useComposerKeyboardShortcut} from '#/state/shell/composer/useComposerKeyboardShortcut'
import {useCloseAllActiveElements} from '#/state/util'
import {Lightbox} from '#/view/com/lightbox/Lightbox'
import {ModalsContainer} from '#/view/com/modals/Modal'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {Deactivated} from '#/screens/Deactivated'
import {Takendown} from '#/screens/Takendown'
import {atoms as a, select, useBreakpoints, useTheme} from '#/alf'
import {AgeAssuranceRedirectDialog} from '#/components/ageAssurance/AgeAssuranceRedirectDialog'
import {EmailDialog} from '#/components/dialogs/EmailDialog'
import {LinkWarningDialog} from '#/components/dialogs/LinkWarning'
import {MutedWordsDialog} from '#/components/dialogs/MutedWords'
import {NuxDialogs} from '#/components/dialogs/nuxs'
import {SigninDialog} from '#/components/dialogs/Signin'
import {useWelcomeModal} from '#/components/hooks/useWelcomeModal'
import {GlobalReportDialog} from '#/components/moderation/ReportDialog'
import {
  Outlet as PolicyUpdateOverlayPortalOutlet,
  usePolicyUpdateContext,
} from '#/components/PolicyUpdateOverlay'
import {Outlet as PortalOutlet} from '#/components/Portal'
import {WelcomeModal} from '#/components/WelcomeModal'
import {useAgeAssurance} from '#/ageAssurance'
import {NoAccessScreen} from '#/ageAssurance/components/NoAccessScreen'
import {RedirectOverlay} from '#/ageAssurance/components/RedirectOverlay'
import {PassiveAnalytics} from '#/analytics/PassiveAnalytics'
import {FlatNavigator, RoutesContainer} from '#/Navigation'
import {Composer} from './Composer.web'
import {DrawerContent} from './Drawer'

function ShellInner() {
  const navigator = useNavigation<NavigationProp>()
  const closeAllActiveElements = useCloseAllActiveElements()
  const {state: policyUpdateState} = usePolicyUpdateContext()
  const welcomeModalControl = useWelcomeModal()

  useComposerKeyboardShortcut()
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
      <Composer winHeight={0} />
      <ModalsContainer />
      <MutedWordsDialog />
      <SigninDialog />
      <EmailDialog />
      <AgeAssuranceRedirectDialog />
      <LinkWarningDialog />
      <Lightbox />
      <NuxDialogs />
      <GlobalReportDialog />

      {welcomeModalControl.isOpen && (
        <WelcomeModal control={welcomeModalControl} />
      )}

      {/* Until policy update has been completed by the user, don't render anything that is portaled */}
      {policyUpdateState.completed && (
        <>
          <PortalOutlet />
        </>
      )}

      <PolicyUpdateOverlayPortalOutlet />
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
  const aa = useAgeAssurance()
  const {currentAccount} = useSession()
  return (
    <View style={[a.util_screen_outer, t.atoms.bg]}>
      {currentAccount?.status === 'takendown' ? (
        <Takendown />
      ) : currentAccount?.status === 'deactivated' ? (
        <Deactivated />
      ) : (
        <>
          {aa.state.access === aa.Access.None ? (
            <NoAccessScreen />
          ) : (
            <RoutesContainer>
              <ShellInner />
            </RoutesContainer>
          )}

          <RedirectOverlay />
        </>
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
