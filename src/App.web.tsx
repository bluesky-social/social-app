import '#/logger/sentry/setup' // must be near top
import './style.css'

// OAuth dev-host normalization. The atproto OAuth loopback profile mandates
// 127.0.0.1 (or [::1]) as the redirect_uri, but Expo's dev server is reachable
// on both `localhost` and `127.0.0.1` — different browser origins with
// separate IndexedDB/localStorage. If the user lands on `localhost`, the
// OAuth client persists request state there, then the callback redirects to
// `127.0.0.1` and the new origin can't read that state, so the flow
// silently restarts without a session. Normalize to 127.0.0.1 on entry,
// before any OAuth state is read or written.
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  const url = new URL(window.location.href)
  url.hostname = '127.0.0.1'
  window.location.replace(url.toString())
}

import {Fragment, useEffect, useState} from 'react'
import {KeyboardProvider as KeyboardControllerProvider} from 'react-native-keyboard-controller'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {useLingui} from '@lingui/react/macro'
import * as Sentry from '@sentry/react-native'

import {BrandProvider, useBrand} from '#/lib/community/BrandContext'
import {Provider as HotkeysProvider} from '#/lib/hotkeys'
import {QueryProvider} from '#/lib/react-query'
import {ThemeProvider} from '#/lib/ThemeContext'
import {Provider as TranslateOnDeviceProvider} from '#/lib/translation'
import I18nProvider from '#/locale/i18nProvider'
import {logger} from '#/logger'
import {Provider as A11yProvider} from '#/state/a11y'
import {
  prefetchAppConfig,
  Provider as AppConfigProvider,
} from '#/state/appConfig'
import {Provider as MutedThreadsProvider} from '#/state/cache/thread-mutes'
import {Provider as DialogStateProvider} from '#/state/dialogs'
import {Provider as EmailVerificationProvider} from '#/state/email-verification'
import {listenSessionDropped} from '#/state/events'
import {Provider as HomeBadgeProvider} from '#/state/home-badge'
import {MessagesProvider} from '#/state/messages'
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
import {getOAuthClient} from '#/state/session/oauth-client'
import {readLastActiveAccount} from '#/state/session/util'
import {Provider as ShellStateProvider} from '#/state/shell'
import {Provider as ComposerProvider} from '#/state/shell/composer'
import {Provider as LandingProvider} from '#/state/shell/landing'
import {Provider as LoggedOutViewProvider} from '#/state/shell/logged-out'
import {Provider as OnboardingProvider} from '#/state/shell/onboarding'
import {Provider as ProgressGuideProvider} from '#/state/shell/progress-guide'
import {Provider as SelectedFeedProvider} from '#/state/shell/selected-feed'
import {Provider as HiddenRepliesProvider} from '#/state/threadgate-hidden-replies'
import {Shell} from '#/view/shell/index'
import {ThemeProvider as Alf} from '#/alf'
import {useColorModeTheme} from '#/alf/util/useColorModeTheme'
import {Provider as ContextMenuProvider} from '#/components/ContextMenu'
import {useLandingEntry} from '#/components/hooks/useLandingEntry'
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

void prefetchLiveEvents()
void prefetchAppConfig()

function hasOAuthCallbackParams(): boolean {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const query = new URLSearchParams(window.location.search)
  const params = hash.has('state') ? hash : query
  return params.has('state') && (params.has('code') || params.has('error'))
}

function InnerApp() {
  const [isReady, setIsReady] = useState(false)
  const {currentAccount} = useSession()
  const {resumeSession, login} = useSessionApi()
  const theme = useColorModeTheme()
  const brand = useBrand()
  const {t: l} = useLingui()
  const hasCheckedLanding = useLandingEntry()

  // init
  useEffect(() => {
    async function onLaunch(account?: SessionAccount) {
      try {
        // Check for OAuth callback params first (loopback redirects to /)
        if (hasOAuthCallbackParams()) {
          const client = getOAuthClient()
          /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Expo OAuth types do not resolve under the web TS project in Linux CI */
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
          /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
        }

        if (account) {
          await resumeSession(account)
        } else {
          await features.init
        }
      } catch (e) {
        logger.error('session: resumeSession failed', {message: e})
      } finally {
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
    <Alf
      theme={theme}
      brandColors={brand.theme.brand}
      brandHue={brand.theme.hue}
      brandBgHue={brand.theme.bgHue}
      brandColorScale={brand.theme.colorScale}>
      <ThemeProvider theme={theme}>
        <ContextMenuProvider>
          <Splash isReady={isReady && hasCheckedLanding}>
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
                                                            <HotkeysProvider>
                                                              <Shell />
                                                              <ToastOutlet />
                                                            </HotkeysProvider>
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
    void Promise.all([initPersistedState(), setupDeviceId]).then(() =>
      setIsReady(true),
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
    <BrandProvider>
      <AppConfigProvider>
        <A11yProvider>
          <KeyboardControllerProvider>
            <OnboardingProvider>
              <AnalyticsContext>
                <SessionProvider>
                  <PrefsStateProvider>
                    <I18nProvider>
                      <ShellStateProvider>
                        <DialogStateProvider>
                          <LightboxStateProvider>
                            <PortalProvider>
                              <LandingProvider>
                                <InnerApp />
                              </LandingProvider>
                            </PortalProvider>
                          </LightboxStateProvider>
                        </DialogStateProvider>
                      </ShellStateProvider>
                    </I18nProvider>
                  </PrefsStateProvider>
                </SessionProvider>
              </AnalyticsContext>
            </OnboardingProvider>
          </KeyboardControllerProvider>
        </A11yProvider>
      </AppConfigProvider>
    </BrandProvider>
  )
}

export default Sentry.wrap(App)
