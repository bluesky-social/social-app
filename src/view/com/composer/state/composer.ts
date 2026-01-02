import {type ImagePickerAsset} from 'expo-image-picker'
import {
  type AppBskyFeedPostgate,
  AppBskyRichtextFacet,
  type BskyPreferences,
  RichText,
} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

import {type SelfLabel} from '#/lib/moderation'
import {insertMentionAt} from '#/lib/strings/mention-manip'
import {shortenLinks} from '#/lib/strings/rich-text-manip'
import {
  isBskyPostUrl,
  postUriToRelativePath,
  toBskyAppUrl,
} from '#/lib/strings/url-helpers'
import {type ComposerImage, createInitialImages} from '#/state/gallery'
import {createPostgateRecord} from '#/state/queries/postgate/util'
import {type Gif} from '#/state/queries/tenor'
import {threadgateRecordToAllowUISetting} from '#/state/queries/threadgate'
import {type ThreadgateAllowUISetting} from '#/state/queries/threadgate'
import {type ComposerOpts} from '#/state/shell/composer'
import {
  type LinkFacetMatch,
  suggestLinkCardUri,
} from '#/view/com/composer/text-input/text-input-util'
import {
  createVideoState,
  type VideoAction,
  videoReducer,
  type VideoState,
} from './video'

type ImagesMedia = {
  type: 'images'
  images: ComposerImage[]
}

type VideoMedia = {
  type: 'video'
  video: VideoState
}

type GifMedia = {
  type: 'gif'
  gif: Gif
  alt: string
}

type Link = {
  type: 'link'
  uri: string
}

// This structure doesn't exactly correspond to the data model.
// Instead, it maps to how the UI is organized, and how we present a post.
export type EmbedDraft = {
  // We'll always submit quote and actual media (images, video, gifs) chosen by the user.
  quote: Link | undefined
  media: ImagesMedia | VideoMedia | GifMedia | undefined
  // This field may end up ignored if we have more important things to display than a link card:
  link: Link | undefined
}

export type PostDraft = {
  id: string
  richtext: RichText
  labels: SelfLabel[]
  embed: EmbedDraft
  shortenedGraphemeLength: number
}

export type PostAction =
  | {type: 'update_richtext'; richtext: RichText}
  | {type: 'update_labels'; labels: SelfLabel[]}
  | {type: 'embed_add_images'; images: ComposerImage[]}
  | {type: 'embed_update_image'; image: ComposerImage}
  | {type: 'embed_remove_image'; image: ComposerImage}
  | {
      type: 'embed_add_video'
      asset: ImagePickerAsset
      abortController: AbortController
    }
  | {type: 'embed_remove_video'}
  | {type: 'embed_update_video'; videoAction: VideoAction}
  | {type: 'embed_add_uri'; uri: string}
  | {type: 'embed_remove_quote'}
  | {type: 'embed_remove_link'}
  | {type: 'embed_add_gif'; gif: Gif}
  | {type: 'embed_update_gif'; alt: string}
  | {type: 'embed_remove_gif'}

export type ThreadDraft = {
  posts: PostDraft[]
  postgate: AppBskyFeedPostgate.Record
  threadgate: ThreadgateAllowUISetting[]
}

export type ComposerState = {
  thread: ThreadDraft
  activePostIndex: number
  mutableNeedsFocusActive: boolean
}

export type ComposerAction =
  | {type: 'update_postgate'; postgate: AppBskyFeedPostgate.Record}
  | {type: 'update_threadgate'; threadgate: ThreadgateAllowUISetting[]}
  | {
      type: 'update_post'
      postId: string
      postAction: PostAction
    }
  | {
      type: 'add_post'
    }
  | {
      type: 'remove_post'
      postId: string
    }
  | {
      type: 'focus_post'
      postId: string
    }

export const MAX_IMAGES = 4

export function composerReducer(
  state: ComposerState,
  action: ComposerAction,
): ComposerState {
  switch (action.type) {
    case 'update_postgate': {
      return {
        ...state,
        thread: {
          ...state.thread,
          postgate: action.postgate,
        },
      }
    }
    case 'update_threadgate': {
      return {
        ...state,
        thread: {
          ...state.thread,
          threadgate: action.threadgate,
        },
      }
    }
    case 'update_post': {
      let nextPosts = state.thread.posts
      const postIndex = state.thread.posts.findIndex(
        p => p.id === action.postId,
      )
      if (postIndex !== -1) {
        nextPosts = state.thread.posts.slice()
        nextPosts[postIndex] = postReducer(
          state.thread.posts[postIndex],
          action.postAction,
        )
      }
      return {
        ...state,
        thread: {
          ...state.thread,
          posts: nextPosts,
        },
      }
    }
    case 'add_post': {
      const activePostIndex = state.activePostIndex
      const nextPosts = [...state.thread.posts]
      nextPosts.splice(activePostIndex + 1, 0, {
        id: nanoid(),
        richtext: new RichText({text: ''}),
        shortenedGraphemeLength: 0,
        labels: [],
        embed: {
          quote: undefined,
          media: undefined,
          link: undefined,
        },
      })
      return {
        ...state,
        thread: {
          ...state.thread,
          posts: nextPosts,
        },
      }
    }
    case 'remove_post': {
      if (state.thread.posts.length < 2) {
        return state
      }
      let nextActivePostIndex = state.activePostIndex
      const indexToRemove = state.thread.posts.findIndex(
        p => p.id === action.postId,
      )
      let nextPosts = [...state.thread.posts]
      if (indexToRemove !== -1) {
        const postToRemove = state.thread.posts[indexToRemove]
        if (postToRemove.embed.media?.type === 'video') {
          postToRemove.embed.media.video.abortController.abort()
        }
        nextPosts.splice(indexToRemove, 1)
        nextActivePostIndex = Math.max(0, indexToRemove - 1)
      }
      return {
        ...state,
        activePostIndex: nextActivePostIndex,
        mutableNeedsFocusActive: true,
        thread: {
          ...state.thread,
          posts: nextPosts,
        },
      }
    }
    case 'focus_post': {
      const nextActivePostIndex = state.thread.posts.findIndex(
        p => p.id === action.postId,
      )
      if (nextActivePostIndex === -1) {
        return state
      }
      return {
        ...state,
        activePostIndex: nextActivePostIndex,
      }
    }
  }
}

function postReducer(state: PostDraft, action: PostAction): PostDraft {
  switch (action.type) {
    case 'update_richtext': {
      return {
        ...state,
        richtext: action.richtext,
        shortenedGraphemeLength: getShortenedLength(action.richtext),
      }
    }
    case 'update_labels': {
      return {
        ...state,
        labels: action.labels,
      }
    }
    case 'embed_add_images': {
      if (action.images.length === 0) {
        return state
      }
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (!prevMedia) {
        nextMedia = {
          type: 'images',
          images: action.images.slice(0, MAX_IMAGES),
        }
      } else if (prevMedia.type === 'images') {
        nextMedia = {
          ...prevMedia,
          images: [...prevMedia.images, ...action.images].slice(0, MAX_IMAGES),
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_update_image': {
      const prevMedia = state.embed.media
      if (prevMedia?.type === 'images') {
        const updatedImage = action.image
        const nextMedia = {
          ...prevMedia,
          images: prevMedia.images.map(img => {
            if (img.source.id === updatedImage.source.id) {
              return updatedImage
            }
            return img
          }),
        }
        return {
          ...state,
          embed: {
            ...state.embed,
            media: nextMedia,
          },
        }
      }
      return state
    }
    case 'embed_remove_image': {
      const prevMedia = state.embed.media
      let nextLabels = state.labels
      if (prevMedia?.type === 'images') {
        const removedImage = action.image
        let nextMedia: ImagesMedia | undefined = {
          ...prevMedia,
          images: prevMedia.images.filter(img => {
            return img.source.id !== removedImage.source.id
          }),
        }
        if (nextMedia.images.length === 0) {
          nextMedia = undefined
          if (!state.embed.link) {
            nextLabels = []
          }
        }
        return {
          ...state,
          labels: nextLabels,
          embed: {
            ...state.embed,
            media: nextMedia,
          },
        }
      }
      return state
    }
    case 'embed_add_video': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (!prevMedia) {
        nextMedia = {
          type: 'video',
          video: createVideoState(action.asset, action.abortController),
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_update_video': {
      const videoAction = action.videoAction
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (prevMedia?.type === 'video') {
        nextMedia = {
          ...prevMedia,
          video: videoReducer(prevMedia.video, videoAction),
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_remove_video': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (prevMedia?.type === 'video') {
        prevMedia.video.abortController.abort()
        nextMedia = undefined
      }
      let nextLabels = state.labels
      if (!state.embed.link) {
        nextLabels = []
      }
      return {
        ...state,
        labels: nextLabels,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_add_uri': {
      const prevQuote = state.embed.quote
      const prevLink = state.embed.link
      let nextQuote = prevQuote
      let nextLink = prevLink
      if (isBskyPostUrl(action.uri)) {
        if (!prevQuote) {
          nextQuote = {
            type: 'link',
            uri: action.uri,
          }
        }
      } else {
        if (!prevLink) {
          nextLink = {
            type: 'link',
            uri: action.uri,
          }
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          quote: nextQuote,
          link: nextLink,
        },
      }
    }
    case 'embed_remove_link': {
      let nextLabels = state.labels
      if (!state.embed.media) {
        nextLabels = []
      }
      return {
        ...state,
        labels: nextLabels,
        embed: {
          ...state.embed,
          link: undefined,
        },
      }
    }
    case 'embed_remove_quote': {
      return {
        ...state,
        embed: {
          ...state.embed,
          quote: undefined,
        },
      }
    }
    case 'embed_add_gif': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (!prevMedia) {
        nextMedia = {
          type: 'gif',
          gif: action.gif,
          alt: '',
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_update_gif': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (prevMedia?.type === 'gif') {
        nextMedia = {
          ...prevMedia,
          alt: action.alt,
        }
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
    case 'embed_remove_gif': {
      const prevMedia = state.embed.media
      let nextMedia = prevMedia
      if (prevMedia?.type === 'gif') {
        nextMedia = undefined
      }
      return {
        ...state,
        embed: {
          ...state.embed,
          media: nextMedia,
        },
      }
    }
  }
}

export function createComposerState({
  initText,
  initMention,
  initImageUris,
  initQuoteUri,
  initInteractionSettings,
}: {
  initText: string | undefined
  initMention: string | undefined
  initImageUris: ComposerOpts['imageUris']
  initQuoteUri: string | undefined
  initInteractionSettings:
    | BskyPreferences['postInteractionSettings']
    | undefined
}): ComposerState {
  let media: ImagesMedia | undefined
  if (initImageUris?.length) {
    media = {
      type: 'images',
      images: createInitialImages(initImageUris),
    }
  }
  let quote: Link | undefined
  if (initQuoteUri) {
    // TODO: Consider passing the app url directly.
    const path = postUriToRelativePath(initQuoteUri)
    if (path) {
      quote = {
        type: 'link',
        uri: toBskyAppUrl(path),
      }
    }
  }
  const initRichText = new RichText({
    text: initText
      ? initText
      : initMention
        ? insertMentionAt(
            `@${initMention}`,
            initMention.length + 1,
            `${initMention}`,
          )
        : '',
  })

  let link: Link | undefined

  /**
   * `initText` atm is only used for compose intents, meaning share links from
   * external sources. If `initText` is defined, we want to extract links/posts
   * from `initText` and suggest them as embeds.
   *
   * This checks for posts separately from other types of links so that posts
   * can become quotes. The util `suggestLinkCardUri` is then applied to ensure
   * we suggest at most 1 of each.
   */
  if (initText) {
    initRichText.detectFacetsWithoutResolution()
    const detectedExtUris = new Map<string, LinkFacetMatch>()
    const detectedPostUris = new Map<string, LinkFacetMatch>()
    if (initRichText.facets) {
      for (const facet of initRichText.facets) {
        for (const feature of facet.features) {
          if (AppBskyRichtextFacet.isLink(feature)) {
            if (isBskyPostUrl(feature.uri)) {
              detectedPostUris.set(feature.uri, {facet, rt: initRichText})
            } else {
              detectedExtUris.set(feature.uri, {facet, rt: initRichText})
            }
          }
        }
      }
    }
    const pastSuggestedUris = new Set<string>()
    const suggestedExtUri = suggestLinkCardUri(
      true,
      detectedExtUris,
      new Map(),
      pastSuggestedUris,
    )
    if (suggestedExtUri) {
      link = {
        type: 'link',
        uri: suggestedExtUri,
      }
    }
    const suggestedPostUri = suggestLinkCardUri(
      true,
      detectedPostUris,
      new Map(),
      pastSuggestedUris,
    )
    if (suggestedPostUri) {
      /*
       * `initQuote` is only populated via in-app user action, but we're being
       * future-defensive here.
       */
      if (!quote) {
        quote = {
          type: 'link',
          uri: suggestedPostUri,
        }
      }
    }
  }

  return {
    activePostIndex: 0,
    mutableNeedsFocusActive: false,
    thread: {
      posts: [
        {
          id: nanoid(),
          richtext: initRichText,
          shortenedGraphemeLength: getShortenedLength(initRichText),
          labels: [],
          embed: {
            quote,
            media,
            link,
          },
        },
      ],
      postgate: createPostgateRecord({
        post: '',
        embeddingRules: initInteractionSettings?.postgateEmbeddingRules || [],
      }),
      threadgate: threadgateRecordToAllowUISetting({
        $type: 'app.bsky.feed.threadgate',
        post: '',
        createdAt: new Date().toString(),
        allow: initInteractionSettings?.threadgateAllowRules,
      }),
    },
  }
}

function getShortenedLength(rt: RichText) {
  return shortenLinks(rt).graphemeLength
}
