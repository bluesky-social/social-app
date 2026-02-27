import {createContext, useContext, useRef, useState} from 'react'
import {findNodeHandle, type LayoutChangeEvent, type View} from 'react-native'

import {atoms as a} from '#/alf'
import {IS_LIQUID_GLASS} from '#/env'
import {
  ExpoScrollEdgeInteractionView,
  type ScrollEdgeInteractionEdge,
} from '../../../modules/expo-scroll-edge-interaction'

interface ScrollEdgeContextValue {
  setNodeHandle: (update: React.SetStateAction<number | null>) => void
  setScrollViewTag: (update: React.SetStateAction<number | null>) => void
  setHeaderHeight: (height: number) => void
}

const ScrollEdgeContext = createContext<ScrollEdgeContextValue | null>(null)
const ScrollEdgeHeightContext = createContext<number | null>(null)

export function ScrollEdgeInteractionProvider({
  children,
  edge = 'top',
}: {
  children: React.ReactNode
  edge?: ScrollEdgeInteractionEdge
}) {
  const [nodeHandle, setNodeHandle] = useState<number | null>(null)
  const [scrollViewTag, setScrollViewTag] = useState<number | null>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  if (!IS_LIQUID_GLASS) {
    return children
  }

  return (
    <ScrollEdgeContext.Provider
      value={{setNodeHandle, setScrollViewTag, setHeaderHeight}}>
      <ScrollEdgeHeightContext.Provider value={headerHeight}>
        <ExpoScrollEdgeInteractionView
          nodeHandle={nodeHandle}
          scrollViewTag={scrollViewTag}
          edge={edge}
          style={a.flex_1}>
          {children}
        </ExpoScrollEdgeInteractionView>
      </ScrollEdgeHeightContext.Provider>
    </ScrollEdgeContext.Provider>
  )
}

/**
 * Returns a ref callback to attach to the header view. The native module
 * will add a UIScrollEdgeElementContainerInteraction to this view.
 * Returns undefined when there's no provider (non-Liquid Glass).
 */
export function useTransparentHeaderProps() {
  const ctx = useContext(ScrollEdgeContext)
  // Track which handle this specific hook instance set, so that
  // unmounting one header doesn't clobber another's handle.
  const ourHandle = useRef<number | null>(null)

  if (!ctx) return undefined

  const {setNodeHandle, setHeaderHeight} = ctx

  const refCallback = (node: View | null) => {
    const handle = node ? findNodeHandle(node) : null
    if (handle !== null) {
      ourHandle.current = handle
      setNodeHandle(handle)
    } else {
      // Only clear if we were the last one to set it
      const prev = ourHandle.current
      ourHandle.current = null
      setNodeHandle(cur => (cur === prev ? null : cur))
    }
  }

  const onLayout = (e: LayoutChangeEvent) => {
    setHeaderHeight(e.nativeEvent.layout.height)
  }

  return {ref: refCallback, onLayout}
}

/**
 * Registers a scroll view with the scroll edge interaction provider.
 * Called automatically by List.
 * Returns a ref callback, or undefined if no provider.
 */
export function useScrollEdgeScrollView() {
  const ctx = useContext(ScrollEdgeContext)
  const ourTag = useRef<number | null>(null)

  if (!ctx) return undefined

  const {setScrollViewTag} = ctx

  return (node: any) => {
    const tag = node ? findNodeHandle(node) : null
    if (tag !== null) {
      ourTag.current = tag
      setScrollViewTag(tag)
    } else {
      const prev = ourTag.current
      ourTag.current = null
      setScrollViewTag(cur => (cur === prev ? null : cur))
    }
  }
}

/**
 * Returns the measured header height, or null if not inside a
 * transparent header provider.
 */
export function useTransparentHeaderHeight(): number | null {
  return useContext(ScrollEdgeHeightContext)
}
