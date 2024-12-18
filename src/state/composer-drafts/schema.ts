import {readAsStringAsync} from 'expo-file-system'
import {AtUri, RichText} from '@atproto/api'
import {nanoid} from 'nanoid/non-secure'
import * as z from 'zod'

import {shortenLinks} from '#/lib/strings/rich-text-manip'
import {isNative} from '#/platform/detection'
import {EmbedDraft, ThreadDraft} from '#/view/com/composer/state/composer'
import {ComposerImage} from '../gallery'
import {createPostgateRecord} from '../queries/postgate/util'

const serializedAtUri = z.string().refine(
  uri => {
    try {
      // eslint-disable-next-line no-new
      new AtUri(uri)
      return true
    } catch {
      return false
    }
  },
  {message: `Not a valid AT-URI`},
)

const serializedDataUri = z
  .string()
  .refine(uri => uri.startsWith('data:'), {message: `Not a valid data URI`})

const serializedBskyPostUri = serializedAtUri.refine(
  uri => uri.includes('/app.bsky.feed.post/'),
  {message: `Not a valid app.bsky.feed.post URI`},
)

const imageMeta = z.object({
  path: serializedDataUri,
  width: z.number().nonnegative().int(),
  height: z.number().nonnegative().int(),
  mime: z.string(),
})

// ComposerImage can contain transformations, but we'll ignore those for now,
// it does mean that users won't be able to re-edit their drafted images though.
const serializedImage = z.object({
  alt: z.string(),
  source: imageMeta,
})
type SerializedImage = z.infer<typeof serializedImage>

const serializedImageMedia = z.object({
  type: z.literal('images'),
  images: z.array(serializedImage),
})

const serializedLink = z.object({
  type: z.literal('link'),
  uri: z.string(),
})

const serializedEmbed = z.object({
  quote: z.optional(serializedLink),
  media: z.optional(serializedImageMedia),
  link: z.optional(serializedLink),
})
type SerializedEmbed = z.infer<typeof serializedEmbed>

const serializedPost = z.object({
  text: z.string(),
  labels: z.array(z.string()),
  embed: serializedEmbed,
})
type SerializedPost = z.infer<typeof serializedPost>

export const serializedThreadDraft = z.object({
  version: z.literal(1),
  posts: z.array(serializedPost).min(1),
  postgate: z.object({
    detachedEmbeddingUris: z.array(serializedBskyPostUri).optional(),
    embeddingRules: z.array(z.object({type: z.literal('disable')})).optional(),
  }),
  threadgate: z.array(
    z.union([
      z.object({type: z.literal('everybody')}),
      z.object({type: z.literal('nobody')}),
      z.object({type: z.literal('mention')}),
      z.object({type: z.literal('following')}),
      z.object({type: z.literal('list'), list: z.unknown()}),
    ]),
  ),
})

export type SerializedThreadDraft = z.infer<typeof serializedThreadDraft>

const convertToDataUri = async (uri: string): Promise<string> => {
  if (uri.startsWith('data:')) {
    return uri
  }

  if (!isNative) {
    throw new Error(`unknown uri: ${uri}`)
  }

  const base64 = await readAsStringAsync(uri)
  return `data:image/png;base64,${base64}`
}

const serializeMedia = async (
  media: NonNullable<EmbedDraft['media']>,
): Promise<NonNullable<SerializedEmbed['media']>> => {
  if (media.type === 'images') {
    return {
      type: 'images',
      images: await Promise.all(
        media.images.map(async (img): Promise<SerializedImage> => {
          const src = img.transformed ?? img.source

          return {
            alt: img.alt,
            source: {
              path: await convertToDataUri(src.path),
              width: src.width,
              height: src.height,
              mime: src.mime,
            },
          }
        }),
      ),
    }
  }

  // we specifically don't handle gifs and videos at the moment
  throw new Error(`unhandled '${media.type}' media type`)
}

export const serializeThread = async ({
  posts,
  postgate,
  threadgate,
}: ThreadDraft): Promise<SerializedThreadDraft> => {
  const serialized: SerializedThreadDraft = {
    version: 1,
    posts: await Promise.all(
      posts.map(async ({richtext, embed, labels}): Promise<SerializedPost> => {
        return {
          text: richtext.text,
          embed: {
            link: embed.link && {type: 'link', uri: embed.link.uri},
            quote: embed.quote && {type: 'link', uri: embed.quote.uri},
            media: embed.media && (await serializeMedia(embed.media)),
          },
          labels: labels.slice(),
        }
      }),
    ),
    postgate: {
      detachedEmbeddingUris: postgate.detachedEmbeddingUris?.slice(),
      embeddingRules: postgate.embeddingRules?.map(rule => {
        switch (rule.$type) {
          case 'app.bsky.feed.postgate#disableRule':
            return {type: 'disable'}

          default:
            throw new Error(`unhandled '${rule.$type}' postgate type`)
        }
      }),
    },
    threadgate: threadgate.map(allow => {
      switch (allow.type) {
        case 'everybody':
          return {type: 'everybody'}
        case 'following':
          return {type: 'following'}
        case 'list':
          return {type: 'list', list: allow.list}
        case 'mention':
          return {type: 'mention'}
        case 'nobody':
          return {type: 'nobody'}
      }
    }),
  }

  // just in case, validate that they are correct.
  return serializedThreadDraft.parse(serialized)
}

const deserializeMedia = (
  media: NonNullable<SerializedEmbed['media']>,
): NonNullable<EmbedDraft['media']> => {
  if (media.type === 'images') {
    return {
      type: 'images',
      images: media.images.map((img): ComposerImage => {
        const src = img.source

        return {
          alt: img.alt,
          source: {
            id: nanoid(),
            path: src.path,
            width: src.width,
            height: src.height,
            mime: src.mime,
          },
        }
      }),
    }
  }

  throw new Error(`unhandled '${media.type}' media type`)
}

export const deserializeThread = ({
  posts,
  postgate,
  threadgate,
}: SerializedThreadDraft): ThreadDraft => {
  const deserialized: ThreadDraft = {
    posts: posts.map(({text, embed, labels}) => {
      const richtext = new RichText({text})
      richtext.detectFacetsWithoutResolution()

      return {
        id: nanoid(),
        richtext: richtext,
        shortenedGraphemeLength: shortenLinks(richtext).graphemeLength,
        embed: {
          link: embed.link && {type: 'link', uri: embed.link.uri},
          quote: embed.quote && {type: 'link', uri: embed.quote.uri},
          media: embed.media && deserializeMedia(embed.media),
        },
        labels: labels,
      }
    }),
    postgate: createPostgateRecord({
      post: '',
      detachedEmbeddingUris: postgate.detachedEmbeddingUris,
      embeddingRules: postgate.embeddingRules,
    }),
    threadgate: threadgate.map(allow => {
      switch (allow.type) {
        case 'everybody':
          return {type: 'everybody'}
        case 'following':
          return {type: 'following'}
        case 'list':
          return {type: 'list', list: allow.list}
        case 'mention':
          return {type: 'mention'}
        case 'nobody':
          return {type: 'nobody'}
      }
    }),
  }

  return deserialized
}
