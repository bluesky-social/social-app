import {renderHook} from '@testing-library/react-native'

import {
  checkOutcome,
  isStagedFull,
  RECURRING_SAMPLE_RATE,
  restoreEvent,
  sampleRateOf,
  settleEvent,
  useFollowingV2Metrics,
} from './metrics'
import {
  loadFollowingSnapshot,
  takeFollowingSnapshotLoad,
} from './queries/followingSnapshot'
import {
  type FeedPageUnselected,
  type PostFeedData,
  PROCESS_STARTED_AT,
} from './queries/postFeed'

jest.mock('#/state/preferences/languages', () => ({
  getAppLanguageAsContentLanguage: () => '',
  getContentLanguages: () => [],
}))
// Only for the feed hooks in `postFeed`, which these tests don't run.
jest.mock('#/state/session', () => ({}))
jest.mock('#/state/preferences/feed-tuners', () => ({}))
jest.mock('#/state/preferences/moderation-opts', () => ({}))
jest.mock('#/state/queries/preferences', () => ({}))
jest.mock('#/view/com/posts/PostFeedErrorMessage', () => ({}))

describe('checkOutcome', () => {
  const idle = {
    found: false,
    prepend: undefined,
    wasOwed: false,
    wasStagedFull: false,
  }

  it.each([
    ['staged', {prepend: 'staged'}],
    ['notStaged', {prepend: 'keptFull'}],
    ['notStaged', {prepend: 'refreshWon'}],
    ['notStaged', {prepend: 'superseded'}],
    ['nothing', {prepend: 'empty'}],
    ['nothing', {}],
    ['found', {found: true}],
    ['skipped', {wasStagedFull: true}],
    ['joined', {wasOwed: true, prepend: 'staged'}],
  ] as const)('is %s for %j', (outcome, check) => {
    expect(checkOutcome({...idle, ...check})).toBe(outcome)
  })
})

describe('restoreEvent', () => {
  const load = {snapshot: 'valid', ageMs: 1, bytes: 2, pageCount: 3} as const

  it('is restored when the top page was fetched before this process', () => {
    expect(restoreEvent(load, PROCESS_STARTED_AT - 1)).toEqual({
      outcome: 'restored',
      ...load,
    })
  })

  it('is fetched when the top page was fetched since', () => {
    expect(restoreEvent(load, PROCESS_STARTED_AT)).toMatchObject({
      outcome: 'fetched',
    })
  })

  it('is failed without a top page', () => {
    expect(
      restoreEvent(
        {snapshot: 'rejected', rejectionReason: 'tooLarge'},
        undefined,
      ),
    ).toEqual({
      outcome: 'failed',
      snapshot: 'rejected',
      rejectionReason: 'tooLarge',
    })
  })
})

describe('settleEvent', () => {
  function page(
    name: string,
    extra: Partial<FeedPageUnselected> = {},
  ): FeedPageUnselected {
    return {cursor: `${name}:end`, feed: [], fetchedAt: 0, ...extra}
  }

  /** A gapped page on top of two more, the first of which it was put above. */
  function gapped(): PostFeedData {
    return {
      pages: [
        page('new', {since: 'old:start', cursor: 'new:gap'}),
        page('old', {startCursor: 'old:start'}),
        page('older'),
      ],
      pageParams: [undefined, {cursor: 'new:gap'}, {cursor: 'old:end'}],
    }
  }

  it('counts the pages a settle dropped below the gap', () => {
    expect(settleEvent(gapped(), true)).toEqual({
      outcome: 'settled',
      droppedPageCount: 2,
    })
  })

  it('is superseded when it wrote nothing at a gap', () => {
    expect(settleEvent(gapped(), false)).toEqual({
      outcome: 'superseded',
      droppedPageCount: 0,
    })
  })

  it('is nothing without an open gap', () => {
    const data = gapped()
    data.pages[0].cursor = data.pages[0].since
    expect(settleEvent(data, false)).toBeUndefined()
    expect(settleEvent(undefined, false)).toBeUndefined()
  })
})

describe('isStagedFull', () => {
  it('is whether the staged page is full and still on top', () => {
    const staged = {fetchedAt: 1, offered: false, isFull: true}
    expect(isStagedFull(staged, [{fetchedAt: 1}])).toBe(true)
    expect(isStagedFull(staged, [{fetchedAt: 2}, {fetchedAt: 1}])).toBe(false)
    expect(isStagedFull({...staged, isFull: false}, [{fetchedAt: 1}])).toBe(
      false,
    )
    expect(isStagedFull(undefined, [{fetchedAt: 1}])).toBe(false)
  })
})

describe('sampleRateOf', () => {
  it('reports restores, focuses and returns every time, and samples the rest', () => {
    expect(sampleRateOf('restore')).toBe(1)
    expect(sampleRateOf('focus')).toBe(1)
    expect(sampleRateOf('return')).toBe(1)
    expect(sampleRateOf('interval')).toBe(RECURRING_SAMPLE_RATE)
    expect(sampleRateOf('hop')).toBe(RECURRING_SAMPLE_RATE)
  })
})

describe('useFollowingV2Metrics', () => {
  type Props = Parameters<typeof useFollowingV2Metrics>[0]

  function setup(initial: Partial<Props> = {}) {
    const metric = jest.fn()
    let props: Props = {
      enabled: true,
      metric,
      topFetchedAt: undefined,
      isError: false,
      ...initial,
    }
    const hook = renderHook((p: Props) => useFollowingV2Metrics(p), {
      initialProps: props,
    })
    const update = (next: Partial<Props>) => {
      props = {...props, ...next}
      hook.rerender(props)
    }
    return {hook, metric, update}
  }

  /** A read of a persisted client with no Following query in it. */
  function readClient() {
    loadFollowingSnapshot({
      timestamp: Date.now(),
      buster: '',
      clientState: {mutations: [], queries: []},
    })
  }

  beforeEach(() => {
    takeFollowingSnapshotLoad()
  })

  it('reports the read once the feed has a top page, and only once', () => {
    readClient()
    const {metric, update} = setup()
    expect(metric).not.toHaveBeenCalled()

    update({topFetchedAt: PROCESS_STARTED_AT + 1})
    update({topFetchedAt: PROCESS_STARTED_AT + 2})

    expect(metric.mock.calls).toEqual([
      ['followingV2:restore', {outcome: 'fetched', snapshot: 'missing'}],
    ])
  })

  it('reports a failed load', () => {
    readClient()
    const {metric} = setup({isError: true})

    expect(metric).toHaveBeenCalledWith('followingV2:restore', {
      outcome: 'failed',
      snapshot: 'missing',
    })
  })

  it('reports nothing without a read, or once another view has taken it', () => {
    const {metric} = setup({topFetchedAt: 1})
    readClient()
    const second = setup({topFetchedAt: 1})
    const third = setup({topFetchedAt: 1})

    expect(metric).not.toHaveBeenCalled()
    expect(second.metric).toHaveBeenCalledTimes(1)
    expect(third.metric).not.toHaveBeenCalled()
  })

  it('reports nothing while disabled, and leaves the read for a view that reports', () => {
    readClient()
    const {hook, metric} = setup({enabled: false, topFetchedAt: 1})
    const {onPrepend, onRefresh, onGapFill, onSettled, checkReporter} =
      hook.result.current

    onPrepend({
      trigger: 'restore',
      outcome: 'staged',
      postCount: 1,
      isReplacing: false,
      isFull: false,
    })
    onRefresh({outcome: 'failed', isNetworkError: true})
    expect(onGapFill('filled')).toBe('filled')
    onSettled(undefined, false)

    expect(metric).not.toHaveBeenCalled()
    expect(takeFollowingSnapshotLoad()).toEqual({snapshot: 'missing'})
    return expect(
      checkReporter({isOwed: () => false, isStagedFull: () => false})(() =>
        Promise.resolve('found'),
      )('focus', {freshAt: 0}),
    ).resolves.toBe('found')
  })

  it('passes on how a gap fill ended', () => {
    const {hook, metric} = setup()

    expect(hook.result.current.onGapFill('failed')).toBe('failed')
    expect(metric).toHaveBeenCalledWith('followingV2:gapFill', {
      outcome: 'failed',
    })
  })

  it('reports a check that joins the restore', async () => {
    const {hook, metric} = setup()
    const check = hook.result.current.checkReporter({
      isOwed: () => true,
      isStagedFull: () => false,
    })(() => Promise.resolve(undefined))

    jest.spyOn(Date, 'now').mockReturnValue(PROCESS_STARTED_AT + 5000)
    try {
      await check('focus', {freshAt: PROCESS_STARTED_AT})
    } finally {
      jest.restoreAllMocks()
    }

    expect(metric).toHaveBeenCalledWith('followingV2:check', {
      surface: 'homeFollowing',
      trigger: 'focus',
      outcome: 'joined',
      lastSuccessAgeMs: 5000,
      sampleRate: 1,
    })
  })

  it('reports a check that fails, and rejects as it did', async () => {
    const {hook, metric} = setup()
    const check = hook.result.current.checkReporter({
      isOwed: () => false,
      isStagedFull: () => false,
    })(() => Promise.reject(new Error('Unexpected')))

    await expect(check('return', {freshAt: Date.now()})).rejects.toThrow(
      'Unexpected',
    )

    expect(metric).toHaveBeenCalledWith(
      'followingV2:check',
      expect.objectContaining({
        trigger: 'return',
        outcome: 'failed',
        isNetworkError: false,
      }),
    )
  })
})
