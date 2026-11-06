import {act, render} from '@testing-library/react-native'

import {logger} from '#/logger'
import {type FeedPageUnselected} from './queries/postFeed'
import {useHomePress} from './useHomePress'
import {useRevealTop} from './useRevealTop'

const RENDERED_AT = 1000
const PREPENDED_AT = 2000

/** How far down the feed a reader is, in points, well short of a jump. */
const SCROLLED_DOWN = 800

/** A page a prepend wrote on top. */
function page(fetchedAt: number) {
  return {fetchedAt} as FeedPageUnselected
}

/**
 * The press, wired as `PostFeed` wires it, with the list `offset` points below
 * its top. `onHasNew` is the Home dot, and `scrollToTop` the list. The prepend
 * is a stand-in whose `run` starts one the test settles; the real one is
 * tested with the press in `queries/postFeed.test.tsx`.
 */
function renderHome({offset = 0}: {offset?: number} = {}) {
  let offsetY = offset
  const scrollToTop = jest.fn<void, [boolean]>()
  const onHasNew = jest.fn<void, [boolean]>()
  const onFetch = jest.fn()
  const refresh = jest.fn(() =>
    Promise.resolve<FeedPageUnselected | undefined>(page(PREPENDED_AT)),
  )
  const prepending: {
    resolve: (page: FeedPageUnselected | undefined) => void
    reject: (error: Error) => void
  }[] = []
  const prepend = {
    run: jest.fn(
      (_trigger: string) =>
        new Promise<FeedPageUnselected | undefined>((resolve, reject) => {
          prepending.push({resolve, reject})
        }) as Promise<FeedPageUnselected | undefined> | undefined,
    ),
    isOwed: jest.fn(() => false),
    markRead: jest.fn(),
  }
  let press!: () => boolean

  function View({
    topFetchedAt,
    enabled,
  }: {
    topFetchedAt: number
    enabled: boolean
  }) {
    const offsetYValue = {get: () => offsetY}
    const revealTop = useRevealTop({
      topFetchedAt,
      offsetY: offsetYValue,
      scrollToTop,
      onJump: () => onHasNew(false),
    })
    press = useHomePress({
      enabled,
      offsetY: offsetYValue,
      prepend,
      revealTop,
      refresh,
      onHasNew,
      onFetch,
    })
    return null
  }

  let props = {topFetchedAt: RENDERED_AT, enabled: true}
  const view = render(<View {...props} />)
  const rerender = (next: Partial<typeof props>) => {
    props = {...props, ...next}
    view.rerender(<View {...props} />)
  }
  return {
    /** Presses Home, and says whether the feed took the press. */
    press: () => {
      let took = false
      act(() => {
        took = press()
      })
      return took
    },
    prepend,
    refresh,
    onHasNew,
    onFetch,
    scrollToTop,
    scrollTo: (next: number) => {
      offsetY = next
    },
    /** Settles the press's prepend with the page it wrote, if any. */
    async prependWrote(written: FeedPageUnselected | undefined) {
      prepending[0].resolve(written)
      await flush()
    },
    async prependFailed(error: Error) {
      prepending[0].reject(error)
      await flush()
    },
    /** Renders `fetchedAt` as the top page. */
    renderTop: (fetchedAt: number) => rerender({topFetchedAt: fetchedAt}),
    setEnabled: (enabled: boolean) => rerender({enabled}),
  }
}

/** Flushes the microtasks a settled prepend schedules. */
async function flush() {
  await act(async () => {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve()
    }
  })
}

describe('useHomePress', () => {
  it('below the top, takes the reader up through what is loaded, and does nothing else', () => {
    const home = renderHome({offset: SCROLLED_DOWN})

    expect(home.press()).toBe(true)
    expect(home.scrollToTop.mock.calls).toEqual([[true]])
    expect(home.prepend.run).not.toHaveBeenCalled()
    expect(home.prepend.markRead).not.toHaveBeenCalled()
    expect(home.refresh).not.toHaveBeenCalled()
    expect(home.onFetch).not.toHaveBeenCalled()
  })

  describe('at the top', () => {
    it('scrolls right up at once, then jumps to the new posts once they render, which clears the Home dot', async () => {
      const home = renderHome({offset: 0})
      expect(home.press()).toBe(true)
      await home.prependWrote(page(PREPENDED_AT))
      home.renderTop(PREPENDED_AT)

      expect(home.scrollToTop.mock.calls).toEqual([[true], [false]])
      expect(home.onHasNew.mock.calls).toEqual([[false]])
    })

    it('stays at the top with nothing newer, and clears the Home dot', async () => {
      const home = renderHome({offset: 0})
      home.press()
      home.scrollToTop.mockClear()
      await home.prependWrote(undefined)

      expect(home.scrollToTop).not.toHaveBeenCalled()
      expect(home.onHasNew.mock.calls).toEqual([[false]])
    })

    it("doesn't jump a reader who left the top before the prepend wrote", async () => {
      const home = renderHome({offset: 0})
      home.press()
      home.scrollToTop.mockClear()
      home.scrollTo(SCROLLED_DOWN)
      await home.prependWrote(page(PREPENDED_AT))
      home.renderTop(PREPENDED_AT)

      expect(home.scrollToTop).not.toHaveBeenCalled()
      expect(home.onHasNew).not.toHaveBeenCalled()
    })

    it("doesn't jump a reader who left the top before the new posts rendered", async () => {
      const home = renderHome({offset: 0})
      home.press()
      home.scrollToTop.mockClear()
      await home.prependWrote(page(PREPENDED_AT))
      home.scrollTo(SCROLLED_DOWN)
      home.renderTop(PREPENDED_AT)

      expect(home.scrollToTop).not.toHaveBeenCalled()
      expect(home.onHasNew).not.toHaveBeenCalled()
    })

    it.each([
      ['clears the Home dot once that writes', page(PREPENDED_AT), [[false]]],
      ['leaves the Home dot alone if that writes nothing', undefined, []],
    ])(
      'refreshes from the top without a boundary to fetch above, and %s',
      async (_, wrote, dot) => {
        const home = renderHome({offset: 0})
        home.prepend.run.mockReturnValue(undefined)
        home.refresh.mockResolvedValue(wrote)

        expect(home.press()).toBe(true)
        expect(home.refresh).toHaveBeenCalledTimes(1)
        expect(home.onFetch).toHaveBeenCalledTimes(1)
        await flush()
        expect(home.onHasNew.mock.calls).toEqual(dot)
      },
    )

    it('logs a fetch that fails unexpectedly, and leaves the Home dot alone', async () => {
      const logError = jest.spyOn(logger, 'error').mockImplementation(() => {})
      const home = renderHome({offset: 0})
      home.press()
      await home.prependFailed(new Error('Bad response'))

      expect(logError).toHaveBeenCalledTimes(1)
      expect(home.onHasNew).not.toHaveBeenCalled()
      logError.mockRestore()
    })
  })

  it('leaves the press to the page once the feed stops staging new posts', () => {
    const home = renderHome({offset: 0})
    home.setEnabled(false)

    expect(home.press()).toBe(false)
    expect(home.scrollToTop).not.toHaveBeenCalled()
    expect(home.prepend.run).not.toHaveBeenCalled()
  })
})
