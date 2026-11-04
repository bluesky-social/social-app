import {type ReactNode} from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {com, tools} from '#/lexicons'
import {useSubmitReportMutation} from './action'
import {initialState, type ReportState} from './state'
import {type ParsedReportSubject} from './types'

const mockCall = jest.fn()

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/logger', () => ({logger: {info: jest.fn()}}))
jest.mock('#/state/session', () => ({
  useAppviewClient: () => ({call: mockCall}),
}))

const labelerDid = 'did:plc:labeler'
const state = {
  ...initialState,
  selectedOption: {
    title: 'Spam',
    reason: tools.ozone.report.defs.reasonMisleadingSpam.value,
  },
  selectedLabeler: {
    creator: {did: labelerDid, handle: 'labeler.test'},
    reasonTypes: [],
  },
  details: 'some details',
  includeVideoTimestamp: true,
} as unknown as ReportState

const ref = {
  uri: 'at://did:plc:6ayddqghxhciedbaofoxkcbs/app.test.thing/3kabc',
  cid: 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti',
  nsid: 'app.test.thing',
}

const subjects: [string, ParsedReportSubject][] = [
  ['article', {type: 'article', ...ref}],
  ['photo', {type: 'photo', ...ref}],
  ['publication', {type: 'publication', ...ref}],
  ['gallery', {type: 'gallery', ...ref}],
  ['livestream', {type: 'livestream', ...ref}],
  ['record', {type: 'record', ...ref}],
  ['an existing record type', {type: 'feed', ...ref}],
]

describe('useSubmitReportMutation', () => {
  const dev = __DEV__

  beforeEach(() => {
    mockCall.mockReset().mockResolvedValue(undefined)
    // The development dry run would otherwise skip the (mocked) request.
    ;(globalThis as unknown as {__DEV__: boolean}).__DEV__ = false
  })
  afterEach(() => {
    ;(globalThis as unknown as {__DEV__: boolean}).__DEV__ = dev
  })

  it.each(subjects)(
    'submits %s as a strongRef to the labeler',
    async (_n, subject) => {
      const queryClient = new QueryClient()
      const {result} = renderHook(() => useSubmitReportMutation(), {
        wrapper: ({children}: {children: ReactNode}) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.mutateAsync({
          subject,
          state,
          videoTimestampSeconds: 12,
        })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockCall).toHaveBeenCalledTimes(1)
      expect(mockCall).toHaveBeenCalledWith(
        com.atproto.moderation.createReport,
        {
          reasonType: tools.ozone.report.defs.reasonMisleadingSpam.value,
          reason: 'some details',
          subject: {
            $type: 'com.atproto.repo.strongRef',
            uri: ref.uri,
            cid: ref.cid,
          },
        },
        expect.objectContaining({service: `${labelerDid}#atproto_labeler`}),
      )
    },
  )
})
