import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook} from '@testing-library/react-native'

import {logger} from '#/logger'
import {useAppviewClient} from '#/state/session'
import {com, tools} from '#/lexicons'
import {useSubmitReportMutation} from './action'
import {initialState, type ReportState} from './state'
import {type ParsedReportSubject} from './types'

jest.mock('#/logger', () => ({logger: {info: jest.fn()}}))
jest.mock('#/state/session', () => ({useAppviewClient: jest.fn()}))

const subject: ParsedReportSubject = {
  type: 'record',
  uri: 'at://did:plc:author/site.standard.document/article',
  cid: 'article-cid',
  nsid: 'site.standard.document',
}
const state: ReportState = {
  ...initialState,
  selectedOption: {
    title: 'Other',
    reason: tools.ozone.report.defs.reasonOther.value,
  },
  selectedLabeler: {
    uri: 'at://did:plc:labeler/app.bsky.labeler.service/self',
    cid: 'labeler-cid',
    creator: {did: 'did:plc:labeler', handle: 'labeler.test'},
    policies: {labelValues: []},
    indexedAt: '2026-01-01T00:00:00Z',
  },
  details: 'Article report prototype',
}

function setup() {
  const call = jest.fn().mockResolvedValue({})
  jest.mocked(useAppviewClient).mockReturnValue({call} as never)
  const queryClient = new QueryClient({
    defaultOptions: {mutations: {retry: false, gcTime: Infinity}},
  })
  const i18n = setupI18n({locale: 'en', messages: {en: {}}})
  function Wrapper({children}: {children: React.ReactNode}) {
    return (
      <I18nProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </I18nProvider>
    )
  }
  const hook = renderHook(useSubmitReportMutation, {wrapper: Wrapper})
  return {call, hook}
}

beforeEach(() => jest.clearAllMocks())

describe('useSubmitReportMutation', () => {
  it('submits generic records in dev with their exact URI and CID', async () => {
    expect(__DEV__).toBe(true)
    const {call, hook} = setup()

    await act(() =>
      hook.result.current.mutateAsync({
        subject,
        state: {...state, includeVideoTimestamp: true},
        videoTimestampSeconds: 42,
      }),
    )

    expect(call).toHaveBeenCalledTimes(1)
    expect(call).toHaveBeenCalledWith(
      com.atproto.moderation.createReport,
      {
        reasonType: tools.ozone.report.defs.reasonOther.value,
        reason: state.details,
        subject: {
          $type: 'com.atproto.repo.strongRef',
          uri: subject.uri,
          cid: subject.cid,
        },
      },
      {service: 'did:plc:labeler#atproto_labeler'},
    )
    expect(logger.info).not.toHaveBeenCalled()
  })

  it('keeps existing report subjects dry-run-only in dev', async () => {
    const {call, hook} = setup()

    await act(() =>
      hook.result.current.mutateAsync({
        subject: {...subject, type: 'feed'},
        state,
      }),
    )

    expect(call).not.toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith(
      'Submitting report (dry run)',
      expect.anything(),
    )
  })

  it('propagates server rejections of generic records', async () => {
    const {call, hook} = setup()
    const error = new Error('Record report rejected')
    call.mockRejectedValue(error)

    await act(async () => {
      await expect(
        hook.result.current.mutateAsync({subject, state}),
      ).rejects.toThrow(error)
    })
  })
})
