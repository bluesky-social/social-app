import '#/logger/sentry/setup' // must be near top
import '#/view/icons'
import './style.css'

import {Fragment, useEffect, useState} from 'react'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {useLingui} from '@lingui/react/macro'
import * as Sentry from '@sentry/react-native'

import {QueryProvider} from '#/lib/react-query'
import {ThemeProvider} from '#/lib/ThemeContext'
import {Provider as TranslateOnDeviceProvider} from '#/lib/translation'
import I18nProvider from '#/locale/i18nProvider'
import {logger} from '#/logger'
import {Provider as A11yProvider} from '#/state/a11y'
import {Provider as MutedThreadsProvider} from '#/state/cache/thread-mutes'
import {Provider as DialogStateProvider} from '#/state/dialogs'
import {Provider as EmailVerificationProvider} from '#/state/email-verification'
import {listenSessionDropped} from '#/state/events'
import {Provider as HomeBadgeProvider} from '#/state/home-badge'
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
import {getWebOAuthClient} from '#/state/session/oauth-web-client'
import {readLastActiveAccount} from '#/state/session/util'
import {Provider as ShellStateProvider} from '#/state/shell'
import {Provider as ComposerProvider} from '#/state/shell/composer'
import {Provider as LoggedOutViewProvider} from '#/state/shell/logged-out'
import {Provider as OnboardingProvider} from '#/state/shell/onboarding'
import {Provider as ProgressGuideProvider} from '#/state/shell/progress-guide'
import {Provider as SelectedFeedProvider} from '#/state/shell/selected-feed'
import {Provider as StarterPackProvider} from '#/state/shell/starter-pack'
import {Provider as HiddenRepliesProvider} from '#/state/threadgate-hidden-replies'
import {Shell} from '#/view/shell/index'
import {ThemeProvider as Alf} from '#/alf'
import {useColorModeTheme} from '#/alf/util/useColorModeTheme'
import {Provider as ContextMenuProvider} from '#/components/ContextMenu'
import {useStarterPackEntry} from '#/components/hooks/useStarterPackEntry'
import {Provider as IntentDialogProvider} from '#/components/intents/IntentDialogs'
import {Provider as LightboxStateProvider} from '#/components/Lightbox/state'
import {Provider as PortalProvider} from '#/components/Portal'
import {Provider as ActiveVideoProvider} from '#/components/Post/Embed/VideoEmbed/ActiveVideoWebContext'
import {Provider as VideoVolumeProvider} from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext'
import * as Toast from '#/components/Toast'
import {ToastOutlet} from '#/components/Toast'
import {
  AnalyticsContext,
  AnalyticsFeaturesContext,
  features,
  setupDeviceId,
} from '#/analytics'
import {
  prefetchLiveEvents,
  Provider as LiveEventsProvider,
} from '#/features/liveEvents/context'
import {Splash} from '#/Splash'
import {BackgroundNotificationPreferencesProvider} from '../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider'
import {Provider as HideBottomBarBorderProvider} from './lib/hooks/useHideBottomBarBorder'

// For local development: the OAuth loopback spec requires IP-based origins
// (127.0.0.1), not "localhost". The auth server redirects to 127.0.0.1, but
// IndexedDB is per-origin, so PKCE state stored on "localhost" is unreachable
// from "127.0.0.1". Redirect immediately so both signIn() and the callback
// use the same origin.
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  const url = new URL(window.location.href)
  url.hostname = '127.0.0.1'
  window.location.replace(url.href)
}

function hasOAuthCallbackParams(): boolean {
  // OAuth callback params come in the hash fragment (response_mode=fragment)
  // or query string. Check both for "state" + ("code" or "error").
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const query = new URLSearchParams(window.location.search)
  const params = hash.has('state') ? hash : query
  return params.has('state') && (params.has('code') || params.has('error'))
}

prefetchLiveEvents()

function InnerApp() {
  const [isReady, setIsReady] = useState(false)
  const {currentAccount} = useSession()
  const {resumeSession, login} = useSessionApi()
  const theme = useColorModeTheme()
  const {t: l} = useLingui()
  const hasCheckedReferrer = useStarterPackEntry()

  // init
  useEffect(() => {
    // Safety valve: if onLaunch hangs (e.g. stale IndexedDB blocking an
    // upgrade, or a never-settling promise), the app will still load after
    // this timeout fires. Without this, a hanging `await` prevents the
    // `finally` block from ever executing.
    const safetyTimeout = setTimeout(() => {
      logger.warn('session: onLaunch safety timeout fired, forcing ready state')
      setIsReady(true)
    }, 15_000)

    async function onLaunch(account?: SessionAccount) {
      try {
        // Check for OAuth callback params first (loopback redirects to /)
        if (hasOAuthCallbackParams()) {
          const client = getWebOAuthClient()
          const result = await client.init()
          if (result?.session) {
            await login(
              {
                service: '',
                identifier: '',
                password: '',
                oauthSession: result.session,
              },
              'LoginForm',
            )
            // Clear hash fragment after processing
            window.history.replaceState(null, '', window.location.pathname)
            return
          }
        }

        if (account) {
          await resumeSession(account)
        } else {
          await features.init
        }
      } catch (e) {
        logger.error('session: resumeSession failed', {message: e})
      } finally {
        clearTimeout(safetyTimeout)
        setIsReady(true)
      }
    }
    const account = readLastActiveAccount()
    void onLaunch(account)
  }, [resumeSession, login])

  useEffect(() => {
    return listenSessionDropped(() => {
      Toast.show(l`Sorry! Your session expired. Please sign in again.`, {
        type: 'info',
      })
    })
  }, [l])

  return (
    <Alf theme={theme}>
      <ThemeProvider theme={theme}>
        <ContextMenuProvider>
          <Splash isReady={isReady && hasCheckedReferrer}>
            <VideoVolumeProvider>
              <ActiveVideoProvider>
                <Fragment
                  // Resets the entire tree below when it changes:
                  key={currentAccount?.did}>
                  <AnalyticsFeaturesContext>
                    <QueryProvider currentDid={currentAccount?.did}>
                      <LiveEventsProvider>
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
                                                          <TranslateOnDeviceProvider>
                                                            <Shell />
                                                            <ToastOutlet />
                                                          </TranslateOnDeviceProvider>
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
                      </LiveEventsProvider>
                    </QueryProvider>
                  </AnalyticsFeaturesContext>
                </Fragment>
              </ActiveVideoProvider>
            </VideoVolumeProvider>
          </Splash>
        </ContextMenuProvider>
      </ThemeProvider>
    </Alf>
  )
}

function App() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    void Promise.all([initPersistedState(), setupDeviceId])
      .then(() => setIsReady(true))
      .catch(() => setIsReady(true))
  }, [])

  if (!isReady) {
    return null
  }

  /*
   * NOTE: only nothing here can depend on other data or session state, since
   * that is set up in the InnerApp component above.
   */
  return (
    <A11yProvider>
      <OnboardingProvider>
        <AnalyticsContext>
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
        </AnalyticsContext>
      </OnboardingProvider>
    </A11yProvider>
  )
}

export default Sentry.wrap(App)
