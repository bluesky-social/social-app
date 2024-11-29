import '#/lib/sentry' // must be near top
import '#/view/icons'
import './style.css'

import React, {useEffect, useState} from 'react'
import {RootSiblingParent} from 'react-native-root-siblings'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {QueryProvider} from '#/lib/react-query'
import {Provider as StatsigProvider} from '#/lib/statsig/statsig'
import {ThemeProvider} from '#/lib/ThemeContext'
import I18nProvider from '#/locale/i18nProvider'
import {logger} from '#/logger'
import {Provider as A11yProvider} from '#/state/a11y'
import {Provider as MutedThreadsProvider} from '#/state/cache/thread-mutes'
import {Provider as DialogStateProvider} from '#/state/dialogs'
import {listenSessionDropped} from '#/state/events'
import {
  beginResolveGeolocation,
  ensureGeolocationResolved,
  Provider as GeolocationProvider,
} from '#/state/geolocation'
import {Provider as InvitesStateProvider} from '#/state/invites'
import {Provider as LightboxStateProvider} from '#/state/lightbox'
import {MessagesProvider} from '#/state/messages'
import {Provider as ModalStateProvider} from '#/state/modals'
import {init as initPersistedState} from '#/state/persisted'
import {Provider as PrefsStateProvider} from '#/state/preferences'
import {Provider as LabelDefsProvider} from '#/state/preferences/label-defs'
import {Provider as ModerationOptsProvider} from '#/state/preferences/moderation-opts'
import {Provider as UnreadNotifsProvider} from '#/state/queries/notifications/unread'
import {
  Provider as SessionProvider,
  SessionAccount,
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
import {Provider as ActiveVideoProvider} from '#/view/com/util/post-embeds/ActiveVideoWebContext'
import {Provider as VideoVolumeProvider} from '#/view/com/util/post-embeds/VideoVolumeContext'
import * as Toast from '#/view/com/util/Toast'
import {ToastContainer} from '#/view/com/util/Toast.web'
import {Shell} from '#/view/shell/index'
import {ThemeProvider as Alf} from '#/alf'
import {useColorModeTheme} from '#/alf/util/useColorModeTheme'
import {NuxDialogs} from '#/components/dialogs/nuxs'
import {useStarterPackEntry} from '#/components/hooks/useStarterPackEntry'
import {Provider as IntentDialogProvider} from '#/components/intents/IntentDialogs'
import {Provider as PortalProvider} from '#/components/Portal'
import {BackgroundNotificationPreferencesProvider} from '../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'

/**
 * Begin geolocation ASAP
 */
beginResolveGeolocation()

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
        }
      } catch (e) {
        logger.error(`session: resumeSession failed`, {message: e})
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
        _(msg`Sorry! Your session expired. Please log in again.`),
        'info',
      )
    })
  }, [_])

  // wait for session to resume
  if (!isReady || !hasCheckedReferrer) return null

  return (
    <Alf theme={theme}>
      <ThemeProvider theme={theme}>
        <RootSiblingParent>
          <VideoVolumeProvider>
            <ActiveVideoProvider>
              <React.Fragment
                // Resets the entire tree below when it changes:
                key={currentAccount?.did}>
                <QueryProvider currentDid={currentAccount?.did}>
                  <ComposerProvider>
                    <StatsigProvider>
                      <MessagesProvider>
                        {/* LabelDefsProvider MUST come before ModerationOptsProvider */}
                        <LabelDefsProvider>
                          <ModerationOptsProvider>
                            <LoggedOutViewProvider>
                              <SelectedFeedProvider>
                                <HiddenRepliesProvider>
                                  <UnreadNotifsProvider>
                                    <BackgroundNotificationPreferencesProvider>
                                      <MutedThreadsProvider>
                                        <SafeAreaProvider>
                                          <ProgressGuideProvider>
                                            <Shell />
                                            <NuxDialogs />
                                          </ProgressGuideProvider>
                                        </SafeAreaProvider>
                                      </MutedThreadsProvider>
                                    </BackgroundNotificationPreferencesProvider>
                                  </UnreadNotifsProvider>
                                </HiddenRepliesProvider>
                              </SelectedFeedProvider>
                            </LoggedOutViewProvider>
                          </ModerationOptsProvider>
                        </LabelDefsProvider>
                      </MessagesProvider>
                    </StatsigProvider>
                  </ComposerProvider>
                </QueryProvider>
                <ToastContainer />
              </React.Fragment>
            </ActiveVideoProvider>
          </VideoVolumeProvider>
        </RootSiblingParent>
      </ThemeProvider>
    </Alf>
  )
}

function App() {
  const [isReady, setReady] = useState(false)

  React.useEffect(() => {
    Promise.all([initPersistedState(), ensureGeolocationResolved()]).then(() =>
      setReady(true),
    )
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
        <SessionProvider>
          <PrefsStateProvider>
            <I18nProvider>
              <ShellStateProvider>
                <InvitesStateProvider>
                  <ModalStateProvider>
                    <DialogStateProvider>
                      <LightboxStateProvider>
                        <PortalProvider>
                          <StarterPackProvider>
                            <IntentDialogProvider>
                              <InnerApp />
                            </IntentDialogProvider>
                          </StarterPackProvider>
                        </PortalProvider>
                      </LightboxStateProvider>
                    </DialogStateProvider>
                  </ModalStateProvider>
                </InvitesStateProvider>
              </ShellStateProvider>
            </I18nProvider>
          </PrefsStateProvider>
        </SessionProvider>
      </A11yProvider>
    </GeolocationProvider>
  )
}

export default App
