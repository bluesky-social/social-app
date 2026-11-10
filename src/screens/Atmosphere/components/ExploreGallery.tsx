import {View} from 'react-native'

import {atoms as a} from '#/alf'
import * as GalleryPrimitive from '#/components/Gallery'

/**
 * The generic gallery's own `Bleed`, re-exported so Explore shares exactly one
 * bleed context with the galleries rendered inside it.
 */
export const ExploreGalleryBleed = GalleryPrimitive.Bleed
export const GalleryPageDots = GalleryPrimitive.GalleryPageDots

export type ExploreGalleryFocusProps = GalleryPrimitive.ItemFocusProps

type ExploreGalleryProps<T> = {
  items: T[]
  label: string
  testID: string
  footer?: React.ReactNode
  snapToItems?: boolean
  renderItem: (item: T, focusProps: ExploreGalleryFocusProps) => React.ReactNode
}

/**
 * Horizontal card carousel for the Atmosphere Explore sections. Cards own
 * their own width and stretch to the tallest card in the strip. Items are
 * keyed by `uri` unless `getKey` is given, which items without a `uri` need.
 */
export function ExploreGallery<T extends {uri: string; title: string}>(
  props: ExploreGalleryProps<T> & {getKey?: (item: T) => string},
): React.ReactNode
export function ExploreGallery<T extends {title: string}>(
  props: ExploreGalleryProps<T> & {getKey: (item: T) => string},
): React.ReactNode
export function ExploreGallery({
  items,
  label,
  testID,
  footer,
  snapToItems,
  renderItem,
  getKey = item => item.uri,
}: ExploreGalleryProps<{uri: string; title: string}> & {
  getKey?: (item: {uri: string; title: string}) => string
}) {
  return (
    <GalleryPrimitive.Root
      label={label}
      testID={testID}
      footer={footer}
      snapToItems={snapToItems}
      stretch>
      {items.map(item => (
        <GalleryPrimitive.Item key={getKey(item)} label={item.title}>
          {focusProps => (
            /*
             * The bottom allowance lives inside the item so it is measured and
             * scrolled with the card, which keeps card shadows from being
             * clipped.
             */
            <View style={[a.flex_grow]}>{renderItem(item, focusProps)}</View>
          )}
        </GalleryPrimitive.Item>
      ))}
    </GalleryPrimitive.Root>
  )
}
