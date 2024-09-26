import {RichText} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'

import {MAX_GRAPHEME_LENGTH} from '#/lib/constants'
import {shortenLinks} from '#/lib/strings/rich-text-manip'
import {
  convertBskyAppUrlIfNeeded,
  isBskyCustomFeedUrl,
  isBskyListUrl,
  isBskyPostUrl,
  makeRecordUri,
} from '#/lib/strings/url-helpers'
import {ComposerImage} from '#/state/gallery'
import {Gif} from '#/state/queries/tenor'
import {ThreadgateAllowUISetting} from '#/state/queries/threadgate'
import {
  ComposerOpts,
  ComposerOptsPostRef,
  ComposerOptsQuote,
} from '#/state/shell/composer'

type EmbedType = 'external' | 'gif' | 'image' | 'record'

export const MAX_POSTS = 10
export const MAX_IMAGES = 4

export interface PostExternalEmbed {
  type: 'external'
  uri: string
  labels: string[]
}

/** Technically doesn't exist, this is to be sent as an external embed */
export interface PostGifEmbed {
  type: 'gif'
  gif: Gif
  /** User-provided alt text, `undefined` if not provided. */
  alt?: string
}

export interface PostImageEmbed {
  type: 'image'
  images: ComposerImage[]
  labels: string[]
}

export interface PostRecordQuoteEmbed {
  type: 'record'
  kind: 'post'
  uri: string
  data?: ComposerOptsQuote
}

export interface PostRecordRestEmbed {
  type: 'record'
  kind: 'feed' | 'list'
  uri: string
}

export type PostRecordEmbed = PostRecordQuoteEmbed | PostRecordRestEmbed

export interface PostRecordWithMediaEmbed {
  type: 'recordWithMedia'
  record: PostRecordEmbed
  media: PostMediaEmbed
}

export type PostMediaEmbed = PostImageEmbed | PostGifEmbed | PostExternalEmbed

export type PostEmbed =
  | PostGifEmbed
  | PostExternalEmbed
  | PostImageEmbed
  | PostRecordEmbed
  | PostRecordWithMediaEmbed

export interface PostState {
  id: string
  richtext: RichText
  languages: string[]
  embed?: PostEmbed
}

export interface PostStateWithDerivation extends PostState {
  /** The computed length of `richtext` */
  rtLength: number
  /** What type of embeds we're allowed to insert, given the current `embed` state */
  canEmbed: EmbedType[]
  /** Whether any images have missing alt text */
  isAltTextMissing: boolean
}

export interface ComposerState {
  reply: ComposerOptsPostRef | undefined
  error?: string
  active: number
  posts: PostStateWithDerivation[]
  threadgates: ThreadgateAllowUISetting[]
}

export interface ComposerStateWithDerivation extends ComposerState {
  /** Whether these posts can be published, this only checks for rtLength */
  canPublish: boolean
  /** Whether one of the post is missing an alt text */
  isAltTextMissing: boolean
}

export type ComposerAction =
  /** Add a new post, starting after `postId` */
  | {type: 'add_post'; postId: string}
  /** Remove the post matching `postId` */
  | {type: 'remove_post'; postId: string}
  /** Set post matching `postId` as active */
  | {type: 'set_active'; postId: string}
  /** Set composer error */
  | {type: 'set_error'; error: string | undefined}
  /** Set language to post matching `postId */
  | {type: 'set_languages'; postId: string; languages: string[]}
  /** Set rich text to post matching `postId` */
  | {type: 'set_richtext'; postId: string; richtext: RichText}
  /** Set threadgate to the whole post */
  | {type: 'set_threadgates'; threadgates: ThreadgateAllowUISetting[]}
  /** Add new images to post matching `postId` */
  | {type: 'embed_add_images'; postId: string; images: ComposerImage[]}
  /** Remove matching image from post matching `postId` */
  | {type: 'embed_remove_image'; postId: string; image: ComposerImage}
  /** Remove media embed (external/gifs) from post matching `postId` */
  | {type: 'embed_remove_media'; postId: string}
  /** Remove record embed from post matching `postId` */
  | {type: 'embed_remove_record'; postId: string}
  /** Add/update GIF embed from post matching `postId` */
  | {type: 'embed_set_gif'; postId: string; gif: PostGifEmbed}
  /** Set labels on media embeds to post matching `postId` */
  | {type: 'embed_set_labels'; postId: string; labels: string[]}
  /** Add external embed from post matching `postId` */
  | {type: 'embed_set_link'; postId: string; uri: string}
  /** Update image matching `imageId` from post matching `postId` */
  | {type: 'embed_update_image'; postId: string; image: ComposerImage}

export function reducer(
  state: ComposerStateWithDerivation,
  action: ComposerAction,
): ComposerStateWithDerivation {
  switch (action.type) {
    case 'add_post': {
      const index = state.posts.findIndex(p => p.id === action.postId)
      if (index === -1) {
        return state
      }

      const previous = state.posts[index]
      if (previous.rtLength === 0 && !previous.embed) {
        return state
      }

      const filtered = state.posts.filter(p => p.rtLength !== 0 || !!p.embed)
      const targetIndex = filtered.indexOf(previous)

      const newPost = createPostState(previous)

      return deriveComposerState({
        ...state,
        active: targetIndex + 1,
        posts: filtered.toSpliced(targetIndex + 1, 0, newPost),
      })
    }
    case 'remove_post': {
      const index = state.posts.findIndex(p => p.id === action.postId)

      if (index === -1) {
        return state
      }

      const nextIndex = state.posts[index + 1]
        ? index
        : state.posts[index - 1]
        ? index - 1
        : null

      if (nextIndex === null) {
        return state
      }

      return deriveComposerState({
        ...state,
        active: nextIndex,
        posts: state.posts.toSpliced(index, 1),
      })
    }
    case 'set_active': {
      const index = state.posts.findIndex(p => p.id === action.postId)

      if (index === -1 || state.active === index) {
        return state
      }

      return deriveComposerState({
        ...state,
        active: index,
      })
    }
    case 'set_error': {
      return deriveComposerState({
        ...state,
        error: action.error,
      })
    }
    case 'set_languages': {
      return deriveComposerState({
        ...state,
        posts: state.posts.map(p => {
          if (p.id === action.postId) {
            return {
              ...p,
              languages: action.languages,
            }
          }

          return p
        }),
      })
    }
    case 'set_richtext': {
      return deriveComposerState({
        ...state,
        posts: state.posts.map(p => {
          if (p.id === action.postId) {
            return {
              ...p,
              richtext: action.richtext,
              rtLength: shortenLinks(action.richtext).graphemeLength,
            }
          }

          return p
        }),
      })
    }
    case 'set_threadgates': {
      return deriveComposerState({
        ...state,
        threadgates: action.threadgates,
      })
    }
    case 'embed_add_images': {
      return deriveComposerState({
        ...state,
        posts: state.posts.map(p => {
          if (p.id === action.postId && p.canEmbed.includes('image')) {
            const prev = p.embed
            let next: PostEmbed | undefined = {
              type: 'image',
              images: action.images.slice(0, MAX_IMAGES),
              labels: [],
            }

            if (prev) {
              if (prev.type === 'image') {
                const images = [...prev.images, ...action.images]

                next = {
                  ...prev,
                  images: images.slice(0, MAX_IMAGES),
                }
              } else if (prev.type === 'record') {
                next = {
                  type: 'recordWithMedia',
                  record: prev,
                  media: next,
                }
              } else if (
                prev.type === 'recordWithMedia' &&
                prev.media.type === 'image'
              ) {
                const images = [...prev.media.images, ...action.images]

                next = {
                  ...prev,
                  media: {
                    ...prev.media,
                    images: images.slice(0, MAX_IMAGES),
                  },
                }
              }
            }

            return {
              ...p,
              embed: next,
              canEmbed: canEmbed(next),
              isAltTextMissing: isAltTextMissing(next),
            }
          }

          return p
        }),
      })
    }
    case 'embed_remove_image': {
      const imageId = action.image.source.id

      return deriveComposerState({
        ...state,
        posts: state.posts.map(p => {
          if (p.id === action.postId) {
            const prev = p.embed
            let next: PostEmbed | undefined

            if (prev) {
              if (prev.type === 'image') {
                const images = prev.images.filter(i => i.source.id !== imageId)

                if (images.length !== 0) {
                  next = {
                    ...prev,
                    images: images,
                  }
                }
              } else if (
                prev.type === 'recordWithMedia' &&
                prev.media.type === 'image'
              ) {
                const images = prev.media.images.filter(
                  i => i.source.id !== imageId,
                )

                if (images.length !== 0) {
                  next = {
                    ...prev,
                    media: {
                      ...prev.media,
                      images: images,
                    },
                  }
                } else {
                  next = prev.record
                }
              }
            }

            return {
              ...p,
              embed: next,
              canEmbed: canEmbed(next),
              isAltTextMissing: isAltTextMissing(next),
            }
          }

          return p
        }),
      })
    }
    case 'embed_remove_media': {
      return deriveComposerState({
        ...state,
        posts: state.posts.map(p => {
          if (p.id === action.postId) {
            let next = p.embed

            if (next) {
              if (next.type === 'recordWithMedia') {
                next = next.record
              } else if (next.type !== 'record') {
                next = undefined
              }
            }

            return {
              ...p,
              embed: next,
              canEmbed: canEmbed(next),
              isAltTextMissing: isAltTextMissing(next),
            }
          }

          return p
        }),
      })
    }
    case 'embed_remove_record': {
      return deriveComposerState({
        ...state,
        posts: state.posts.map(p => {
          if (p.id === action.postId) {
            let next = p.embed

            if (next) {
              if (next.type === 'recordWithMedia') {
                next = next.media
              } else if (next.type === 'record') {
                next = undefined
              }
            }

            return {
              ...p,
              embed: next,
              canEmbed: canEmbed(next),
              isAltTextMissing: isAltTextMissing(next),
            }
          }

          return p
        }),
      })
    }
    case 'embed_set_gif': {
      return deriveComposerState({
        ...state,
        posts: state.posts.map(p => {
          if (p.id === action.postId) {
            const prev = p.embed
            let next: PostEmbed | undefined = action.gif

            if (prev) {
              if (prev.type === 'recordWithMedia') {
                next = {
                  ...prev,
                  media: next,
                }
              } else if (prev.type === 'record') {
                next = {
                  type: 'recordWithMedia',
                  record: prev,
                  media: next,
                }
              }
            }

            return {
              ...p,
              embed: next,
              canEmbed: canEmbed(next),
              isAltTextMissing: isAltTextMissing(next),
            }
          }

          return p
        }),
      })
    }
    case 'embed_set_labels': {
      const labels = action.labels

      return deriveComposerState({
        ...state,
        posts: state.posts.map(p => {
          if (p.id === action.postId) {
            let next = p.embed

            if (next) {
              if (next.type === 'external' || next.type === 'image') {
                next = {...next, labels}
              } else if (next.type === 'recordWithMedia') {
                if (
                  next.media.type === 'external' ||
                  next.media.type === 'image'
                ) {
                  next = {...next, media: {...next.media, labels}}
                }
              }
            }

            return {
              ...p,
              embed: next,
              canEmbed: canEmbed(next),
              isAltTextMissing: isAltTextMissing(next),
            }
          }

          return p
        }),
      })
    }
    case 'embed_set_link': {
      const embed = detectLink(action.uri)

      return deriveComposerState({
        ...state,
        posts: state.posts.map(p => {
          if (p.id === action.postId && p.canEmbed.includes(embed.type)) {
            const prev = p.embed
            let next: PostEmbed | undefined = embed

            if (prev) {
              if (next.type === 'external') {
                if (prev.type === 'record') {
                  next = {
                    type: 'recordWithMedia',
                    media: next,
                    record: prev,
                  }
                }
              } else if (next.type === 'record') {
                if (prev.type !== 'record' && prev.type !== 'recordWithMedia') {
                  next = {
                    type: 'recordWithMedia',
                    media: prev,
                    record: next,
                  }
                }
              }
            }

            return {
              ...p,
              embed: next,
              canEmbed: canEmbed(next),
              isAltTextMissing: isAltTextMissing(next),
            }
          }

          return p
        }),
      })
    }
    case 'embed_update_image': {
      const image = action.image
      const imageId = image.source.id

      return deriveComposerState({
        ...state,
        posts: state.posts.map(p => {
          if (p.id === action.postId) {
            let next: PostEmbed | undefined = p.embed

            if (next) {
              if (next.type === 'image') {
                next = {
                  ...next,
                  images: next.images.map(i => {
                    if (i.source.id === imageId) {
                      return image
                    }

                    return i
                  }),
                }
              } else if (
                next.type === 'recordWithMedia' &&
                next.media.type === 'image'
              ) {
                next = {
                  ...next,
                  media: {
                    ...next.media,
                    images: next.media.images.map(i => {
                      if (i.source.id === image.source.id) {
                        return image
                      }

                      return i
                    }),
                  },
                }
              }
            }

            return {
              ...p,
              embed: next,
              canEmbed: canEmbed(next),
              isAltTextMissing: isAltTextMissing(next),
            }
          }

          return p
        }),
      })
    }
  }

  return state
}

function deriveComposerState(
  state: ComposerState,
): ComposerStateWithDerivation {
  return {
    ...state,
    canPublish: state.posts.every(p => {
      const embed = p.embed
      const record = getRecordEmbed(embed)

      return (
        ((embed && (!record || record.kind !== 'post')) || p.rtLength > 0) &&
        p.rtLength <= MAX_GRAPHEME_LENGTH
      )
    }),
    isAltTextMissing: state.posts.some(p => p.isAltTextMissing),
  }
}

function createPostState(previous: PostState): PostStateWithDerivation {
  return {
    id: nanoid(6),
    richtext: new RichText({text: ''}),
    languages: previous.languages,
    embed: undefined,

    rtLength: 0,
    canEmbed: canEmbed(undefined),
    isAltTextMissing: isAltTextMissing(undefined),
  }
}

export function createComposerState(
  opts: ComposerOpts,
): ComposerStateWithDerivation {
  const richtext = new RichText({text: opts.text ?? ''})
  if (opts.text) {
    richtext.detectFacetsWithoutResolution()
  }

  const quote = opts.quote
  let embed: PostEmbed | undefined
  if (quote) {
    embed = {
      type: 'record',
      kind: 'post',
      uri: quote.uri,
      data: quote,
    }
  }

  return deriveComposerState({
    reply: opts.replyTo,
    active: 0,
    posts: [
      {
        id: nanoid(6),
        richtext: richtext,
        languages: opts.languages ?? [],
        embed: embed,

        canEmbed: canEmbed(embed),
        isAltTextMissing: isAltTextMissing(embed),
        rtLength: 0,
      },
    ],
    threadgates: [],
  })
}

/** Determines what we can embed next based on the current embed state */
function canEmbed(embed: PostEmbed | undefined): EmbedType[] {
  if (embed !== undefined) {
    switch (embed.type) {
      case 'external':
        return ['record']
      case 'image':
        return embed.images.length < MAX_IMAGES
          ? ['image', 'record']
          : ['record']
      case 'gif':
        return ['record']
      case 'record':
        return ['external', 'gif', 'image']
      case 'recordWithMedia':
        switch (embed.media.type) {
          case 'image':
            return embed.media.images.length < MAX_IMAGES ? ['image'] : []
          default:
            return []
        }
      default:
        return []
    }
  }

  return ['external', 'gif', 'image', 'record']
}

/** Determine if any images or GIFs are missing alt text, if there is one */
function isAltTextMissing(embed: PostEmbed | undefined): boolean {
  {
    const image = getMediaEmbed(embed, 'image')
    if (image) {
      return image.images.every(i => i.alt.length === 0)
    }
  }

  {
    const gif = getMediaEmbed(embed, 'gif')
    if (gif) {
      return gif.alt === undefined
    }
  }

  return false
}

/** Retrieve media embeds of specified type, if there is one */
export function getMediaEmbed(
  embed: PostEmbed | undefined,
  type: 'external',
): PostExternalEmbed | undefined
export function getMediaEmbed(
  embed: PostEmbed | undefined,
  type: 'image',
): PostImageEmbed | undefined
export function getMediaEmbed(
  embed: PostEmbed | undefined,
  type: 'gif',
): PostGifEmbed | undefined
export function getMediaEmbed(embed: PostEmbed | undefined, type: string): any {
  if (embed) {
    if (embed.type === type) {
      return embed
    }

    if (embed.type === 'recordWithMedia' && embed.media.type === type) {
      return embed.media
    }
  }
}

export function getRecordEmbed(embed: PostEmbed | undefined) {
  if (embed) {
    if (embed.type === 'record') {
      return embed
    }

    if (embed.type === 'recordWithMedia') {
      return embed.record
    }
  }
}

/** Retrieve image counts from image embeds, if there's one */
export function getImageCount(embed: PostEmbed | undefined): number {
  return getMediaEmbed(embed, 'image')?.images.length ?? 0
}

/** Retrieves labels from external and image embeds, if there's one */
export function getEmbedLabels(
  embed: PostEmbed | undefined,
): string[] | undefined {
  {
    const image = getMediaEmbed(embed, 'image')
    if (image) {
      return image.labels
    }
  }

  {
    const external = getMediaEmbed(embed, 'external')
    if (external) {
      return external.labels
    }
  }
}

export function getGifUrl(gif: Gif) {
  return `${gif.media_formats.gif.url}?hh=${gif.media_formats.gif.dims[1]}&ww=${gif.media_formats.gif.dims[0]}`
}

function detectLink(url: string): PostExternalEmbed | PostRecordEmbed {
  if (isBskyPostUrl(url)) {
    url = convertBskyAppUrlIfNeeded(url)

    const [_0, handleOrDid, _1, rkey] = url.split('/').filter(Boolean)
    const uri = makeRecordUri(handleOrDid, 'app.bsky.feed.post', rkey)

    return {
      type: 'record',
      kind: 'post',
      uri: uri,
    }
  }

  if (isBskyCustomFeedUrl(url)) {
    url = convertBskyAppUrlIfNeeded(url)

    const [_0, handleOrDid, _1, rkey] = url.split('/').filter(Boolean)
    const uri = makeRecordUri(handleOrDid, 'app.bsky.feed.generator', rkey)

    return {
      type: 'record',
      kind: 'feed',
      uri: uri,
    }
  }

  if (isBskyListUrl(url)) {
    url = convertBskyAppUrlIfNeeded(url)

    const [_0, handleOrDid, _1, rkey] = url.split('/').filter(Boolean)
    const uri = makeRecordUri(handleOrDid, 'app.bsky.graph.list', rkey)

    return {
      type: 'record',
      kind: 'list',
      uri: uri,
    }
  }

  return {
    type: 'external',
    uri: url,
    labels: [],
  }
}
