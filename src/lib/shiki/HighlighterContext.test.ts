import {useSyncExternalStore} from 'react'
import {type HighlighterCore} from '@shikijs/core'
import {act, renderHook} from '@testing-library/react-native'

import {createHighlighterStore} from '#/lib/shiki/HighlighterContext'

function createTestHighlighter() {
  return {
    dispose: jest.fn(),
    getLoadedLanguages: () => ['javascript'],
    codeToTokensBase: jest.fn(() => [[{content: 'source'}]]),
  } as unknown as HighlighterCore
}

describe('highlighter lifecycle', () => {
  it('keeps readiness when a provider subscription remounts', async () => {
    const highlighter = createTestHighlighter()
    const store = createHighlighterStore(() => Promise.resolve(highlighter))
    function useReadiness() {
      return useSyncExternalStore(
        store.subscribe,
        store.getIsReady,
        store.getIsReady,
      )
    }
    const first = renderHook(useReadiness)
    await act(() => store.initialize())
    expect(first.result.current).toBe(true)
    first.unmount()
    const remounted = renderHook(useReadiness)
    expect(remounted.result.current).toBe(true)
    act(() => store.dispose())
    expect(remounted.result.current).toBe(false)
  })

  it('shares initialization and exposes cached readiness to new subscribers', async () => {
    const highlighter = createTestHighlighter()
    const create = jest.fn(() => Promise.resolve(highlighter))
    const store = createHighlighterStore(create)
    const firstSubscriber = jest.fn()
    const unsubscribe = store.subscribe(firstSubscriber)

    expect(store.getIsReady()).toBe(false)
    await Promise.all([store.initialize(), store.initialize()])
    expect(create).toHaveBeenCalledTimes(1)
    expect(firstSubscriber).toHaveBeenCalledTimes(1)
    unsubscribe()

    const newSubscriber = jest.fn()
    store.subscribe(newSubscriber)
    expect(store.getIsReady()).toBe(true)
    await store.initialize()
    expect(create).toHaveBeenCalledTimes(1)
    store.dispose()
    expect(store.getIsReady()).toBe(false)
    expect(newSubscriber).toHaveBeenCalledTimes(1)
    expect(firstSubscriber).toHaveBeenCalledTimes(1)
    expect(highlighter.dispose).toHaveBeenCalledTimes(1)
  })

  it('clears failed initialization so a later attempt can succeed', async () => {
    const error = new Error('Engine unavailable')
    const highlighter = createTestHighlighter()
    const create = jest
      .fn<Promise<HighlighterCore>, []>()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(highlighter)
    const store = createHighlighterStore(create)

    await expect(store.initialize()).rejects.toBe(error)
    expect(store.getIsReady()).toBe(false)
    await store.initialize()
    expect(store.getIsReady()).toBe(true)
    expect(create).toHaveBeenCalledTimes(2)
    store.dispose()
  })

  it('disposes a pending result without replacing a newer highlighter', async () => {
    const stale = createTestHighlighter()
    const current = createTestHighlighter()
    let resolveFirst!: (highlighter: HighlighterCore) => void
    const create = jest
      .fn<Promise<HighlighterCore>, []>()
      .mockImplementationOnce(
        () => new Promise(resolve => (resolveFirst = resolve)),
      )
      .mockResolvedValueOnce(current)
    const store = createHighlighterStore(create)

    const firstAttempt = store.initialize()
    store.dispose()
    await store.initialize()
    resolveFirst(stale)
    await firstAttempt
    expect(stale.dispose).toHaveBeenCalledTimes(1)
    expect(store.getIsReady()).toBe(true)
    store.tokenize('source', {lang: 'javascript', theme: 'bluesky-dim'})
    expect(current.codeToTokensBase).toHaveBeenCalledTimes(1)
    expect(stale.codeToTokensBase).not.toHaveBeenCalled()
    store.dispose()
  })

  it('propagates tokenizer errors after initialization', async () => {
    const error = new Error('Invalid theme')
    const highlighter = createTestHighlighter()
    jest.mocked(highlighter.codeToTokensBase).mockImplementationOnce(() => {
      throw error
    })
    const store = createHighlighterStore(() => Promise.resolve(highlighter))
    await store.initialize()

    expect(() =>
      store.tokenize('source', {lang: 'javascript', theme: 'invalid'}),
    ).toThrow(error)
    store.dispose()
  })
})
