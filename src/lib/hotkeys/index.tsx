import {useCallback, useEffect, useRef, useState} from 'react'
import {type View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {
  HotkeysProvider,
  useHotkeys,
  useHotkeysContext,
} from 'react-hotkeys-hook'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {
  emitFocusNextPost,
  emitFocusPrevPost,
  emitFocusSearch,
  emitOpenFocusedPost,
  listenFocusNextPost,
  listenFocusPrevPost,
  listenOpenFocusedPost,
} from '#/state/events'
import {useSession} from '#/state/session'

const FEED_SCROLL_DEBOUNCE_MS = 250

enum Hotkeys {
  OPEN_COMPOSER = 'n',
  FOCUS_SEARCH = 'slash',
  PAGE_FORWARD = 'j',
  PAGE_BACKWARD = 'k',
  OPEN_POST = 'enter',
}

function isElementVisible(el: Element) {
  const rect = el.getBoundingClientRect()
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight &&
    rect.right > 0 &&
    rect.left < window.innerWidth
  )
}

export function Provider({children}: React.PropsWithChildren<unknown>) {
  return (
    <HotkeysProvider initiallyActiveScopes={['global']}>
      <KeyboardShortcuts>{children}</KeyboardShortcuts>
    </HotkeysProvider>
  )
}

export {useHotkeysContext}

function KeyboardShortcuts({children}: React.PropsWithChildren<unknown>) {
  useKeyboardShortcuts()
  return children
}

function useKeyboardShortcuts() {
  const {openComposer} = useOpenComposer()
  const {hasSession} = useSession()
  const {t: l} = useLingui()

  const shouldIgnore = (requiresSession: boolean = false) => {
    if (requiresSession && !hasSession) {
      return true
    }
    return false
  }

  const handleKey = (
    callback: () => void,
    options?: {requiresSession?: boolean},
  ) => {
    if (shouldIgnore(options?.requiresSession)) {
      return
    }
    callback()
  }

  // Composer
  useHotkeys(
    Hotkeys.OPEN_COMPOSER,
    () =>
      handleKey(
        () => {
          openComposer({logContext: 'Other'})
        },
        {
          requiresSession: true,
        },
      ),
    {scopes: ['global'], description: l`Compose new post`},
    [openComposer],
  )

  // Search
  useHotkeys(Hotkeys.FOCUS_SEARCH, () => handleKey(emitFocusSearch), {
    scopes: ['global'],
    preventDefault: true,
    description: l`Focus the search field`,
    useKey: true, // Support international and alternate keyboard layouts
  })

  // Feed nav
  useHotkeys(Hotkeys.PAGE_FORWARD, () => handleKey(emitFocusNextPost), {
    scopes: ['feed'],
    description: l`Focus the next post`,
  })
  useHotkeys(Hotkeys.PAGE_BACKWARD, () => handleKey(emitFocusPrevPost), {
    scopes: ['feed'],
    description: l`Focus the previous post`,
  })
  useHotkeys(Hotkeys.OPEN_POST, () => handleKey(emitOpenFocusedPost), {
    scopes: ['feed'],
    description: l`Open this post`,
  })
}

/**
 * Add keyboard navigation to a list of items.
 */
export function useFeedKeyboardNav({
  focusableIndices,
  active = true,
}: {
  /**
   * Compute this based on item types (e.g. only root posts).
   */
  focusableIndices: number[]
  /**
   * Pass false when the list is in an inactive tab.
   */
  active?: boolean
}) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const itemElsRef = useRef<Map<number, Element>>(new Map())
  const scrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const itemRef = (index: number) => (el: View | null) => {
    if (el) {
      itemElsRef.current.set(index, el as unknown as Element)
    } else {
      itemElsRef.current.delete(index)
    }
  }

  const findTopVisibleIndex = useCallback(() => {
    if (!active) return -1
    for (const idx of focusableIndices) {
      const el = itemElsRef.current.get(idx)
      if (el && isElementVisible(el)) {
        return idx
      }
    }
    return -1
  }, [active, focusableIndices])

  const isFocusedItemVisible = useCallback((index: number) => {
    if (index < 0) return false
    const el = itemElsRef.current.get(index)
    if (!el) return false
    return isElementVisible(el)
  }, [])

  // Scroll focused item into view
  useEffect(() => {
    if (!active || focusedIndex < 0) return
    const el = itemElsRef.current.get(focusedIndex)
    el?.scrollIntoView({behavior: 'smooth', block: 'center'})
    scrollingRef.current = true
    clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      scrollingRef.current = false
    }, FEED_SCROLL_DEBOUNCE_MS)
    return () => clearTimeout(scrollTimeoutRef.current)
  }, [active, focusedIndex])

  // Listen for keyboard events
  useEffect(() => {
    const unlistenNext = listenFocusNextPost(() => {
      if (!active) return
      if (scrollingRef.current) return
      setFocusedIndex(prev => {
        if (prev === -1 || !isFocusedItemVisible(prev)) {
          return findTopVisibleIndex()
        }
        const currentPos = focusableIndices.indexOf(prev)
        if (currentPos < focusableIndices.length - 1) {
          return focusableIndices[currentPos + 1]
        }
        return prev
      })
    })
    const unlistenPrev = listenFocusPrevPost(() => {
      if (!active) return
      if (scrollingRef.current) return
      setFocusedIndex(prev => {
        if (prev === -1 || !isFocusedItemVisible(prev)) {
          return findTopVisibleIndex()
        }
        const currentPos = focusableIndices.indexOf(prev)
        if (currentPos > 0) {
          return focusableIndices[currentPos - 1]
        }
        return prev
      })
    })
    const unlistenOpen = listenOpenFocusedPost(() => {
      if (!active) return
      if (focusedIndex < 0) return
      const el = itemElsRef.current.get(focusedIndex) as HTMLElement
      el?.click()
    })
    return () => {
      unlistenNext()
      unlistenPrev()
      unlistenOpen()
    }
  }, [
    active,
    findTopVisibleIndex,
    focusableIndices,
    focusedIndex,
    isFocusedItemVisible,
  ])

  return {focusedIndex, setFocusedIndex, itemRef}
}
