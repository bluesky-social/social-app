import {memo} from 'react'
import {act, render} from '@testing-library/react-native'

import {logger} from '#/logger'
import {type FeedPageUnselected} from './queries/postFeed'
import {isAtTop, useHomePress} from './useHomePress'
import {ANIMATED_REVEAL_LIMIT, useRevealTop} from './useRevealTop'

// Only its constant: its hooks need queries this doesn't set up.
jest.mock('./useSettleAtTop', () => ({SETTLE_AT_TOP_LIMIT: 5}))

const RENDERED_AT = 1000
const PREPENDED_AT = 2000

/** How far down the feed a reader is, in points, well short of a jump. */
const SCROLLED_DOWN = 800

/** A page a prepend wrote on top. */
function page(fetchedAt: number) {
  return {fetchedAt} as FeedPageUnselected
}

/**
 * The press, wired as `PostFeed` wires it, in a `memo()` component, as
 * `PostFeed` is, with the list `offset` points below its top. The press is
 * kept from the first render, as `FeedPage` calls it through a ref, so it must
 * act on the latest props. `onHasNew` is the Home dot, and `scrollToTop` the
 * list, told whether to animate.
 *
 * The prepend is a stand-in: `run` starts one the test settles, and nothing is
 * staged or owed unless the test says so.
 */
function renderHome({
  offset = 0,
  enabled = true,
}: {offset?: number; enabled?: boolean} = {}) {
  let offsetY = offset
  const scrollToTop = jest.fn<void, [boolean]>()
  const onHasNew = jest.fn<void, [boolean]>()
  const onFetch = jest.fn()
  const refresh = jest.fn(() => Promise.resolve())
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
  let first: (() => boolean) | undefined

  const View = memo(function View({
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
    const press = useHomePress({
      enabled,
      offsetY: offsetYValue,
      prepend,
      revealTop,
      refresh,
      onHasNew,
      onFetch,
    })
    first ??= press
    return null
  })

  const view = render(<View topFetchedAt={RENDERED_AT} enabled={enabled} />)
  return {
    /** Presses Home, and says whether the feed took the press. */
    press: () => {
      let took = false
      act(() => {
        took = first!()
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
    renderTop: (fetchedAt: number) =>
      view.rerender(<View topFetchedAt={fetchedAt} enabled={enabled} />),
  }
}

/** Lets what the press does once its prepend settles run. */
async function flush() {
  await act(async () => {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve()
    }
  })
}

describe('isAtTop', () => {
  it('is the top within a few points of it, as the settle and the pill judge it', () => {
    expect(isAtTop(-100)).toBe(true)
    expect(isAtTop(0)).toBe(true)
    expect(isAtTop(5)).toBe(true)
    expect(isAtTop(6)).toBe(false)
  })
})

describe('useHomePress', () => {
  describe('below the top', () => {
    it('takes the reader up through what is loaded, and does nothing else', () => {
      const home = renderHome({offset: SCROLLED_DOWN})

      expect(home.press()).toBe(true)
      expect(home.scrollToTop.mock.calls).toEqual([[true]])
      expect(home.prepend.run).not.toHaveBeenCalled()
      expect(home.prepend.markRead).not.toHaveBeenCalled()
      expect(home.refresh).not.toHaveBeenCalled()
      expect(home.onFetch).not.toHaveBeenCalled()
      // Reaching the top clears it, as the list reports.
      expect(home.onHasNew).not.toHaveBeenCalled()
    })

    it('jumps from deep in the feed, which clears the Home dot as it arrives', () => {
      const home = renderHome({offset: ANIMATED_REVEAL_LIMIT + 1})
      home.press()

      expect(home.scrollToTop.mock.calls).toEqual([[false]])
      expect(home.onHasNew.mock.calls).toEqual([[false]])
      expect(home.prepend.run).not.toHaveBeenCalled()
    })

    it('scrolls up again on another press, as long as the reader is short of the top', () => {
      const home = renderHome({offset: SCROLLED_DOWN})
      home.press()
      home.scrollTo(SCROLLED_DOWN / 2)
      home.press()

      expect(home.scrollToTop.mock.calls).toEqual([[true], [true]])
      expect(home.prepend.run).not.toHaveBeenCalled()
    })
  })

  describe('at the top', () => {
    it('reads what is staged and asks for what is newer with a prepend, not a refresh', () => {
      const home = renderHome({offset: 0})

      expect(home.press()).toBe(true)
      expect(home.prepend.markRead).toHaveBeenCalledTimes(1)
      // One the pill doesn't offer.
      expect(home.prepend.run.mock.calls).toEqual([['focus']])
      expect(home.refresh).not.toHaveBeenCalled()
      expect(home.onFetch).toHaveBeenCalledTimes(1)
      // Right to the top meanwhile, past anything behind the header.
      expect(home.scrollToTop.mock.calls).toEqual([[true]])
      expect(home.onHasNew).not.toHaveBeenCalled()
    })

    it('jumps up to the new posts once they render, which clears the Home dot', async () => {
      const home = renderHome({offset: 0})
      home.press()
      home.scrollToTop.mockClear()
      await home.prependWrote(page(PREPENDED_AT))
      expect(home.scrollToTop).not.toHaveBeenCalled()
      expect(home.onHasNew).not.toHaveBeenCalled()

      home.renderTop(PREPENDED_AT)
      expect(home.scrollToTop.mock.calls).toEqual([[false]])
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

    it('leaves what it found staged above a reader who has left the top meanwhile', async () => {
      const home = renderHome({offset: 0})
      home.press()
      home.scrollToTop.mockClear()
      home.scrollTo(SCROLLED_DOWN)
      await home.prependWrote(page(PREPENDED_AT))
      home.renderTop(PREPENDED_AT)

      expect(home.scrollToTop).not.toHaveBeenCalled()
      expect(home.onHasNew).not.toHaveBeenCalled()
    })

    it('joins a prepend in progress, leaving what is staged to it', () => {
      const home = renderHome({offset: 0})
      home.prepend.isOwed.mockReturnValue(true)
      home.press()

      expect(home.prepend.markRead).not.toHaveBeenCalled()
      expect(home.prepend.run).toHaveBeenCalledTimes(1)
    })

    it('refreshes from the top without a boundary to fetch above, as other feeds do', () => {
      const home = renderHome({offset: 0})
      home.prepend.run.mockReturnValue(undefined)

      expect(home.press()).toBe(true)
      expect(home.refresh).toHaveBeenCalledTimes(1)
      expect(home.onHasNew.mock.calls).toEqual([[false]])
      expect(home.onFetch).toHaveBeenCalledTimes(1)
    })

    it('leaves the feed and the Home dot alone when the fetch fails, and logs only unexpected errors', async () => {
      const logError = jest.spyOn(logger, 'error').mockImplementation(() => {})
      try {
        const offline = renderHome({offset: 0})
        offline.press()
        await offline.prependFailed(new TypeError('Network request failed'))
        expect(logError).not.toHaveBeenCalled()
        expect(offline.onHasNew).not.toHaveBeenCalled()
        expect(offline.refresh).not.toHaveBeenCalled()

        const broken = renderHome({offset: 0})
        broken.press()
        await broken.prependFailed(new Error('Bad response'))
        expect(logError).toHaveBeenCalledTimes(1)
        expect(broken.onHasNew).not.toHaveBeenCalled()
      } finally {
        logError.mockRestore()
      }
    })
  })

  it('leaves the press to the page for a feed that does not stage new posts', () => {
    const home = renderHome({offset: 0, enabled: false})

    expect(home.press()).toBe(false)
    expect(home.scrollToTop).not.toHaveBeenCalled()
    expect(home.prepend.run).not.toHaveBeenCalled()
    expect(home.refresh).not.toHaveBeenCalled()
    expect(home.onFetch).not.toHaveBeenCalled()
  })
})
