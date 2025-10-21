import '#/logger/sentry/setup'
import '#/logger/bitdrift/setup'
import '#/view/icons'

import React, {useEffect, useState} from 'react'
import {View} from 'react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context'
import * as ScreenOrientation from 'expo-screen-orientation'
import * as SplashScreen from 'expo-splash-screen'
import * as SystemUI from 'expo-system-ui'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as Sentry from '@sentry/react-native'

import {KeyboardControllerProvider} from '#/lib/hooks/useEnableKeyboardController'
import {Provider as HideBottomBarBorderProvider} from '#/lib/hooks/useHideBottomBarBorder'
import {QueryProvider} from '#/lib/react-query'
import {Provider as StatsigProvider, tryFetchGates} from '#/lib/statsig/statsig'
import {s} from '#/lib/styles'
import {ThemeProvider} from '#/lib/ThemeContext'
import I18nProvider from '#/locale/i18nProvider'
import {logger} from '#/logger'
import {isAndroid, isIOS} from '#/platform/detection'
import {Provider as A11yProvider} from '#/state/a11y'
import {Provider as AgeAssuranceProvider} from '#/state/ageAssurance'
import {Provider as MutedThreadsProvider} from '#/state/cache/thread-mutes'
import {Provider as DialogStateProvider} from '#/state/dialogs'
import {Provider as EmailVerificationProvider} from '#/state/email-verification'
import {listenSessionDropped} from '#/state/events'
import {
  beginResolveGeolocationConfig,
  ensureGeolocationConfigIsResolved,
  Provider as GeolocationProvider,
} from '#/state/geolocation'
import {GlobalGestureEventsProvider} from '#/state/global-gesture-events'
import {Provider as HomeBadgeProvider} from '#/state/home-badge'
import {Provider as LightboxStateProvider} from '#/state/lightbox'
import {MessagesProvider} from '#/state/messages'
import {Provider as ModalStateProvider} from '#/state/modals'
import {init as initPersistedState} from '#/state/persisted'
import {Provider as PrefsStateProvider} from '#/state/preferences'
import {Provider as LabelDefsProvider} from '#/state/preferences/label-defs'
import {Provider as ModerationOptsProvider} from '#/state/preferences/moderation-opts'
import {Provider as UnreadNotifsProvider} from '#/state/queries/notifications/unread'
import {Provider as ServiceAccountManager} from '#/state/service-config'
import {
  Provider as SessionProvider,
  type SessionAccount,
  useSession,
  useSessionApi,
} from '#/state/session'
import {readLastActiveAccount} from '#/state/session/util'
import {Provider as ShellStateProvider} from '#/state/shell'
import {Provider as ComposerProvider} from '#/state/shell/composer'
import {Provider as LoggedOutViewProvider} from '#/state/shell/logged-out'
import {Provider as ProgressGuideProvider} from '#/state/shell/progress-guide'
import {Provider as SelectedFeedProvider} from '#/state/shell/selected-feed'
import {Provider as StarterPackProvider} from '#/state/shell/starter-pack'
import {Provider as HiddenRepliesProvider} from '#/state/threadgate-hidden-replies'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, ThemeProvider as Alf} from '#/alf'
import {useColorModeTheme} from '#/alf/util/useColorModeTheme'
import {Button, ButtonText} from '#/components/Button'
import {Provider as ContextMenuProvider} from '#/components/ContextMenu'
import * as Dialog from '#/components/Dialog'
import {useStarterPackEntry} from '#/components/hooks/useStarterPackEntry'
import {Provider as IntentDialogProvider} from '#/components/intents/IntentDialogs'
import {Provider as PolicyUpdateOverlayProvider} from '#/components/PolicyUpdateOverlay'
import {Outlet as PortalOutlet} from '#/components/Portal'
import {Provider as PortalProvider} from '#/components/Portal'
import {Provider as VideoVolumeProvider} from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext'
import {ToastOutlet} from '#/components/Toast'
import {Splash} from '#/Splash'
import {BottomSheetOutlet} from '../modules/bottom-sheet'
import {BottomSheetProvider} from '../modules/bottom-sheet'
import {BackgroundNotificationPreferencesProvider} from '../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'
import {useApplyPullRequestOTAUpdate} from './lib/hooks/useOTAUpdates'
import {RequestListItem} from './screens/Messages/components/RequestListItem'
import {List} from './view/com/util/List'

SplashScreen.preventAutoHideAsync()
if (isIOS) {
  SystemUI.setBackgroundColorAsync('black')
}
if (isAndroid) {
  // iOS is handled by the config plugin -sfn
  ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.PORTRAIT_UP,
  ).catch(error =>
    logger.debug('Could not lock orientation', {safeMessage: error}),
  )
}

/**
 * Begin geolocation ASAP
 */
beginResolveGeolocationConfig()

function InnerApp() {
  const [isReady, setIsReady] = React.useState(false)
  const {currentAccount} = useSession()
  const {resumeSession} = useSessionApi()
  const theme = useColorModeTheme()
  const {_} = useLingui()
  const hasCheckedReferrer = useStarterPackEntry()

  // init
  useEffect(() => {
    async function onLaunch(account?: SessionAccount) {
      try {
        if (account) {
          await resumeSession(account)
        } else {
          await tryFetchGates(undefined, 'prefer-fresh-gates')
        }
      } catch (e) {
        logger.error(`session: resume failed`, {message: e})
      } finally {
        setIsReady(true)
      }
    }
    const account = readLastActiveAccount()
    onLaunch(account)
  }, [resumeSession])

  useEffect(() => {
    return listenSessionDropped(() => {
      Toast.show(
        _(msg`Sorry! Your session expired. Please sign in again.`),
        'info',
      )
    })
  }, [_])

  return (
    <Alf theme={theme}>
      <ThemeProvider theme={theme}>
        <ContextMenuProvider>
          <Splash isReady={isReady && hasCheckedReferrer}>
            <VideoVolumeProvider>
              <React.Fragment
                // Resets the entire tree below when it changes:
                key={currentAccount?.did}>
                <QueryProvider currentDid={currentAccount?.did}>
                  <PolicyUpdateOverlayProvider>
                    <StatsigProvider>
                      <AgeAssuranceProvider>
                        <ComposerProvider>
                          <MessagesProvider>
                            {/* LabelDefsProvider MUST come before ModerationOptsProvider */}
                            <LabelDefsProvider>
                              <ModerationOptsProvider>
                                <LoggedOutViewProvider>
                                  <SelectedFeedProvider>
                                    <HiddenRepliesProvider>
                                      <HomeBadgeProvider>
                                        <UnreadNotifsProvider>
                                          <BackgroundNotificationPreferencesProvider>
                                            <MutedThreadsProvider>
                                              <ProgressGuideProvider>
                                                <ServiceAccountManager>
                                                  <EmailVerificationProvider>
                                                    <HideBottomBarBorderProvider>
                                                      <GestureHandlerRootView
                                                        style={s.h100pct}>
                                                        <GlobalGestureEventsProvider>
                                                          <IntentDialogProvider>
                                                            <Testbed />
                                                            <ToastOutlet />
                                                            <PortalOutlet />
                                                            <BottomSheetOutlet />
                                                          </IntentDialogProvider>
                                                        </GlobalGestureEventsProvider>
                                                      </GestureHandlerRootView>
                                                    </HideBottomBarBorderProvider>
                                                  </EmailVerificationProvider>
                                                </ServiceAccountManager>
                                              </ProgressGuideProvider>
                                            </MutedThreadsProvider>
                                          </BackgroundNotificationPreferencesProvider>
                                        </UnreadNotifsProvider>
                                      </HomeBadgeProvider>
                                    </HiddenRepliesProvider>
                                  </SelectedFeedProvider>
                                </LoggedOutViewProvider>
                              </ModerationOptsProvider>
                            </LabelDefsProvider>
                          </MessagesProvider>
                        </ComposerProvider>
                      </AgeAssuranceProvider>
                    </StatsigProvider>
                  </PolicyUpdateOverlayProvider>
                </QueryProvider>
              </React.Fragment>
            </VideoVolumeProvider>
          </Splash>
        </ContextMenuProvider>
      </ThemeProvider>
    </Alf>
  )
}

function App() {
  const [isReady, setReady] = useState(false)

  React.useEffect(() => {
    Promise.all([
      initPersistedState(),
      ensureGeolocationConfigIsResolved(),
    ]).then(() => setReady(true))
  }, [])

  if (!isReady) {
    return null
  }

  /*
   * NOTE: only nothing here can depend on other data or session state, since
   * that is set up in the InnerApp component above.
   */
  return (
    <GeolocationProvider>
      <A11yProvider>
        <KeyboardControllerProvider>
          <SessionProvider>
            <PrefsStateProvider>
              <I18nProvider>
                <ShellStateProvider>
                  <ModalStateProvider>
                    <DialogStateProvider>
                      <LightboxStateProvider>
                        <PortalProvider>
                          <BottomSheetProvider>
                            <StarterPackProvider>
                              <SafeAreaProvider
                                initialMetrics={initialWindowMetrics}>
                                <InnerApp />
                              </SafeAreaProvider>
                            </StarterPackProvider>
                          </BottomSheetProvider>
                        </PortalProvider>
                      </LightboxStateProvider>
                    </DialogStateProvider>
                  </ModalStateProvider>
                </ShellStateProvider>
              </I18nProvider>
            </PrefsStateProvider>
          </SessionProvider>
        </KeyboardControllerProvider>
      </A11yProvider>
    </GeolocationProvider>
  )
}

export default Sentry.wrap(App)

function Testbed() {
  const control = Dialog.useDialogControl()
  const [showItem, setShowItem] = useState(true)

  const {revertToEmbedded} = useApplyPullRequestOTAUpdate()

  return (
    <View style={[a.align_center, a.justify_center, {gap: 16}, a.h_full]}>
      <Button
        label="show dialog"
        onPress={() => {
          control.open()
        }}
        size="large"
        color="primary">
        <ButtonText>Show dialog</ButtonText>
      </Button>
      <Button
        label="toggle list item + show toast"
        onPress={() => {
          Toast.show('toggle list item')
          setShowItem(x => !x)
        }}
        size="large"
        color="primary">
        <ButtonText>toggle list item + show toast</ButtonText>
      </Button>
      <List
        style={[{width: '100%', height: 300}, a.flex_grow_0]}
        data={showItem ? [true] : []}
        renderItem={() => (
          <RequestListItem
            convo={{
              id: 'abc',
              members: [{did: 'did:plc:abc', handle: 'alice.example.com'}],
              muted: false,
              rev: '1',
              unreadCount: 0,
            }}
          />
        )}
      />
      <Button
        label="revert to embedded js"
        onPress={() => revertToEmbedded()}
        size="large"
        color="secondary">
        <ButtonText>revert to embedded js</ButtonText>
      </Button>
      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label=""
          style={{height: 300}}
          contentContainerStyle={{gap: 12}}>
          <Button
            label="show dialog"
            onPress={() => Toast.show('Hello')}
            size="large"
            color="secondary">
            <ButtonText>Show dialog</ButtonText>
          </Button>
          <Button
            label="close dialog"
            onPress={() => {
              Toast.show('closing')
              control.close()
            }}
            size="large"
            color="primary">
            <ButtonText>Close - toast before</ButtonText>
          </Button>
          <Button
            label="close dialog"
            onPress={() => {
              control.close(() => {
                Toast.show('closed')
              })
            }}
            size="large"
            color="primary">
            <ButtonText>Close - toast after</ButtonText>
          </Button>
          <Button
            label="close dialog"
            onPress={() => {
              control.close(() => {
                setShowItem(false)
                Toast.show('closed')
              })
            }}
            size="large"
            color="primary">
            <ButtonText>Close - close + hide item</ButtonText>
          </Button>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </View>
  )
}
