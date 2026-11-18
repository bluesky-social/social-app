import {useEffect} from 'react'

import {type ScrollNavigationArgs} from '#/components/Gallery/types'
import {getIndexForOffset} from '#/components/Gallery/utils'
import {IS_WEB_SAFARI} from '#/env'

/** How long scrolling must stop for touch momentum or a wheel to be over. */
const SCROLL_IDLE_MS = 150

/**
 * Reports the browser scrolling the gallery for the user: touch, including
 * the momentum after it, and Chrome/Firefox wheel and trackpad scrolling.
 * Calls `onNavigate` as each item becomes the leading one. Scrolls without
 * that input (mount, resizes, `scrollIntoView`, focus moving) aren't the
 * user, and the drag, arrow key and Safari wheel handlers report their own.
 */
export function useScrollNavigation({
  scrollRef,
  itemWidthsRef,
  currentIndexRef,
  itemCount,
  resetKey,
  onNavigate,
}: ScrollNavigationArgs) {
  useEffect(() => {
    if (itemCount <= 1) return

    const el = scrollRef.current?.getScrollableNode() as HTMLElement | null
    if (!el) return

    let isTouching = false
    let isUserScrolling = false
    let idleTimer: ReturnType<typeof setTimeout> | undefined

    const waitForIdle = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        if (!isTouching) isUserScrolling = false
      }, SCROLL_IDLE_MS)
    }

    /*
     * A finger only counts once it scrolls the gallery, so a tap's focus
     * scrolling the tapped item into view isn't reported.
     */
    const onTouchStart = () => {
      isTouching = true
    }
    const onTouchEnd = () => {
      isTouching = false
      waitForIdle()
    }
    const onWheel = (e: WheelEvent) => {
      // Safari's wheel handler scrolls and reports itself
      if (IS_WEB_SAFARI) return
      // Vertical wheels scroll the page, unless Shift turns them sideways
      if (!e.shiftKey && Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      isUserScrolling = true
      waitForIdle()
    }
    const onScroll = () => {
      if (isTouching) isUserScrolling = true
      if (!isUserScrolling) return
      waitForIdle()
      const index = getIndexForOffset(
        itemWidthsRef.current,
        el.scrollLeft,
        itemCount,
      )
      if (index !== currentIndexRef.current) onNavigate(index)
    }

    /** The other handlers' animations and focus changes aren't touch/wheel momentum. */
    const stopUserScrolling = () => {
      clearTimeout(idleTimer)
      isTouching = false
      isUserScrolling = false
    }

    const onKeyDown = (e: KeyboardEvent) => {
      // Modifiers don't take over navigation; Shift may be held for a wheel.
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return
      stopUserScrolling()
    }

    el.addEventListener('keydown', onKeyDown)
    el.addEventListener('mousedown', stopUserScrolling)
    el.addEventListener('touchstart', onTouchStart, {passive: true})
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    el.addEventListener('wheel', onWheel, {passive: true})
    el.addEventListener('scroll', onScroll, {passive: true})

    return () => {
      clearTimeout(idleTimer)
      el.removeEventListener('keydown', onKeyDown)
      el.removeEventListener('mousedown', stopUserScrolling)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('scroll', onScroll)
    }
  }, [
    scrollRef,
    itemWidthsRef,
    currentIndexRef,
    itemCount,
    resetKey,
    onNavigate,
  ])
}
