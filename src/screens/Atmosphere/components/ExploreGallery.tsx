import {View} from 'react-native'

import {atoms as a} from '#/alf'
import * as GalleryPrimitive from '#/components/Gallery'

/**
 * The generic gallery's own `Bleed`, re-exported so Explore shares exactly one
 * bleed context with the galleries rendered inside it.
 */
export const ExploreGalleryBleed = GalleryPrimitive.Bleed

export type ExploreGalleryFocusProps = GalleryPrimitive.ItemFocusProps

/**
 * Horizontal card carousel for the Atmosphere Explore sections. Cards own
 * their own width, and the strip is as tall as the tallest card.
 */
export function ExploreGallery<T extends {id: string; title: string}>({
  items,
  label,
  testID,
  renderItem,
}: {
  items: T[]
  label: string
  testID: string
  renderItem: (item: T, focusProps: ExploreGalleryFocusProps) => React.ReactNode
}) {
  return (
    <GalleryPrimitive.Root label={label} testID={testID}>
      {items.map(item => (
        <GalleryPrimitive.Item key={item.id} label={item.title}>
          {focusProps => (
            /*
             * The bottom allowance lives inside the item so it is measured and
             * scrolled with the card, which keeps card shadows from being
             * clipped.
             */
            <View style={[a.pb_md]}>{renderItem(item, focusProps)}</View>
          )}
        </GalleryPrimitive.Item>
      ))}
    </GalleryPrimitive.Root>
  )
}
