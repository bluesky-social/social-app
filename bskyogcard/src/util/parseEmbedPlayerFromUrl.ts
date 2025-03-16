export const embedPlayerSources = ['giphy', 'tenor'] as const

export type EmbedPlayerSource = (typeof embedPlayerSources)[number]

export type EmbedPlayerType = 'giphy_gif' | 'tenor_gif'

export const externalEmbedLabels: Record<EmbedPlayerSource, string> = {
  giphy: 'GIPHY',
  tenor: 'Tenor',
}

export interface EmbedPlayerParams {
  type: EmbedPlayerType
  playerUri: string
  isGif?: boolean
  source: EmbedPlayerSource
  metaUri?: string
  hideDetails?: boolean
  dimensions?: {
    height: number
    width: number
  }
}

const giphyRegex = /media(?:[0-4]\.giphy\.com|\.giphy\.com)/i
const gifFilenameRegex = /^(\S+)\.(webp|gif|mp4)$/i

export function parseEmbedPlayerFromUrl(
  url: string,
): EmbedPlayerParams | undefined {
  let urlp
  try {
    urlp = new URL(url)
  } catch (e) {
    return undefined
  }

  if (urlp.hostname === 'giphy.com' || urlp.hostname === 'www.giphy.com') {
    const [_, gifs, nameAndId] = urlp.pathname.split('/')

    /*
     * nameAndId is a string that consists of the name (dash separated) and the id of the gif (the last part of the name)
     * We want to get the id of the gif, then direct to media.giphy.com/media/{id}/giphy.webp so we can
     * use it in an <Image> component
     */

    if (gifs === 'gifs' && nameAndId) {
      const gifId = nameAndId.split('-').pop()

      if (gifId) {
        return {
          type: 'giphy_gif',
          source: 'giphy',
          isGif: true,
          hideDetails: true,
          metaUri: `https://giphy.com/gifs/${gifId}`,
          playerUri: `https://i.giphy.com/media/${gifId}/200.webp`,
        }
      }
    }
  }

  // There are five possible hostnames that also can be giphy urls: media.giphy.com and media0-4.giphy.com
  // These can include (presumably) a tracking id in the path name, so we have to check for that as well
  if (giphyRegex.test(urlp.hostname)) {
    // We can link directly to the gif, if its a proper link
    const [_, media, trackingOrId, idOrFilename, filename] =
      urlp.pathname.split('/')

    if (media === 'media') {
      if (idOrFilename && gifFilenameRegex.test(idOrFilename)) {
        return {
          type: 'giphy_gif',
          source: 'giphy',
          isGif: true,
          hideDetails: true,
          metaUri: `https://giphy.com/gifs/${trackingOrId}`,
          playerUri: `https://i.giphy.com/media/${trackingOrId}/200.webp`,
        }
      } else if (filename && gifFilenameRegex.test(filename)) {
        return {
          type: 'giphy_gif',
          source: 'giphy',
          isGif: true,
          hideDetails: true,
          metaUri: `https://giphy.com/gifs/${idOrFilename}`,
          playerUri: `https://i.giphy.com/media/${idOrFilename}/200.webp`,
        }
      }
    }
  }

  // Finally, we should see if it is a link to i.giphy.com. These links don't necessarily end in .gif but can also
  // be .webp
  if (urlp.hostname === 'i.giphy.com' || urlp.hostname === 'www.i.giphy.com') {
    const [_, mediaOrFilename, filename] = urlp.pathname.split('/')

    if (mediaOrFilename === 'media' && filename) {
      const gifId = filename.split('.')[0]
      return {
        type: 'giphy_gif',
        source: 'giphy',
        isGif: true,
        hideDetails: true,
        metaUri: `https://giphy.com/gifs/${gifId}`,
        playerUri: `https://i.giphy.com/media/${gifId}/200.webp`,
      }
    } else if (mediaOrFilename) {
      const gifId = mediaOrFilename.split('.')[0]
      return {
        type: 'giphy_gif',
        source: 'giphy',
        isGif: true,
        hideDetails: true,
        metaUri: `https://giphy.com/gifs/${gifId}`,
        playerUri: `https://i.giphy.com/media/${
          mediaOrFilename.split('.')[0]
        }/200.webp`,
      }
    }
  }

  const tenorGif = parseTenorGif(urlp)
  if (tenorGif.success) {
    const {playerUri, dimensions} = tenorGif

    return {
      type: 'tenor_gif',
      source: 'tenor',
      isGif: true,
      hideDetails: true,
      playerUri,
      dimensions,
    }
  }
}

export function getGifDims(
  originalHeight: number,
  originalWidth: number,
  viewWidth: number,
) {
  const scaledHeight = (originalHeight / originalWidth) * viewWidth

  return {
    height: scaledHeight > 250 ? 250 : scaledHeight,
    width: (250 / scaledHeight) * viewWidth,
  }
}

export function getGiphyMetaUri(url: URL) {
  if (giphyRegex.test(url.hostname) || url.hostname === 'i.giphy.com') {
    const params = parseEmbedPlayerFromUrl(url.toString())
    if (params && params.type === 'giphy_gif') {
      return params.metaUri
    }
  }
}

export function parseTenorGif(urlp: URL):
  | {success: false}
  | {
      success: true
      playerUri: string
      dimensions: {height: number; width: number}
    } {
  if (urlp.hostname !== 'media.tenor.com') {
    return {success: false}
  }

  let [_, id, filename] = urlp.pathname.split('/')

  if (!id || !filename) {
    return {success: false}
  }

  if (!id.includes('AAAAC')) {
    return {success: false}
  }

  const h = urlp.searchParams.get('hh')
  const w = urlp.searchParams.get('ww')

  if (!h || !w) {
    return {success: false}
  }

  const dimensions = {
    height: Number(h),
    width: Number(w),
  }

  // if (isWeb) {
  //   id = id.replace('AAAAC', 'AAAP3')
  //   filename = filename.replace('.gif', '.webm')
  // } else {
  id = id.replace('AAAAC', 'AAAAM')
  // }

  return {
    success: true,
    playerUri: `https://t.gifs.bsky.app/${id}/${filename}`,
    dimensions,
  }
}

export function isTenorGifUri(url: URL | string) {
  try {
    return parseTenorGif(typeof url === 'string' ? new URL(url) : url).success
  } catch {
    // Invalid URL
    return false
  }
}
