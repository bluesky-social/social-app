import {Linking} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import {AppLink} from '@bsky.app/expo-bluesky-swiss-army'
import {act, renderHook} from '@testing-library/react-native'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {createProxiedUrl} from '#/lib/strings/url-helpers'
import {useInAppBrowser} from '#/state/preferences/in-app-browser'

const mockMetric = jest.fn()
const mockConsentOpen = jest.fn()
const mockDialogClose = jest.fn((callback: () => void) => callback())
let mockWithinDialog = false
let mockIsNative = true

jest.mock('@bsky.app/expo-bluesky-swiss-army', () => ({
  AppLink: {tryOpen: jest.fn()},
}))

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: {FULL_SCREEN: 'fullScreen'},
  WebBrowserResultType: {CANCEL: 'cancel'},
}))

jest.mock('#/state/preferences/in-app-browser', () => ({
  useInAppBrowser: jest.fn(),
}))

jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))

jest.mock('#/alf', () => ({
  useTheme: () => ({
    atoms: {bg: {backgroundColor: '#fff'}},
    palette: {primary_500: '#00f'},
  }),
}))

jest.mock('#/components/Dialog', () => ({
  useDialogContext: () => ({
    isWithinDialog: mockWithinDialog,
    close: mockDialogClose,
  }),
}))

jest.mock('#/components/dialogs/Context', () => ({
  useGlobalDialogsControlContext: () => ({
    inAppBrowserConsentControl: {open: mockConsentOpen},
  }),
}))

jest.mock('#/logger', () => ({logger: {error: jest.fn()}}))
jest.mock('#/env', () => ({
  get IS_NATIVE() {
    return mockIsNative
  },
}))

const url = 'https://grain.social/profile/esb.lol/gallery/3mx3sn672gljc'

function renderOpenLink(preferNativeApp?: boolean) {
  const {result} = renderHook(() => useOpenLink({preferNativeApp}))
  return async (...args: Parameters<typeof result.current>) => {
    await act(async () => {
      result.current(...args)
      await Promise.resolve()
    })
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockWithinDialog = false
  mockIsNative = true
  jest.mocked(useInAppBrowser).mockReturnValue(true)
  jest.mocked(AppLink.tryOpen).mockResolvedValue(false)
  jest.mocked(WebBrowser.openBrowserAsync).mockResolvedValue({
    type: WebBrowser.WebBrowserResultType.CANCEL,
  })
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
})

afterEach(() => {
  jest.restoreAllMocks()
})

it('leaves callers that have not opted in on the existing browser flow', async () => {
  const openLink = renderOpenLink()
  await openLink(url)

  expect(AppLink.tryOpen).not.toHaveBeenCalled()
  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
    url,
    expect.anything(),
  )
})

it('stops after a successful handoff, before consent and proxy rewriting', async () => {
  jest.mocked(useInAppBrowser).mockReturnValue(undefined)
  jest.mocked(AppLink.tryOpen).mockResolvedValue(true)
  const openLink = renderOpenLink(true)
  await openLink(url, undefined, true)

  expect(AppLink.tryOpen).toHaveBeenCalledWith(url)
  expect(mockConsentOpen).not.toHaveBeenCalled()
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled()
  expect(Linking.openURL).not.toHaveBeenCalled()
  expect(mockMetric).toHaveBeenCalledTimes(1)
  expect(mockMetric).toHaveBeenCalledWith('link:clicked', {
    domain: 'grain.social',
    url,
  })
})

it.each(['unhandled', 'bridge rejection', 'bridge throw'])(
  'falls back to the in-app browser when the link is %s',
  async failure => {
    if (failure === 'bridge rejection') {
      jest.mocked(AppLink.tryOpen).mockRejectedValue(new Error('Bridge failed'))
    } else if (failure === 'bridge throw') {
      jest.mocked(AppLink.tryOpen).mockImplementation(() => {
        throw new Error('Bridge unavailable')
      })
    }
    const openLink = renderOpenLink(true)
    await openLink(url, undefined, true)

    expect(AppLink.tryOpen).toHaveBeenCalledWith(url)
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
      createProxiedUrl(url),
      expect.anything(),
    )
    expect(mockMetric).toHaveBeenCalledTimes(1)
  },
)

it('preserves consent and closes an enclosing dialog after a failed handoff', async () => {
  jest.mocked(useInAppBrowser).mockReturnValue(undefined)
  mockWithinDialog = true
  const openLink = renderOpenLink(true)
  await openLink(url)

  expect(mockDialogClose).toHaveBeenCalledTimes(1)
  expect(mockConsentOpen).toHaveBeenCalledWith(url)
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled()
  expect(Linking.openURL).not.toHaveBeenCalled()
})

it('falls back to the external browser when the saved preference is off', async () => {
  jest.mocked(useInAppBrowser).mockReturnValue(false)
  const openLink = renderOpenLink(true)
  await openLink(url)

  expect(AppLink.tryOpen).toHaveBeenCalledWith(url)
  expect(Linking.openURL).toHaveBeenCalledWith(url)
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled()
})

it.each([true, false])(
  'honors an explicit browser override of %s',
  async override => {
    jest.mocked(useInAppBrowser).mockReturnValue(undefined)
    jest.mocked(AppLink.tryOpen).mockResolvedValue(true)
    const openLink = renderOpenLink(true)
    await openLink(url, override)

    expect(AppLink.tryOpen).not.toHaveBeenCalled()
    expect(mockConsentOpen).not.toHaveBeenCalled()
    if (override) {
      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
        url,
        expect.anything(),
      )
    } else {
      expect(Linking.openURL).toHaveBeenCalledWith(url)
    }
  },
)

it.each([
  'https://bsky.app/profile/esb.lol',
  'https://bsky.app',
  'mailto:hello@example.com',
])('does not attempt an app handoff for %s', async destination => {
  const openLink = renderOpenLink(true)
  await openLink(destination)

  expect(AppLink.tryOpen).not.toHaveBeenCalled()
})

it('does not attempt an app handoff on web', async () => {
  mockIsNative = false
  const openLink = renderOpenLink(true)
  await openLink(url)

  expect(AppLink.tryOpen).not.toHaveBeenCalled()
  expect(Linking.openURL).toHaveBeenCalledWith(url)
})

it('preserves the external-browser fallback if the in-app browser fails too', async () => {
  jest
    .mocked(WebBrowser.openBrowserAsync)
    .mockRejectedValue(new Error('Browser failed'))
  const openLink = renderOpenLink(true)
  await openLink(url)

  expect(Linking.openURL).toHaveBeenCalledWith(url)
})
