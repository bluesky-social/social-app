import {type AtUriString} from '@atproto/syntax'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {act, renderHook} from '@testing-library/react-native'

import {useAtmosphereLike} from '#/components/atmosphere/likes'

const mockCreate = jest.fn()

jest.mock('#/state/session', () => ({
  useSession: () => ({currentAccount: {did: 'did:plc:viewer'}}),
  usePdsClient: () => ({create: mockCreate, delete: jest.fn()}),
  useRequireAuth: () => (fn: () => Promise<void>) => fn(),
}))
jest.mock('#/lib/haptics', () => ({useHaptics: () => ({tap: () => {}})}))
jest.mock('#/screens/Atmosphere/feedback', () => ({
  useAtmosphereFeedback: () => undefined,
}))
jest.mock('#/screens/Atmosphere/metrics/context', () => ({
  useLogContentAction: () => () => {},
}))
jest.mock('#/components/atmosphere/AtmosphereFirstActionWelcomeDialog', () => ({
  useAtmosphereFirstActionWelcome: () => ({onCreate: () => {}, control: {}}),
}))
jest.mock('#/components/Toast', () => ({show: () => {}}))
jest.mock('#/logger', () => ({logger: {error: () => {}}}))

i18n.loadAndActivate({locale: 'en', messages: {}})
const wrapper = ({children}: {children: React.ReactNode}) => (
  <I18nProvider i18n={i18n}>{children}</I18nProvider>
)

const document: AtUriString = 'at://did:plc:author/site.standard.document/abc'
const view = (likeCount: number) => ({
  likeCount,
  viewer: {},
  associatedRefs: [{uri: document, cid: 'cid'}],
})

/**
 * The same article from two queries can carry different counts. Liking it
 * from one card must show as liked, with its own count plus one, on the other
 * instead of letting a second tap create a duplicate record.
 */
test('shares an optimistic like across views with different counts', async () => {
  mockCreate.mockResolvedValue({uri: 'at://did:plc:viewer/recommend/1'})
  const a = renderHook(() => useAtmosphereLike(view(5), 'recommend', 'card'), {
    wrapper,
  })
  const b = renderHook(() => useAtmosphereLike(view(9), 'recommend', 'card'), {
    wrapper,
  })

  await act(() => {
    a.result.current.toggle()
    return Promise.resolve()
  })

  expect(a.result.current).toMatchObject({isLiked: true, likeCount: 6})
  expect(b.result.current).toMatchObject({isLiked: true, likeCount: 10})
})
