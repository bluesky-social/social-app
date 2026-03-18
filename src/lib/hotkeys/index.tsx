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
import {IS_WEB} from '#/env'

const FEED_SCROLL_DEBOUNCE_MS = 250

enum Hotkeys {
  OPEN_COMPOSER = 'n',
  FOCUS_SEARCH = 'slash',
  PAGE_FORWARD = 'j',
  PAGE_BACKWARD = 'k',
  OPEN_POST = 'enter',
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
    for (const idx of focusableIndices) {
      const el = itemElsRef.current.get(idx)
      if (el) {
        const rect = el.getBoundingClientRect()
        if (rect.bottom > 0) {
          return idx
        }
      }
    }
    return focusableIndices[0] ?? -1
  }, [focusableIndices])

  const isFocusedItemVisible = (index: number) => {
    if (index < 0) return false
    const el = itemElsRef.current.get(index)
    if (!el) return false
    const rect = el.getBoundingClientRect()
    return rect.bottom > 0 && rect.top < window.innerHeight
  }

  // Scroll focused item into view
  useEffect(() => {
    if (!IS_WEB || focusedIndex < 0) return
    const el = itemElsRef.current.get(focusedIndex)
    el?.scrollIntoView({behavior: 'smooth', block: 'center'})
    scrollingRef.current = true
    clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      scrollingRef.current = false
    }, FEED_SCROLL_DEBOUNCE_MS)
    return () => clearTimeout(scrollTimeoutRef.current)
  }, [focusedIndex])

  // Listen for keyboard events
  useEffect(() => {
    if (!IS_WEB || !active) return
    const unlistenNext = listenFocusNextPost(() => {
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
      if (focusedIndex < 0) return
      const el = itemElsRef.current.get(focusedIndex) as HTMLElement
      el?.click()
    })
    return () => {
      unlistenNext()
      unlistenPrev()
      unlistenOpen()
    }
  }, [active, findTopVisibleIndex, focusableIndices, focusedIndex])

  return {focusedIndex, setFocusedIndex, itemRef}
}
