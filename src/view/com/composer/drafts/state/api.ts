/**
 * Type converters for Draft API - convert between ComposerState and server Draft types.
 */
import {type AppBskyDraftDefs, RichText} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

import {getImageDim} from '#/lib/media/manip'
import {mimeToExt} from '#/lib/media/video/util'
import {type ComposerImage} from '#/state/gallery'
import {type Gif} from '#/state/queries/tenor'
import {
  type ComposerState,
  type EmbedDraft,
  type PostDraft,
} from '#/view/com/composer/state/composer'
import {type VideoState} from '#/view/com/composer/state/video'
import {logger} from './logger'
import {type DraftPostDisplay, type DraftSummary} from './schema'

const TENOR_HOSTNAME = 'media.tenor.com'

/**
 * Video data from a draft that needs to be restored by re-processing.
 * Contains the local file URI, alt text, mime type, and captions to restore.
 */
export type RestoredVideo = {
  uri: string
  altText: string
  mimeType: string
  localRefPath: string
  captions: Array<{lang: string; content: string}>
}

/**
 * Parse mime type from video localRefPath.
 * Format: `video:${mimeType}:${nanoid()}` (new) or `video:${nanoid()}` (legacy)
 */
function parseVideoMimeType(localRefPath: string): string {
  const parts = localRefPath.split(':')
  // New format: video:video/mp4:abc123 -> parts[1] is mime type
  // Legacy format: video:abc123 -> no mime type, default to video/mp4
  if (parts.length >= 3 && parts[1].includes('/')) {
    return parts[1]
  }
  return 'video/mp4' // Default for legacy drafts
}

/**
 * Convert ComposerState to server Draft format for saving.
 * Returns both the draft and a map of localRef paths to their source paths.
 */
export async function composerStateToDraft(state: ComposerState): Promise<{
  draft: AppBskyDraftDefs.Draft
  localRefPaths: Map<string, string>
}> {
  const localRefPaths = new Map<string, string>()

  const posts: AppBskyDraftDefs.DraftPost[] = await Promise.all(
    state.thread.posts.map(post => {
      return postDraftToServerPost(post, localRefPaths)
    }),
  )

  // Convert threadgate settings to server format
  const threadgateAllow: AppBskyDraftDefs.Draft['threadgateAllow'] = []
  for (const setting of state.thread.threadgate) {
    if (setting.type === 'mention') {
      threadgateAllow.push({
        $type: 'app.bsky.feed.threadgate#mentionRule' as const,
      })
    } else if (setting.type === 'following') {
      threadgateAllow.push({
        $type: 'app.bsky.feed.threadgate#followingRule' as const,
      })
    } else if (setting.type === 'followers') {
      threadgateAllow.push({
        $type: 'app.bsky.feed.threadgate#followerRule' as const,
      })
    } else if (setting.type === 'list') {
      threadgateAllow.push({
        $type: 'app.bsky.feed.threadgate#listRule' as const,
        list: setting.list,
      })
    }
  }

  const draft: AppBskyDraftDefs.Draft = {
    $type: 'app.bsky.draft.defs#draft',
    posts,
    threadgateAllow: threadgateAllow.length > 0 ? threadgateAllow : undefined,
    postgateEmbeddingRules:
      state.thread.postgate.embeddingRules &&
      state.thread.postgate.embeddingRules.length > 0
        ? state.thread.postgate.embeddingRules
        : undefined,
  }

  return {draft, localRefPaths}
}

/**
 * Convert a single PostDraft to server DraftPost format.
 */
async function postDraftToServerPost(
  post: PostDraft,
  localRefPaths: Map<string, string>,
): Promise<AppBskyDraftDefs.DraftPost> {
  const draftPost: AppBskyDraftDefs.DraftPost = {
    $type: 'app.bsky.draft.defs#draftPost',
    text: post.richtext.text,
  }

  // Add labels if present
  if (post.labels.length > 0) {
    draftPost.labels = {
      $type: 'com.atproto.label.defs#selfLabels',
      values: post.labels.map(label => ({val: label})),
    }
  }

  // Add embeds
  if (post.embed.media) {
    if (post.embed.media.type === 'images') {
      draftPost.embedImages = serializeImages(
        post.embed.media.images,
        localRefPaths,
      )
    } else if (post.embed.media.type === 'video') {
      const video = await serializeVideo(post.embed.media.video, localRefPaths)
      if (video) {
        draftPost.embedVideos = [video]
      }
    } else if (post.embed.media.type === 'gif') {
      const external = serializeGif(post.embed.media)
      if (external) {
        draftPost.embedExternals = [external]
      }
    }
  }

  // Add quote record embed
  if (post.embed.quote) {
    draftPost.embedRecords = [
      {
        $type: 'app.bsky.draft.defs#draftEmbedRecord',
        record: {
          uri: post.embed.quote.uri,
          cid: '', // We don't have the CID at draft time
        },
      },
    ]
  }

  // Add external link embed (only if no media, otherwise it's ignored)
  if (post.embed.link && !post.embed.media) {
    draftPost.embedExternals = [
      {
        $type: 'app.bsky.draft.defs#draftEmbedExternal',
        uri: post.embed.link.uri,
      },
    ]
  }

  return draftPost
}

/**
 * Serialize images to server format with localRef paths.
 * Reuses existing localRefPath if present (when editing a draft),
 * otherwise generates a new one.
 */
function serializeImages(
  images: ComposerImage[],
  localRefPaths: Map<string, string>,
): AppBskyDraftDefs.DraftEmbedImage[] {
  return images.map(image => {
    const sourcePath = image.transformed?.path || image.source.path
    // Reuse existing localRefPath if present (editing draft), otherwise generate new
    const isReusing = !!image.localRefPath
    const localRefPath = image.localRefPath || `image:${nanoid()}`
    localRefPaths.set(localRefPath, sourcePath)

    logger.debug('serializing image', {
      localRefPath,
      isReusing,
      sourcePath,
    })

    return {
      $type: 'app.bsky.draft.defs#draftEmbedImage',
      localRef: {
        $type: 'app.bsky.draft.defs#draftEmbedLocalRef',
        path: localRefPath,
      },
      alt: image.alt || undefined,
    }
  })
}

/**
 * Serialize video to server format with localRef path.
 * The localRef path encodes the mime type: `video:${mimeType}:${nanoid()}`
 */
async function serializeVideo(
  videoState: VideoState,
  localRefPaths: Map<string, string>,
): Promise<AppBskyDraftDefs.DraftEmbedVideo | undefined> {
  // Only save videos that have been compressed (have a video file)
  if (!videoState.video) {
    return undefined
  }

  // Encode mime type in the path for restoration
  const mimeType = videoState.video.mimeType || 'video/mp4'
  const ext = mimeToExt(mimeType)
  const localRefPath = `video:${mimeType}:${nanoid()}.${ext}`
  localRefPaths.set(localRefPath, videoState.video.uri)

  // Read caption file contents as text
  const captions: AppBskyDraftDefs.DraftEmbedCaption[] = []
  for (const caption of videoState.captions) {
    if (caption.lang) {
      const content = await caption.file.text()
      captions.push({
        $type: 'app.bsky.draft.defs#draftEmbedCaption',
        lang: caption.lang,
        content,
      })
    }
  }

  return {
    $type: 'app.bsky.draft.defs#draftEmbedVideo',
    localRef: {
      $type: 'app.bsky.draft.defs#draftEmbedLocalRef',
      path: localRefPath,
    },
    alt: videoState.altText || undefined,
    captions: captions.length > 0 ? captions : undefined,
  }
}

/**
 * Serialize GIF to server format as external embed.
 * URL format: https://media.tenor.com/{id}/{filename}.gif?hh=HEIGHT&ww=WIDTH&alt=ALT_TEXT
 */
function serializeGif(gifMedia: {
  type: 'gif'
  gif: Gif
  alt: string
}): AppBskyDraftDefs.DraftEmbedExternal | undefined {
  const gif = gifMedia.gif
  const gifFormat = gif.media_formats.gif || gif.media_formats.tinygif

  if (!gifFormat?.url) {
    return undefined
  }

  // Build URL with dimensions and alt text in query params
  const url = new URL(gifFormat.url)
  if (gifFormat.dims) {
    url.searchParams.set('ww', String(gifFormat.dims[0]))
    url.searchParams.set('hh', String(gifFormat.dims[1]))
  }
  // Store alt text if present
  if (gifMedia.alt) {
    url.searchParams.set('alt', gifMedia.alt)
  }

  return {
    $type: 'app.bsky.draft.defs#draftEmbedExternal',
    uri: url.toString(),
  }
}

/**
 * Convert server DraftView to DraftSummary for list display.
 * Also checks which media files exist locally.
 */
export function draftViewToSummary(
  view: AppBskyDraftDefs.DraftView,
  localMediaExists: (path: string) => boolean,
): DraftSummary {
  const firstPost = view.draft.posts[0]
  const previewText = firstPost?.text?.slice(0, 100) || ''

  let mediaCount = 0
  let hasMedia = false
  let hasMissingMedia = false

  const posts: DraftPostDisplay[] = view.draft.posts.map((post, index) => {
    const images: DraftPostDisplay['images'] = []
    const videos: DraftPostDisplay['video'][] = []
    let gif: DraftPostDisplay['gif']

    // Process images
    if (post.embedImages) {
      for (const img of post.embedImages) {
        mediaCount++
        hasMedia = true
        const exists = localMediaExists(img.localRef.path)
        if (!exists) {
          hasMissingMedia = true
        }
        images.push({
          localPath: img.localRef.path,
          altText: img.alt || '',
          exists,
        })
      }
    }

    // Process videos
    if (post.embedVideos) {
      for (const vid of post.embedVideos) {
        mediaCount++
        hasMedia = true
        const exists = localMediaExists(vid.localRef.path)
        if (!exists) {
          hasMissingMedia = true
        }
        videos.push({
          localPath: vid.localRef.path,
          altText: vid.alt || '',
          exists,
        })
      }
    }

    // Process externals (check for GIFs)
    if (post.embedExternals) {
      for (const ext of post.embedExternals) {
        const gifData = parseGifFromUrl(ext.uri)
        if (gifData) {
          mediaCount++
          hasMedia = true
          gif = gifData
        }
      }
    }

    return {
      id: `post-${index}`,
      text: post.text || '',
      images: images.length > 0 ? images : undefined,
      video: videos[0], // Only one video per post
      gif,
    }
  })

  return {
    id: view.id,
    draft: view.draft,
    previewText,
    hasMedia,
    hasMissingMedia,
    mediaCount,
    postCount: view.draft.posts.length,
    updatedAt: view.updatedAt,
    posts,
  }
}

/**
 * Parse GIF data from a Tenor URL.
 * URL format: https://media.tenor.com/{id}/{filename}.gif?hh=HEIGHT&ww=WIDTH&alt=ALT_TEXT
 */
function parseGifFromUrl(
  uri: string,
): {url: string; width: number; height: number; alt: string} | undefined {
  try {
    const url = new URL(uri)
    if (url.hostname !== TENOR_HOSTNAME) {
      return undefined
    }

    const height = parseInt(url.searchParams.get('hh') || '', 10)
    const width = parseInt(url.searchParams.get('ww') || '', 10)
    const alt = url.searchParams.get('alt') || ''

    if (!height || !width) {
      return undefined
    }

    // Strip our custom params to get clean base URL
    // This prevents double query strings when resolveGif() adds params again
    url.searchParams.delete('ww')
    url.searchParams.delete('hh')
    url.searchParams.delete('alt')

    return {url: url.toString(), width, height, alt}
  } catch {
    return undefined
  }
}

/**
 * Convert server Draft back to composer-compatible format for restoration.
 * Returns posts and a map of videos that need to be restored by re-processing.
 *
 * Videos cannot be restored synchronously like images because they need to go through
 * the compression and upload pipeline. The caller should handle the restoredVideos
 * by initiating video processing for each entry.
 */
export async function draftToComposerPosts(
  draft: AppBskyDraftDefs.Draft,
  loadedMedia: Map<string, string>,
): Promise<{posts: PostDraft[]; restoredVideos: Map<number, RestoredVideo>}> {
  const restoredVideos = new Map<number, RestoredVideo>()

  const posts = await Promise.all(
    draft.posts.map(async (post, index) => {
      const richtext = new RichText({text: post.text || ''})
      richtext.detectFacetsWithoutResolution()

      const embed: EmbedDraft = {
        quote: undefined,
        link: undefined,
        media: undefined,
      }

      // Restore images
      if (post.embedImages && post.embedImages.length > 0) {
        const imagePromises = post.embedImages.map(async img => {
          const path = loadedMedia.get(img.localRef.path)
          if (!path) {
            return null
          }

          let width = 0
          let height = 0
          try {
            const dims = await getImageDim(path)
            width = dims.width
            height = dims.height
          } catch (e) {
            logger.warn('Failed to get image dimensions', {
              path,
              error: e,
            })
          }

          logger.debug('restoring image with localRefPath', {
            localRefPath: img.localRef.path,
            loadedPath: path,
            width,
            height,
          })

          return {
            alt: img.alt || '',
            // Preserve the original localRefPath for reuse when saving
            localRefPath: img.localRef.path,
            source: {
              id: nanoid(),
              path,
              width,
              height,
              mime: 'image/jpeg',
            },
          } as ComposerImage
        })

        const images = (await Promise.all(imagePromises)).filter(
          (img): img is ComposerImage => img !== null,
        )
        if (images.length > 0) {
          embed.media = {type: 'images', images}
        }
      }

      // Restore GIF from external embed
      if (post.embedExternals) {
        for (const ext of post.embedExternals) {
          const gifData = parseGifFromUrl(ext.uri)
          if (gifData) {
            // Reconstruct a Gif object with all required properties
            const mediaObject = {
              url: gifData.url,
              dims: [gifData.width, gifData.height] as [number, number],
              duration: 0,
              size: 0,
            }
            embed.media = {
              type: 'gif',
              gif: {
                id: '',
                created: 0,
                hasaudio: false,
                hascaption: false,
                flags: '',
                tags: [],
                title: '',
                content_description: gifData.alt || '',
                itemurl: '',
                url: gifData.url, // Required for useResolveGifQuery
                media_formats: {
                  gif: mediaObject,
                  tinygif: mediaObject,
                  preview: mediaObject,
                },
              } as Gif,
              alt: gifData.alt,
            }
            break
          }
        }
      }

      // Collect video for restoration (processed async by caller)
      if (post.embedVideos && post.embedVideos.length > 0) {
        const vid = post.embedVideos[0]
        const videoUri = loadedMedia.get(vid.localRef.path)
        if (videoUri) {
          const mimeType = parseVideoMimeType(vid.localRef.path)
          logger.debug('found video to restore', {
            localRefPath: vid.localRef.path,
            videoUri,
            altText: vid.alt,
            mimeType,
            captionCount: vid.captions?.length ?? 0,
          })
          restoredVideos.set(index, {
            uri: videoUri,
            altText: vid.alt || '',
            mimeType,
            localRefPath: vid.localRef.path,
            captions:
              vid.captions?.map(c => ({lang: c.lang, content: c.content})) ??
              [],
          })
        }
      }

      // Restore quote embed
      if (post.embedRecords && post.embedRecords.length > 0) {
        const record = post.embedRecords[0]
        embed.quote = {type: 'link', uri: record.record.uri}
      }

      // Restore link embed (only if not a GIF)
      if (post.embedExternals && !embed.media) {
        for (const ext of post.embedExternals) {
          const gifData = parseGifFromUrl(ext.uri)
          if (!gifData) {
            embed.link = {type: 'link', uri: ext.uri}
            break
          }
        }
      }

      // Parse labels
      const labels: string[] = []
      if (post.labels && 'values' in post.labels) {
        for (const val of post.labels.values) {
          labels.push(val.val)
        }
      }

      return {
        id: `draft-post-${index}`,
        richtext,
        shortenedGraphemeLength: richtext.graphemeLength,
        labels,
        embed,
      } as PostDraft
    }),
  )

  return {posts, restoredVideos}
}

/**
 * Convert server threadgate rules back to UI settings.
 */
export function threadgateToUISettings(
  threadgateAllow?: AppBskyDraftDefs.Draft['threadgateAllow'],
): Array<{type: string; list?: string}> {
  if (!threadgateAllow) {
    return []
  }

  return threadgateAllow
    .map(rule => {
      if ('$type' in rule) {
        if (rule.$type === 'app.bsky.feed.threadgate#mentionRule') {
          return {type: 'mention'}
        }
        if (rule.$type === 'app.bsky.feed.threadgate#followingRule') {
          return {type: 'following'}
        }
        if (rule.$type === 'app.bsky.feed.threadgate#followerRule') {
          return {type: 'followers'}
        }
        if (
          rule.$type === 'app.bsky.feed.threadgate#listRule' &&
          'list' in rule
        ) {
          return {type: 'list', list: (rule as {list: string}).list}
        }
      }
      return null
    })
    .filter((s): s is {type: string; list?: string} => s !== null)
}

/**
 * Extract all localRef paths from a draft.
 * Used to identify which media files belong to a draft for cleanup.
 */
export function extractLocalRefs(draft: AppBskyDraftDefs.Draft): Set<string> {
  const refs = new Set<string>()
  for (const post of draft.posts) {
    if (post.embedImages) {
      for (const img of post.embedImages) {
        refs.add(img.localRef.path)
      }
    }
    if (post.embedVideos) {
      for (const vid of post.embedVideos) {
        refs.add(vid.localRef.path)
      }
    }
  }
  logger.debug('extracted localRefs from draft', {
    count: refs.size,
    refs: Array.from(refs),
  })
  return refs
}
