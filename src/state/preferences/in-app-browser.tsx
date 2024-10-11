import React from 'react'
import {Linking} from 'react-native'
import * as WebBrowser from 'expo-web-browser'

import {
  createBskyAppAbsoluteUrl,
  isBskyRSSUrl,
  isRelativeUrl,
} from '#/lib/strings/url-helpers'
import {isNative} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {useTheme} from '#/alf'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {useModalControls} from '../modals'

type StateContext = persisted.Schema['useInAppBrowser']
type SetContext = (v: persisted.Schema['useInAppBrowser']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.useInAppBrowser,
)
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['useInAppBrowser']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('useInAppBrowser'))

  const setStateWrapped = React.useCallback(
    (inAppBrowser: persisted.Schema['useInAppBrowser']) => {
      setState(inAppBrowser)
      persisted.write('useInAppBrowser', inAppBrowser)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('useInAppBrowser', nextUseInAppBrowser => {
      setState(nextUseInAppBrowser)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useInAppBrowser() {
  return React.useContext(stateContext)
}

export function useSetInAppBrowser() {
  return React.useContext(setContext)
}

export function useOpenLink() {
  const {openModal} = useModalControls()
  const enabled = useInAppBrowser()
  const t = useTheme()
  const sheetWrapper = useSheetWrapper()

  const openLink = React.useCallback(
    async (url: string, override?: boolean) => {
      if (isBskyRSSUrl(url) && isRelativeUrl(url)) {
        url = createBskyAppAbsoluteUrl(url)
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
