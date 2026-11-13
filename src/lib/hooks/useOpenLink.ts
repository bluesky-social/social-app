import {useCallback} from 'react'
import {Linking} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import {AppLink} from '@bsky.app/expo-bluesky-swiss-army'

import {
  createBskyAppAbsoluteUrl,
  createProxiedUrl,
  isBskyAppUrl,
  isBskyRSSUrl,
  isRelativeUrl,
  toNiceDomain,
} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {useInAppBrowser} from '#/state/preferences/in-app-browser'
import {useTheme} from '#/alf'
import {useDialogContext} from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'

export function useOpenLink({
  preferNativeApp = false,
}: {
  /** Try an app-only handoff before browser consent, unless a browser is explicitly requested. */
  preferNativeApp?: boolean
} = {}) {
  const ax = useAnalytics()
  const enabled = useInAppBrowser()
  const t = useTheme()
  const dialogContext = useDialogContext()
  const {inAppBrowserConsentControl} = useGlobalDialogsControlContext()

  const openLink = useCallback(
    (url: string, override?: boolean, shouldProxy?: boolean) => {
      if (isBskyRSSUrl(url) && isRelativeUrl(url)) {
        url = createBskyAppAbsoluteUrl(url)
      }

      if (!isBskyAppUrl(url)) {
        ax.metric('link:clicked', {
          domain: toNiceDomain(url),
          url,
        })
      }

      const openInBrowser = () => {
        if (!isBskyAppUrl(url) && shouldProxy) {
          url = createProxiedUrl(url)
        }

        if (IS_NATIVE && !url.startsWith('mailto:')) {
          if (override === undefined && enabled === undefined) {
            /*
             * The consent dialog is a global dialog. Sibling dialogs on iOS
             * are not supported, so close any enclosing dialog first.
             */
            if (dialogContext.isWithinDialog) {
              dialogContext.close(() => {
                inAppBrowserConsentControl.open(url)
              })
            } else {
              inAppBrowserConsentControl.open(url)
            }
            return
          } else if (override ?? enabled) {
            WebBrowser.openBrowserAsync(url, {
              presentationStyle:
                WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
              toolbarColor: t.atoms.bg.backgroundColor,
              controlsColor: t.palette.primary_500,
              createTask: false,
            }).catch(err => {
              if (__DEV__)
                logger.error('Could not open web browser', {message: err})
              void Linking.openURL(url)
            })
            return
          }
        }
        void Linking.openURL(url)
      }

      if (IS_NATIVE && preferNativeApp && override === undefined) {
        try {
          const destination = new URL(url)
          if (
            (destination.protocol === 'https:' ||
              destination.protocol === 'http:') &&
            destination.hostname !== 'bsky.app'
          ) {
            void AppLink.tryOpen(url).then(opened => {
              if (!opened) openInBrowser()
            }, openInBrowser)
            return
          }
        } catch {
          // An unavailable or failing bridge must not prevent browser fallback.
        }
      }

      openInBrowser()
    },
    [
      ax,
      enabled,
      inAppBrowserConsentControl,
      t,
      dialogContext,
      preferNativeApp,
    ],
  )

  return openLink
}
