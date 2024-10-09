import {ImagePickerAsset} from 'expo-image-picker'
import {AppBskyFeedPostgate, RichText} from '@atproto/api'

import {insertMentionAt} from '#/lib/strings/mention-manip'
import {
  isBskyPostUrl,
  postUriToRelativePath,
  toBskyAppUrl,
} from '#/lib/strings/url-helpers'
import {ComposerImage, createInitialImages} from '#/state/gallery'
import {createPostgateRecord} from '#/state/queries/postgate/util'
import {Gif} from '#/state/queries/tenor'
import {threadgateViewToAllowUISetting} from '#/state/queries/threadgate'
import {ThreadgateAllowUISetting} from '#/state/queries/threadgate'
import {ComposerOpts} from '#/state/shell/composer'
import {createVideoState, VideoAction, videoReducer, VideoState} from './video'

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

export type ComposerDraft = {
  richtext: RichText
  labels: string[]
  postgate: AppBskyFeedPostgate.Record
  threadgate: ThreadgateAllowUISetting[]
  embed: EmbedDraft
}

export type ComposerAction =
  | {type: 'update_richtext'; richtext: RichText}
  | {type: 'update_labels'; labels: string[]}
  | {type: 'update_postgate'; postgate: AppBskyFeedPostgate.Record}
  | {type: 'update_threadgate'; threadgate: ThreadgateAllowUISetting[]}
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

export const MAX_IMAGES = 4

export function composerReducer(
  state: ComposerDraft,
  action: ComposerAction,
): ComposerDraft {
  switch (action.type) {
    case 'update_richtext': {
      return {
        ...state,
        richtext: action.richtext,
      }
    }
    case 'update_labels': {
      return {
        ...state,
        labels: action.labels,
      }
    }
    case 'update_postgate': {
      return {
        ...state,
        postgate: action.postgate,
      }
    }
    case 'update_threadgate': {
      return {
        ...state,
        threadgate: action.threadgate,
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
      return {
        ...state,
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
    default:
      return state
  }
}

export function createComposerState({
  initText,
  initMention,
  initImageUris,
  initQuoteUri,
}: {
  initText: string | undefined
  initMention: string | undefined
  initImageUris: ComposerOpts['imageUris']
  initQuoteUri: string | undefined
}): ComposerDraft {
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
  return {
    richtext: initRichText,
    labels: [],
    postgate: createPostgateRecord({post: ''}),
    threadgate: threadgateViewToAllowUISetting(undefined),
    embed: {
      quote,
      media,
      link: undefined,
    },
  }
}
