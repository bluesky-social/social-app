import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useRef,
  useState,
} from 'react'
import {
  type LayoutChangeEvent,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native'

import {mergeRefs} from '#/lib/merge-refs'
import {atoms as a} from '#/alf'

const Context = createContext<{
  bleedRef: React.RefObject<React.ComponentRef<typeof View> | null>
  bleedWidth: number
}>({
  bleedRef: {current: null},
  bleedWidth: 0,
})
Context.displayName = 'GalleryBleedContext'

/**
 * Wraps a single element (typically a padded post container). Galleries inside
 * it measure their position relative to it, and extend to its edges while
 * keeping their first and last items aligned with the padded content.
 */
export function Bleed({children}: {children: React.ReactNode}) {
  const ref = useRef<React.ComponentRef<typeof View>>(null)
  const [bleedWidth, setBleedWidth] = useState(0)

  if (!isValidElement(children)) {
    throw new Error('Gallery.Bleed children must be a single React element')
  }

  const node = children as React.ReactElement<{
    ref?: React.Ref<React.ComponentRef<typeof View>>
    onLayout?: (e: LayoutChangeEvent) => void
    style?: StyleProp<ViewStyle>
  }>

  return (
    <Context.Provider value={{bleedRef: ref, bleedWidth}}>
      {cloneElement(node, {
        ref: mergeRefs([ref, node?.props?.ref]),
        onLayout: (e: LayoutChangeEvent) => {
          setBleedWidth(e.nativeEvent.layout.width)
          node.props.onLayout?.(e)
        },
        style: [node.props.style, a.overflow_hidden],
      })}
    </Context.Provider>
  )
}

export function useGalleryBleed() {
  return useContext(Context)
}
