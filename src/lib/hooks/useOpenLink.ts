import {useCallback} from 'react'
import {Linking} from 'react-native'
import * as WebBrowser from 'expo-web-browser'

import {
  createBskyAppAbsoluteUrl,
  isBskyAppUrl,
  isBskyRSSUrl,
  isRelativeUrl,
} from '#/lib/strings/url-helpers'
import {isNative} from '#/platform/detection'
import {useModalControls} from '#/state/modals'
import {useInAppBrowser} from '#/state/preferences/in-app-browser'
import {useOptOutOfUtm} from '#/state/preferences/opt-out-of-utm'
import {useTheme} from '#/alf'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'

export function useOpenLink() {
  const {openModal} = useModalControls()
  const enabled = useInAppBrowser()
  const t = useTheme()
  const sheetWrapper = useSheetWrapper()
  const optOutOfUtm = useOptOutOfUtm()

  const openLink = useCallback(
    async (url: string, override?: boolean) => {
      if (isBskyRSSUrl(url) && isRelativeUrl(url)) {
        url = createBskyAppAbsoluteUrl(url)
      }

      if (isNative && !url.startsWith('mailto:')) {
        if (!optOutOfUtm && !isBskyAppUrl(url) && url.startsWith('http')) {
          url = addUtmSource(url)
        }
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
    [enabled, openModal, t, sheetWrapper, optOutOfUtm],
  )

  return openLink
}

function addUtmSource(url: string): string {
  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch (e) {
    return url
  }
  if (!parsedUrl.searchParams.has('utm_source')) {
    parsedUrl.searchParams.set('utm_source', 'bluesky')
    if (!parsedUrl.searchParams.has('utm_medium')) {
      parsedUrl.searchParams.set('utm_medium', 'social')
    }
  }
  return parsedUrl.toString()
}
