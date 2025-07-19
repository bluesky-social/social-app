import {AppBskyFeedDefs} from '@atproto/api'
import {Vibrant} from 'node-vibrant/node'

import {httpLogger} from '../logger.js'
import {getStarterPackImageUri} from '../util/getStarterPackImageUri.js'
import {Embed, parseEmbed} from '../util/parseEmbed.js'
import {parseEmbedPlayerFromUrl} from '../util/parseEmbedPlayerFromUrl.js'
import {getImage} from './getImage.js'

export type Metadata = {
  colors?: {
    vibrant: string
    darkVibrant: string
    lightVibrant: string
    muted: string
    darkMuted: string
    lightMuted: string
  }
  aspectRatio: {
    width: number
    height: number
  }
}

export type Image = Metadata & {
  mime: 'image/jpeg' | 'image/png' | string | undefined
  image: Buffer
}

export type PostData = {
  images: Map<string, Image>
}

function normalizeAspectRatio(aspectRatio?: {
  width: number
  height: number
}): Metadata['aspectRatio'] {
  if (!aspectRatio)
    return {
      width: 1000,
      height: 1000,
    }
  return aspectRatio
}

export function getEmbedData(embed: Embed, images: Map<string, Metadata>) {
  switch (embed.type) {
    case 'images': {
      for (const image of embed.view.images) {
        images.set(image.fullsize, {
          aspectRatio: normalizeAspectRatio(image.aspectRatio),
        })
      }
      break
    }
    case 'link': {
      if (embed.view.external.thumb) {
        images.set(embed.view.external.thumb, {
          aspectRatio: {
            width: 1200,
            height: 630,
          },
        })
      }
      const player = parseEmbedPlayerFromUrl(embed.view.external.uri)
      if (player) {
        if (['giphy_gif', 'tenor_gif'].includes(player.type)) {
          images.set(player.playerUri, {
            aspectRatio: {
              width: 1000,
              height: 1000,
            },
          })
        }
      }
      break
    }
    case 'video': {
      if (embed.view.thumbnail) {
        images.set(embed.view.thumbnail, {
          aspectRatio: normalizeAspectRatio(embed.view.aspectRatio),
        })
      }
      break
    }
    case 'feed': {
      if (embed.view.avatar) {
        images.set(embed.view.avatar, {
          aspectRatio: {
            width: 1000,
            height: 1000,
          },
        })
      }
      break
    }
    case 'list': {
      if (embed.view.avatar) {
        images.set(embed.view.avatar, {
          aspectRatio: {
            width: 1000,
            height: 1000,
          },
        })
      }
      break
    }
    case 'starter_pack': {
      const uri = getStarterPackImageUri(embed.view)
      images.set(uri, {
        aspectRatio: {
          width: 1200,
          height: 630,
        },
      })
      break
    }
    case 'post': {
      if (embed.view.author.avatar) {
        images.set(embed.view.author.avatar, {
          aspectRatio: {
            width: 1000,
            height: 1000,
          },
        })
      }
      if (embed.view.embeds) {
        for (const _e of embed.view.embeds) {
          getEmbedData(parseEmbed(_e), images)
        }
      }
      break
    }
    case 'post_with_media': {
      getEmbedData(embed.view, images)
      getEmbedData(embed.media, images)
      break
    }
    case 'post_blocked':
    case 'post_detached':
    case 'post_not_found':
    default:
      break
  }
}

export async function getImageColors(image: Buffer) {
  const palette = await Vibrant.from(image).getPalette()
  return {
    vibrant: palette.Vibrant?.hex,
    darkVibrant: palette.DarkVibrant?.hex,
    lightVibrant: palette.LightVibrant?.hex,
    muted: palette.Muted?.hex,
    darkMuted: palette.DarkMuted?.hex,
    lightMuted: palette.LightMuted?.hex,
  }
}

export async function getPostData(
  post: AppBskyFeedDefs.PostView,
): Promise<PostData> {
  const images: Map<string, Metadata> = new Map()

  if (post.author.avatar) {
    images.set(post.author.avatar, {
      aspectRatio: {
        width: 1000,
        height: 1000,
      },
    })
  }

  if (post.embed) {
    getEmbedData(parseEmbed(post.embed), images)
  }

  const deduped = Array.from(images.entries())
  const resolved = await Promise.all(
    deduped.map(async ([url, meta]) => {
      try {
        const imageData = await getImage(url)
        const palette = await getImageColors(imageData.image)
        return [
          url,
          {
            colors: palette,
            ...meta,
            ...imageData,
          },
        ] as const
      } catch (err) {
        httpLogger.warn({err, uri: url}, 'could not fetch image')
        return [
          url,
          {
            ...meta,
            image: null,
          },
        ] as const
      }
    }),
  )
  const extracted = resolved.filter(([, i]) => i.image !== null) as [
    string,
    Image,
  ][]

  return {
    images: new Map(extracted),
  }
}
