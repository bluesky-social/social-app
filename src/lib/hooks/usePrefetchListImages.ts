import {ViewToken} from 'react-native'
import React from 'react'
import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
} from '@atproto/api'
import {Image} from 'expo-image'
import {FeedPostSliceItem} from 'state/queries/post-feed'
import {PostView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'

interface UsePrefetchListImages {
  onViewableItemsChanged: ({
    viewableItems,
  }: {
    viewableItems: ViewToken[]
  }) => void
  setItems: (items: any[]) => void
  resetPrefetch: () => void
}

export const usePrefetchListImages = (): UsePrefetchListImages => {
  const feedItems = React.useRef<any[]>([])

  const highestPrefetchedIndex = React.useRef(0)
  const previousLength = React.useRef(0)

  const setItems = React.useRef((items: any[]) => {
    feedItems.current = items
  }).current

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
      // Get the last index of the viewable items
      const lastIndex = viewableItems?.[viewableItems.length - 1]?.index

      // If there is no last index, do nothing. Really this is just for ts.
      if (lastIndex == null) return

      const hasNewItems = feedItems.current.length > previousLength.current

      /*
       * We should prefetch if:
       * 1. The last index is a multiple of 5
       * 2. The highest fetched index is 0 (initial load, we want to prefetch the first 10 that are not visible here)
       * 3. The previous length is different. Means that more posts are loaded, and we should load the first 10 of that
       *    since they might be just about to come into view (hopefully they have loaded before we reach the end though!)
       */
      if (
        lastIndex % 5 !== 0 && // If the last index is not a multiple of 5, return
        !hasNewItems // If there are no new items, return (prefetch if the length changed)
      ) {
        return
      }

      // Update the previous length
      previousLength.current = feedItems.current.length

      // Determine where we want to slice from and get the posts

      // If this is the first load, we can prefetch the first 10 items. Otherwise, we want to prefetch the next 5
      const sliceFrom =
        highestPrefetchedIndex.current === 0 || hasNewItems
          ? lastIndex
          : lastIndex + 5

      // We always slice to 10 items ahead of the last index. We need to check though that sliceTo is not greater
      // than the length of the items
      const sliceTo = lastIndex + 10

      // No need to do anything if we have already prefetched these items
      if (sliceTo <= highestPrefetchedIndex.current) return

      // Get the next items
      const nextItems = feedItems.current.slice(sliceFrom, sliceTo + 1)

      const imagesToPrefetch: string[] = []

      const addEmbeds = (embed: any) => {
        if (AppBskyEmbedImages.isView(embed)) {
          // If the embed has images, add those
          imagesToPrefetch.push(...embed.images.map(i => i.thumb))
        } else if (AppBskyEmbedExternal.isView(embed)) {
          // Or add external thumbnails
          if (embed.external.thumb) {
            imagesToPrefetch.push(embed.external.thumb)
          }
        }

        // If the embed has a record, add the record's embeds
        if (
          AppBskyEmbedRecord.isView(embed) ||
          AppBskyEmbedRecordWithMedia.isView(embed)
        ) {
          // Add the images and externals
          addEmbeds(embed.media)

          if (AppBskyEmbedRecord.isViewRecord(embed.record)) {
            if (embed.record.author.avatar) {
              imagesToPrefetch.push(embed.record.author.avatar)
            }

            const subEmbed = embed.record.embeds?.[0]

            if (subEmbed != null) addEmbeds(subEmbed)
          }
        }
      }

      const addImages = (post: PostView) => {
        const {embed, author} = post

        // Always add the author avatar
        if (author.avatar) {
          imagesToPrefetch.push(author.avatar)
        }

        addEmbeds(embed)
      }

      for (const item of nextItems) {
        // If there's an items array, we know this is on the post screen
        if (item.items != null) {
          const items = item.items as FeedPostSliceItem[]
          // Get each sub item
          for (const subItem of items) {
            addImages(subItem.post)
          }
        } else if (item.type === 'post') {
          addImages(item.post as PostView)
        }
      }

      // Update the highest prefetched index
      highestPrefetchedIndex.current = sliceTo

      // Run the prefetch
      Image.prefetch(imagesToPrefetch)
    },
  ).current

  const resetPrefetch = React.useCallback(() => {
    highestPrefetchedIndex.current = 0
  }, [])

  return {
    onViewableItemsChanged,
    setItems,
    resetPrefetch,
  }
}
