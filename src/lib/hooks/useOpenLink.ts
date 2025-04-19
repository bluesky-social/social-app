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
import {isNative} from '#/platform/detection'
import {useInAppBrowser} from '#/state/preferences/in-app-browser'
import {useTheme} from '#/alf'
import {useDialogContext} from '#/components/Dialog'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'

export function useOpenLink() {
  const enabled = useInAppBrowser()
  const t = useTheme()
  const sheetWrapper = useSheetWrapper()
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

      if (isNative && !url.startsWith('mailto:')) {
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
          await sheetWrapper(
            WebBrowser.openBrowserAsync(url, {
              presentationStyle:
                WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
              toolbarColor: t.atoms.bg.backgroundColor,
              controlsColor: t.palette.primary_500,
              createTask: false,
            }),
          )
          return
        }
      }
      Linking.openURL(url)
    },
    [enabled, inAppBrowserConsentControl, t, sheetWrapper, dialogContext],
  )

  return openLink
}
