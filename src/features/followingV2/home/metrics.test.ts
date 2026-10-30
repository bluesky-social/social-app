import {createElement, type PropsWithChildren} from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {renderHook} from '@testing-library/react-native'

import type * as Metrics from './metrics'
import {restoreEvent, useFollowingV2Metrics} from './metrics'
import {
  loadFollowingSnapshot,
  takeFollowingSnapshotLoad,
} from './queries/followingSnapshot'

describe('restoreEvent', () => {
  // Saved in this process, as when switching back to an account.
  const restoredAt = Date.now()
  const load = {
    snapshot: 'valid',
    ageMs: 1,
    bytes: 2,
    pageCount: 3,
    topFetchedAt: restoredAt,
  } as const

  it.each([
    ['restored', 'the restored top page', restoredAt],
    ['fetched', 'another top page', restoredAt + 1],
    ['failed', 'no top page', undefined],
  ] as const)('is %s for %s', (outcome, _, topFetchedAt) => {
    expect(restoreEvent(load, topFetchedAt)).toEqual({
      outcome,
      snapshot: 'valid',
      ageMs: 1,
      bytes: 2,
      pageCount: 3,
    })
  })
})

describe('useFollowingV2Metrics', () => {
  type Props = Parameters<typeof useFollowingV2Metrics>[0]

  function setup(
    initial: Partial<Props> = {},
    queryClient = new QueryClient(),
  ) {
    const metric = jest.fn()
    let props: Props = {
      enabled: true,
      metric,
      topFetchedAt: undefined,
      isError: false,
      ...initial,
    }
    const wrapper = ({children}: PropsWithChildren) =>
      createElement(QueryClientProvider, {client: queryClient}, children)
    const hook = renderHook((p: Props) => useFollowingV2Metrics(p), {
      initialProps: props,
      wrapper,
    })
    const update = (next: Partial<Props>) => {
      props = {...props, ...next}
      hook.rerender(props)
    }
    return {hook, metric, update, queryClient}
  }

  /** A read into `queryClient` of a persisted client with no Following query. */
  function readClient(queryClient: QueryClient) {
    loadFollowingSnapshot(
      {
        timestamp: Date.now(),
        buster: '',
        clientState: {mutations: [], queries: []},
      },
      {queryClient},
    )
  }

  it('reports the read once the feed has a top page or fails, and only once', () => {
    const queryClient = new QueryClient()
    readClient(queryClient)
    const {metric, update} = setup({}, queryClient)
    expect(metric).not.toHaveBeenCalled()

    update({topFetchedAt: 1})
    update({topFetchedAt: 2})
    expect(metric.mock.calls).toEqual([
      ['followingV2:restore', {outcome: 'fetched', snapshot: 'missing'}],
    ])

    const failing = new QueryClient()
    readClient(failing)
    expect(setup({isError: true}, failing).metric.mock.calls).toEqual([
      ['followingV2:restore', {outcome: 'failed', snapshot: 'missing'}],
    ])
  })

  it('reports only the read into its own client, and to one view', () => {
    const queryClient = new QueryClient()
    readClient(queryClient)
    // Another account's client, which had no read.
    const other = setup({topFetchedAt: 1})
    const first = setup({topFetchedAt: 1}, queryClient)
    const second = setup({topFetchedAt: 1}, queryClient)

    expect(other.metric).not.toHaveBeenCalled()
    expect(first.metric).toHaveBeenCalledTimes(1)
    expect(second.metric).not.toHaveBeenCalled()
  })

  it('reports nothing while disabled, but passes on a gap fill and leaves the read', () => {
    const queryClient = new QueryClient()
    readClient(queryClient)
    const {hook, metric} = setup({enabled: false, topFetchedAt: 1}, queryClient)
    const {onPrepend, onCheck, onRefresh, onGapFill, onSettled} =
      hook.result.current

    onPrepend({
      trigger: 'restore',
      outcome: 'staged',
      postCount: 1,
      isReplacing: false,
      isFull: false,
    })
    onCheck('focus', 0)('staged')
    onRefresh({outcome: 'refreshed'})
    onSettled({outcome: 'settled', droppedPageCount: 1})
    expect(onGapFill('filled')).toBe('filled')

    expect(metric).not.toHaveBeenCalled()
    expect(takeFollowingSnapshotLoad(queryClient)).toEqual({
      snapshot: 'missing',
    })
  })
})

describe('sampling', () => {
  /**
   * The metrics of a process that isn't an internal build, whose draw of
   * whether it reports recurring events is `random`.
   */
  function loadExternalMetrics(random: number) {
    let metrics!: typeof Metrics
    jest.isolateModules(() => {
      jest.doMock('#/env', () => ({
        ...jest.requireActual('#/env'),
        IS_INTERNAL: false,
      }))
      jest.spyOn(Math, 'random').mockReturnValueOnce(random)
      metrics = require('./metrics')
    })
    const metric = jest.fn()
    const reporters = metrics.followingV2Reporters({enabled: true, metric})
    return {reporters, metric}
  }

  /** Reports a check by `trigger` that staged something. */
  function check(
    reporters: ReturnType<typeof loadExternalMetrics>['reporters'],
    trigger: 'focus' | 'return' | 'hop' | 'interval',
  ) {
    reporters.onCheck(trigger, Date.now())('staged')
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('drops interval and hop events from a process outside the sample, but not the rest', () => {
    const {reporters, metric} = loadExternalMetrics(0.5)

    check(reporters, 'interval')
    check(reporters, 'hop')
    check(reporters, 'focus')
    check(reporters, 'return')

    expect(metric.mock.calls).toMatchObject([
      ['followingV2:check', {trigger: 'focus', sampleRate: 1}],
      ['followingV2:check', {trigger: 'return', sampleRate: 1}],
    ])
  })

  it('reports them from a process in the sample, with the rate to weigh them by', () => {
    const {reporters, metric} = loadExternalMetrics(0.05)

    check(reporters, 'interval')
    reporters.onPrepend({
      trigger: 'hop',
      outcome: 'staged',
      postCount: 1,
      isReplacing: false,
      isFull: false,
    })

    expect(metric.mock.calls).toMatchObject([
      ['followingV2:check', {trigger: 'interval', sampleRate: 0.1}],
      ['followingV2:prepend', {trigger: 'hop', sampleRate: 0.1}],
    ])
  })
})
