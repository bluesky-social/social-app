import {ViewToken} from 'react-native'
import React, {useRef} from 'react'
import {AppBskyEmbedExternal, AppBskyEmbedImages} from '@atproto/api'
import {Image} from 'expo-image'
import {FeedPostSliceItem} from 'state/queries/post-feed'

interface UsePrefetchFeedImages {
  onViewableItemsChanged: ({
    viewableItems,
  }: {
    viewableItems: ViewToken[]
  }) => void
  feedItems: React.MutableRefObject<any[]>
  onRefresh: () => void
}

export const usePrefetchFeedImages = (): UsePrefetchFeedImages => {
  const feedItems = useRef<any[]>([])

  const highestPrefetchedIndex = useRef(0)
  const previousLength = useRef(0)

  /**
   * As we scroll down, we want to prefetch images that are about to appear in the feed.
   * 1. As new items come into view, we get the last viewable item's index
   * 2. We then prefetch the next 4 items in the data. This includes:
   *  - Avatars
   *  - Images
   *  - Embed thumbnails
   */
  const onViewableItemsChanged = React.useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      // Get the first and last index of the viewable items
      const firstIndex = viewableItems?.[0]?.index
      const lastIndex = viewableItems?.[viewableItems.length - 1]?.index

      if (lastIndex == null) return

      if (
        lastIndex % 5 !== 0 && // If the last index is not a multiple of 5, return
        firstIndex !== 0 && // If the first index is not 0, return (initial load, we want to prefetch)
        previousLength.current === feedItems.current.length // If there are no new items, return (prefetch if the length changed)
      ) {
        return
      }

      // Update the previous length
      previousLength.current = feedItems.current.length

      // Determine where we want to slice from and get the posts
      const sliceFrom = firstIndex === 0 ? lastIndex - 1 : lastIndex - 1 + 5
      const sliceTo = firstIndex === 0 ? lastIndex + 10 : lastIndex + 5

      // Do nothing if we have already prefetched these
      if (sliceTo <= highestPrefetchedIndex.current) return

      const nextItems = feedItems.current.slice(sliceFrom, sliceFrom + 5)

      const imagesToPrefetch: string[] = []

      for (const item of nextItems) {
        // If there's an items array, we know this is on the post screen
        if (item.items) {
          const items = item.items as FeedPostSliceItem[]
          for (const subItem of items) {
            // Add the avatar
            if (subItem.post.author.avatar)
              imagesToPrefetch.push(subItem.post.author.avatar)

            // Add external embed thumbnail
            if (
              AppBskyEmbedExternal.isView(subItem.post.embed) &&
              subItem.post.embed.external.thumb
            ) {
              imagesToPrefetch.push(subItem.post.embed.external.thumb)
            } else if (AppBskyEmbedImages.isView(subItem.post.embed)) {
              // Add images
              imagesToPrefetch.push(
                ...subItem.post.embed.images.map(i => i.thumb),
              )
            }
          }
        } else {
        }
      }

      // Update the highest prefetched index
      highestPrefetchedIndex.current = sliceTo
      Image.prefetch(imagesToPrefetch)
    },
  ).current

  const onRefresh = React.useCallback(() => {
    console.log('refresh')
    highestPrefetchedIndex.current = 0
  }, [])

  return {
    onViewableItemsChanged,
    feedItems,
    onRefresh,
  }
}
