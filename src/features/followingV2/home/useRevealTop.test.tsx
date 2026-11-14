import {act, render} from '@testing-library/react-native'

import {ANIMATED_REVEAL_LIMIT, useRevealTop} from './useRevealTop'

const RENDERED_AT = 1000
const WRITTEN_AT = 2000

/** The hook, with the list at its top until the test scrolls it. */
function renderRevealTop() {
  let offsetY = 0
  const scrollToTop = jest.fn<void, [boolean]>()
  const onJump = jest.fn()
  let revealTop!: ReturnType<typeof useRevealTop>

  function View({topFetchedAt}: {topFetchedAt: number}) {
    revealTop = useRevealTop({
      topFetchedAt,
      offsetY: {get: () => offsetY},
      scrollToTop,
      onJump,
    })
    return null
  }

  const view = render(<View topFetchedAt={RENDERED_AT} />)
  return {
    scrollToTop,
    onJump,
    scrollTo: (next: number) => {
      offsetY = next
    },
    reveal: () => act(() => revealTop.reveal()),
    onceRendered: (fetchedAt: number, shouldJump?: () => boolean) =>
      act(() => revealTop.onceRendered(fetchedAt, shouldJump)),
    /** Renders `fetchedAt` as the top page. */
    renderTop: (fetchedAt: number) =>
      view.rerender(<View topFetchedAt={fetchedAt} />),
  }
}

describe('useRevealTop', () => {
  it.each([
    ['animates up from as far as the limit', ANIMATED_REVEAL_LIMIT, true],
    ['jumps from further down, and says so', ANIMATED_REVEAL_LIMIT + 1, false],
  ])(
    'reveal %s, judged from where the list is when asked',
    (_, offset, animated) => {
      const hook = renderRevealTop()
      hook.scrollTo(offset)
      hook.reveal()

      expect(hook.scrollToTop.mock.calls).toEqual([[animated]])
      expect(hook.onJump).toHaveBeenCalledTimes(animated ? 0 : 1)
    },
  )

  describe('onceRendered', () => {
    it('jumps once that page renders, and not before', () => {
      const hook = renderRevealTop()
      hook.onceRendered(WRITTEN_AT)
      expect(hook.scrollToTop).not.toHaveBeenCalled()

      hook.renderTop(WRITTEN_AT)
      expect(hook.scrollToTop.mock.calls).toEqual([[false]])
      expect(hook.onJump).toHaveBeenCalledTimes(1)
    })

    it('jumps at once to a page that has already rendered', () => {
      const hook = renderRevealTop()
      hook.onceRendered(RENDERED_AT)

      expect(hook.scrollToTop.mock.calls).toEqual([[false]])
    })

    it('waits for that page, not whichever renders next', () => {
      const hook = renderRevealTop()
      hook.onceRendered(WRITTEN_AT)
      hook.renderTop(WRITTEN_AT + 1)
      expect(hook.scrollToTop).not.toHaveBeenCalled()

      hook.renderTop(WRITTEN_AT)
      expect(hook.scrollToTop.mock.calls).toEqual([[false]])
    })

    it('jumps once, not again when the page renders again', () => {
      const hook = renderRevealTop()
      hook.onceRendered(WRITTEN_AT)
      hook.renderTop(WRITTEN_AT)
      hook.renderTop(RENDERED_AT)
      hook.renderTop(WRITTEN_AT)

      expect(hook.scrollToTop).toHaveBeenCalledTimes(1)
    })

    it('skips a jump that shouldJump calls off, at once or once the page renders', () => {
      const hook = renderRevealTop()
      hook.onceRendered(RENDERED_AT, () => false)
      hook.onceRendered(WRITTEN_AT, () => false)
      hook.renderTop(WRITTEN_AT)

      expect(hook.scrollToTop).not.toHaveBeenCalled()
      expect(hook.onJump).not.toHaveBeenCalled()
    })
  })
})
