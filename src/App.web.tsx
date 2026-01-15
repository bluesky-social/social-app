import '#/logger/sentry/setup' // must be near top
import '#/view/icons'
import './style.css'

import React, {useEffect, useState} from 'react'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as Sentry from '@sentry/react-native'

import {QueryProvider} from '#/lib/react-query'
import {Provider as StatsigProvider} from '#/lib/statsig/statsig'
import {ThemeProvider} from '#/lib/ThemeContext'
import I18nProvider from '#/locale/i18nProvider'
import {logger} from '#/logger'
import {Provider as A11yProvider} from '#/state/a11y'
import {Provider as MutedThreadsProvider} from '#/state/cache/thread-mutes'
import {Provider as DialogStateProvider} from '#/state/dialogs'
import {Provider as EmailVerificationProvider} from '#/state/email-verification'
import {listenSessionDropped} from '#/state/events'
import {Provider as HomeBadgeProvider} from '#/state/home-badge'
import {Provider as LightboxStateProvider} from '#/state/lightbox'
import {MessagesProvider} from '#/state/messages'
import {Provider as ModalStateProvider} from '#/state/modals'
import {init as initPersistedState} from '#/state/persisted'
import {Provider as PrefsStateProvider} from '#/state/preferences'
import {Provider as LabelDefsProvider} from '#/state/preferences/label-defs'
import {Provider as ModerationOptsProvider} from '#/state/preferences/moderation-opts'
import {Provider as UnreadNotifsProvider} from '#/state/queries/notifications/unread'
import {Provider as ServiceConfigProvider} from '#/state/service-config'
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
import {Provider as OnboardingProvider} from '#/state/shell/onboarding'
import {Provider as ProgressGuideProvider} from '#/state/shell/progress-guide'
import {Provider as SelectedFeedProvider} from '#/state/shell/selected-feed'
import {Provider as StarterPackProvider} from '#/state/shell/starter-pack'
import {Provider as HiddenRepliesProvider} from '#/state/threadgate-hidden-replies'
import * as Toast from '#/view/com/util/Toast'
import {Shell} from '#/view/shell/index'
import {ThemeProvider as Alf} from '#/alf'
import {useColorModeTheme} from '#/alf/util/useColorModeTheme'
import {Provider as ContextMenuProvider} from '#/components/ContextMenu'
import {useStarterPackEntry} from '#/components/hooks/useStarterPackEntry'
import {Provider as IntentDialogProvider} from '#/components/intents/IntentDialogs'
import {Provider as PolicyUpdateOverlayProvider} from '#/components/PolicyUpdateOverlay'
import {Provider as PortalProvider} from '#/components/Portal'
import {Provider as ActiveVideoProvider} from '#/components/Post/Embed/VideoEmbed/ActiveVideoWebContext'
import {Provider as VideoVolumeProvider} from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext'
import {ToastOutlet} from '#/components/Toast'
import {Provider as AgeAssuranceV2Provider} from '#/ageAssurance'
import {prefetchAgeAssuranceConfig} from '#/ageAssurance'
import {
  prefetchLiveEvents,
  Provider as LiveEventsProvider,
} from '#/features/liveEvents/context'
import * as Geo from '#/geolocation'
import {Splash} from '#/Splash'
import {BackgroundNotificationPreferencesProvider} from '../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'
import {Provider as HideBottomBarBorderProvider} from './lib/hooks/useHideBottomBarBorder'

/**
 * Begin geolocation ASAP
 */
Geo.resolve()
prefetchAgeAssuranceConfig()
prefetchLiveEvents()

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
        _(msg`Sorry! Your session expired. Please sign in again.`),
        'info',
      )
    })
  }, [_])

  // wait for session to resume
  if (!isReady || !hasCheckedReferrer) return <Splash isReady />

  return (
    <Alf theme={theme}>
      <ThemeProvider theme={theme}>
        <ContextMenuProvider>
          <VideoVolumeProvider>
            <ActiveVideoProvider>
              <React.Fragment
                // Resets the entire tree below when it changes:
                key={currentAccount?.did}>
                <QueryProvider currentDid={currentAccount?.did}>
                  <PolicyUpdateOverlayProvider>
                    <StatsigProvider>
                      <LiveEventsProvider>
                        <AgeAssuranceV2Provider>
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
                                                <SafeAreaProvider>
                                                  <ProgressGuideProvider>
                                                    <ServiceConfigProvider>
                                                      <EmailVerificationProvider>
                                                        <HideBottomBarBorderProvider>
                                                          <IntentDialogProvider>
                                                            <Shell />
                                                            <ToastOutlet />
                                                          </IntentDialogProvider>
                                                        </HideBottomBarBorderProvider>
                                                      </EmailVerificationProvider>
                                                    </ServiceConfigProvider>
                                                  </ProgressGuideProvider>
                                                </SafeAreaProvider>
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
                        </AgeAssuranceV2Provider>
                      </LiveEventsProvider>
                    </StatsigProvider>
                  </PolicyUpdateOverlayProvider>
                </QueryProvider>
              </React.Fragment>
            </ActiveVideoProvider>
          </VideoVolumeProvider>
        </ContextMenuProvider>
      </ThemeProvider>
    </Alf>
  )
}

function App() {
  const [isReady, setReady] = useState(false)

  React.useEffect(() => {
    Promise.all([initPersistedState(), Geo.resolve()]).then(() =>
      setReady(true),
    )
  }, [])

  if (!isReady) {
    return <Splash isReady />
  }

  /*
   * NOTE: only nothing here can depend on other data or session state, since
   * that is set up in the InnerApp component above.
   */
  return (
    <Geo.Provider>
      <A11yProvider>
        <OnboardingProvider>
          <SessionProvider>
            <PrefsStateProvider>
              <I18nProvider>
                <ShellStateProvider>
                  <ModalStateProvider>
                    <DialogStateProvider>
                      <LightboxStateProvider>
                        <PortalProvider>
                          <StarterPackProvider>
                            <InnerApp />
                          </StarterPackProvider>
                        </PortalProvider>
                      </LightboxStateProvider>
                    </DialogStateProvider>
                  </ModalStateProvider>
                </ShellStateProvider>
              </I18nProvider>
            </PrefsStateProvider>
          </SessionProvider>
        </OnboardingProvider>
      </A11yProvider>
    </Geo.Provider>
  )
}

export default Sentry.wrap(App)
