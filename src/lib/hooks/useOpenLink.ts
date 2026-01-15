import {useCallback} from 'react'
import {Linking} from 'react-native'
import * as WebBrowser from 'expo-web-browser'

import {logEvent} from '#/lib/statsig/statsig'
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
import {IS_NATIVE} from '#/env'

export function useOpenLink() {
  const enabled = useInAppBrowser()
  const t = useTheme()
  const dialogContext = useDialogContext()
  const {inAppBrowserConsentControl} = useGlobalDialogsControlContext()

  const openLink = useCallback(
    async (url: string, override?: boolean, shouldProxy?: boolean) => {
      if (isBskyRSSUrl(url) && isRelativeUrl(url)) {
        url = createBskyAppAbsoluteUrl(url)
      }

      if (!isBskyAppUrl(url)) {
        logEvent('link:clicked', {
          domain: toNiceDomain(url),
          url,
        })

        if (shouldProxy) {
          url = createProxiedUrl(url)
        }
      }

      if (IS_NATIVE && !url.startsWith('mailto:')) {
        if (override === undefined && enabled === undefined) {
          // consent dialog is a global dialog, and while it's possible to nest dialogs,
          // the actual components need to be nested. sibling dialogs on iOS are not supported.
          // thus, check if we're in a dialog, and if so, close the existing dialog before opening the
          // consent dialog -sfn
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
            Linking.openURL(url)
          })
          return
        }
      }
      Linking.openURL(url)
    },
    [enabled, inAppBrowserConsentControl, t, dialogContext],
  )

  return openLink
}
