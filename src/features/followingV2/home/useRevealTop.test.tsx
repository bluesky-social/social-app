import {memo} from 'react'
import {act, render} from '@testing-library/react-native'

import {ANIMATED_REVEAL_LIMIT, useRevealTop} from './useRevealTop'

const RENDERED_AT = 1000
const WRITTEN_AT = 2000

/**
 * The hook in a `memo()` component, as `PostFeed` is, with the list `offset`
 * points below its top. What it returns is kept from the first render, as the
 * pill and a pending write hold on to it, so it must act on the latest props.
 */
function renderRevealTop({offset = 0}: {offset?: number} = {}) {
  let offsetY = offset
  const scrollToTop = jest.fn<void, [boolean]>()
  const onJump = jest.fn()
  let first: ReturnType<typeof useRevealTop> | undefined

  const View = memo(function View({topFetchedAt}: {topFetchedAt?: number}) {
    const revealTop = useRevealTop({
      topFetchedAt,
      offsetY: {get: () => offsetY},
      scrollToTop,
      onJump,
    })
    first ??= revealTop
    return null
  })

  const view = render(<View topFetchedAt={RENDERED_AT} />)
  return {
    revealTop: first!,
    scrollToTop,
    onJump,
    scrollTo: (next: number) => {
      offsetY = next
    },
    /** Renders `fetchedAt` as the top page. */
    renderTop: (fetchedAt: number) =>
      view.rerender(<View topFetchedAt={fetchedAt} />),
  }
}

describe('useRevealTop', () => {
  describe('reveal', () => {
    it('animates up from nearby, without a jump', () => {
      const {revealTop, scrollToTop, onJump} = renderRevealTop({
        offset: ANIMATED_REVEAL_LIMIT,
      })
      act(() => revealTop.reveal())

      expect(scrollToTop.mock.calls).toEqual([[true]])
      expect(onJump).not.toHaveBeenCalled()
    })

    it('jumps from deep in the feed, and says so', () => {
      const {revealTop, scrollToTop, onJump} = renderRevealTop({
        offset: ANIMATED_REVEAL_LIMIT + 1,
      })
      act(() => revealTop.reveal())

      expect(scrollToTop.mock.calls).toEqual([[false]])
      expect(onJump).toHaveBeenCalledTimes(1)
    })

    it('judges the distance from where the list is when asked', () => {
      const {revealTop, scrollToTop, scrollTo} = renderRevealTop()
      scrollTo(ANIMATED_REVEAL_LIMIT * 10)
      act(() => revealTop.reveal())

      expect(scrollToTop.mock.calls).toEqual([[false]])
    })
  })

  describe('onceRendered', () => {
    it('jumps once the page it was written renders, and not before', () => {
      const {revealTop, scrollToTop, onJump, renderTop} = renderRevealTop()
      act(() => revealTop.onceRendered(WRITTEN_AT))
      expect(scrollToTop).not.toHaveBeenCalled()

      renderTop(WRITTEN_AT)
      expect(scrollToTop.mock.calls).toEqual([[false]])
      expect(onJump).toHaveBeenCalledTimes(1)
    })

    it('jumps, never animates, however close the list was', () => {
      const {revealTop, scrollToTop, renderTop} = renderRevealTop({offset: 0})
      act(() => revealTop.onceRendered(WRITTEN_AT))
      renderTop(WRITTEN_AT)

      expect(scrollToTop.mock.calls).toEqual([[false]])
    })

    it('jumps at once to a page that has already rendered', () => {
      const {revealTop, scrollToTop} = renderRevealTop()
      act(() => revealTop.onceRendered(RENDERED_AT))

      expect(scrollToTop.mock.calls).toEqual([[false]])
    })

    it('waits for that page, not whichever renders next', () => {
      const {revealTop, scrollToTop, renderTop} = renderRevealTop()
      act(() => revealTop.onceRendered(WRITTEN_AT))
      renderTop(WRITTEN_AT + 1)
      expect(scrollToTop).not.toHaveBeenCalled()

      renderTop(WRITTEN_AT)
      expect(scrollToTop.mock.calls).toEqual([[false]])
    })

    it('jumps once, not again when the page renders again', () => {
      const {revealTop, scrollToTop, renderTop} = renderRevealTop()
      act(() => revealTop.onceRendered(WRITTEN_AT))
      renderTop(WRITTEN_AT)
      renderTop(RENDERED_AT)
      renderTop(WRITTEN_AT)

      expect(scrollToTop).toHaveBeenCalledTimes(1)
    })
  })
})
