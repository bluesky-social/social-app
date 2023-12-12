import {ViewToken} from 'react-native'
import React, {useRef} from 'react'
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
  onRefresh: () => void
}

export const usePrefetchListImages = (): UsePrefetchListImages => {
  const feedItems = useRef<any[]>([])

  const highestPrefetchedIndex = useRef(0)
  const previousLength = useRef(0)

  const setItems = useRef((items: any[]) => {
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
      // Get the first and last index of the viewable items
      const firstIndex = viewableItems?.[0]?.index
      const lastIndex = viewableItems?.[viewableItems.length - 1]?.index

      // If there is no last index, do nothing. Really this is just for ts.
      if (lastIndex == null) return

      const hasNewItems = feedItems.current.length > previousLength.current

      /*
       * We should prefetch if:
       * 1. The last index is a multiple of 5
       * 2. The first index is zero (initial load, we want to prefetch the first 10 that are not visible here)
       * 3. The previous length is different. Means that more posts are loaded, and we should load the first 10 of that
       *    since they might be just about to come into view (hopefully they have loaded before we reach the end though!)
       */
      if (
        lastIndex % 5 !== 0 && // If the last index is not a multiple of 5, return
        firstIndex !== 0 && // If the first index is not 0, return (initial load, we want to prefetch)
        !hasNewItems // If there are no new items, return (prefetch if the length changed)
      ) {
        return
      }

      // Update the previous length
      previousLength.current = feedItems.current.length

      // Determine where we want to slice from and get the posts

      // If the first index is 0 or there are new items, we want to start with the next item. Otherwise, we want to
      // skip ahead 5 items
      const sliceFrom =
        firstIndex === 0 || hasNewItems ? lastIndex : lastIndex + 5

      // We always slice to 10 items ahead of the last index. We need to check though that sliceTo is not greater
      // than the length of the items
      let sliceTo = lastIndex + 10
      if (sliceTo - 1 > feedItems.current.length) {
        sliceTo = feedItems.current.length - 1
      }

      // No need to do anything if we have already prefetched these items
      if (sliceTo <= highestPrefetchedIndex.current) return

      // Get the next items
      const nextItems = feedItems.current.slice(sliceFrom, sliceFrom + 5)

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
        if (item.items) {
          const items = item.items as FeedPostSliceItem[]
          // Get each sub item
          for (const subItem of items) {
            addImages(subItem.post)
          }
        } else if (item.type === 'post') {
          const post = item.post as PostView

          addImages(post)

          if (AppBskyEmbedImages.isView(post.embed)) {
            imagesToPrefetch.push(...post.embed.images.map(i => i.thumb))
          } else if (
            AppBskyEmbedExternal.isView(post.embed) &&
            post.embed.external.thumb != null
          ) {
            imagesToPrefetch.push(post.embed.external.thumb)
          }
        }
      }

      // Update the highest prefetched index
      highestPrefetchedIndex.current = sliceTo
      Image.prefetch(imagesToPrefetch)
    },
  ).current

  const onRefresh = React.useCallback(() => {
    highestPrefetchedIndex.current = 0
  }, [])

  return {
    onViewableItemsChanged,
    setItems,
    onRefresh,
  }
}
