import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useRef,
} from 'react'
import {type StyleProp, type View, type ViewStyle} from 'react-native'

import {mergeRefs} from '#/lib/merge-refs'
import {atoms as a} from '#/alf'

const Context = createContext<{
  bleedRef: React.RefObject<React.ComponentRef<typeof View> | null>
}>({
  bleedRef: {current: null},
})
Context.displayName = 'GalleryBleedContext'

/**
 * Wraps a single element (typically a padded post container). Galleries inside
 * it measure their position relative to it, and extend to its edges while
 * keeping their first and last items aligned with the padded content.
 *
 * Only provides a ref: the Gallery measures it itself, so the common case of
 * no Gallery inside costs no layout events or re-renders.
 */
export function Bleed({children}: {children: React.ReactNode}) {
  const ref = useRef<React.ComponentRef<typeof View>>(null)

  if (!isValidElement(children)) {
    throw new Error('Gallery.Bleed children must be a single React element')
  }

  const node = children as React.ReactElement<{
    ref?: React.Ref<React.ComponentRef<typeof View>>
    style?: StyleProp<ViewStyle>
  }>

  return (
    <Context.Provider value={{bleedRef: ref}}>
      {cloneElement(node, {
        ref: mergeRefs([ref, node?.props?.ref]),
        style: [node.props.style, a.overflow_hidden],
      })}
    </Context.Provider>
  )
}

export function useGalleryBleed() {
  return useContext(Context)
}
