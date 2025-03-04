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
import {useModalControls} from '#/state/modals'
import {useInAppBrowser} from '#/state/preferences/in-app-browser'
import {useTheme} from '#/alf'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'

export function useOpenLink() {
  const {openModal} = useModalControls()
  const enabled = useInAppBrowser()
  const t = useTheme()
  const sheetWrapper = useSheetWrapper()

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
          openModal({
            name: 'in-app-browser-consent',
            href: url,
          })
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
    [enabled, openModal, t, sheetWrapper],
  )

  return openLink
}
