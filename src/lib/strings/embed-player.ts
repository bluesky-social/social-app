import {Dimensions} from 'react-native'

import {isSafari} from '#/lib/browser'
import {isWeb} from '#/platform/detection'

const {height: SCREEN_HEIGHT} = Dimensions.get('window')

const IFRAME_HOST = isWeb
  ? // @ts-ignore only for web
    window.location.host === 'localhost:8100'
    ? 'http://localhost:8100'
    : 'https://bsky.app'
  : __DEV__ && !process.env.JEST_WORKER_ID
    ? 'http://localhost:8100'
    : 'https://bsky.app'

export const embedPlayerSources = [
  'youtube',
  'youtubeShorts',
  'twitch',
  'spotify',
  'soundcloud',
  'appleMusic',
  'vimeo',
  'giphy',
  'tenor',
  'flickr',
] as const

export type EmbedPlayerSource = (typeof embedPlayerSources)[number]

export type EmbedPlayerType =
  | 'youtube_video'
  | 'youtube_short'
  | 'twitch_video'
  | 'spotify_album'
  | 'spotify_playlist'
  | 'spotify_song'
  | 'soundcloud_track'
  | 'soundcloud_set'
  | 'apple_music_playlist'
  | 'apple_music_album'
  | 'apple_music_song'
  | 'vimeo_video'
  | 'giphy_gif'
  | 'tenor_gif'
  | 'flickr_album'

export const externalEmbedLabels: Record<EmbedPlayerSource, string> = {
  youtube: 'YouTube',
  youtubeShorts: 'YouTube Shorts',
  vimeo: 'Vimeo',
  twitch: 'Twitch',
  giphy: 'GIPHY',
  tenor: 'Tenor',
  spotify: 'Spotify',
  appleMusic: 'Apple Music',
  soundcloud: 'SoundCloud',
  flickr: 'Flickr',
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

  // youtube
  if (urlp.hostname === 'youtu.be') {
    const videoId = urlp.pathname.split('/')[1]
    const t = urlp.searchParams.get('t') ?? '0'
    const seek = encodeURIComponent(t.replace(/s$/, ''))

    if (videoId) {
      return {
        type: 'youtube_video',
        source: 'youtube',
        playerUri: `${IFRAME_HOST}/iframe/youtube.html?videoId=${videoId}&start=${seek}`,
      }
    }
  }
  if (
    urlp.hostname === 'www.youtube.com' ||
    urlp.hostname === 'youtube.com' ||
    urlp.hostname === 'm.youtube.com' ||
    urlp.hostname === 'music.youtube.com'
  ) {
    const [_, page, shortOrLiveVideoId] = urlp.pathname.split('/')

    const isShorts = page === 'shorts'
    const isLive = page === 'live'
    const videoId =
      isShorts || isLive
        ? shortOrLiveVideoId
        : (urlp.searchParams.get('v') as string)
    const t = urlp.searchParams.get('t') ?? '0'
    const seek = encodeURIComponent(t.replace(/s$/, ''))

    if (videoId) {
      return {
        type: isShorts ? 'youtube_short' : 'youtube_video',
        source: isShorts ? 'youtubeShorts' : 'youtube',
        hideDetails: isShorts ? true : undefined,
        playerUri: `${IFRAME_HOST}/iframe/youtube.html?videoId=${videoId}&start=${seek}`,
      }
    }
  }

  // twitch
  if (
    urlp.hostname === 'twitch.tv' ||
    urlp.hostname === 'www.twitch.tv' ||
    urlp.hostname === 'm.twitch.tv'
  ) {
    const parent = isWeb
      ? // @ts-ignore only for web
        window.location.hostname
      : 'localhost'

    const [_, channelOrVideo, clipOrId, id] = urlp.pathname.split('/')

    if (channelOrVideo === 'videos') {
      return {
        type: 'twitch_video',
        source: 'twitch',
        playerUri: `https://player.twitch.tv/?volume=0.5&!muted&autoplay&video=${clipOrId}&parent=${parent}`,
      }
    } else if (clipOrId === 'clip') {
      return {
        type: 'twitch_video',
        source: 'twitch',
        playerUri: `https://clips.twitch.tv/embed?volume=0.5&autoplay=true&clip=${id}&parent=${parent}`,
      }
    } else if (channelOrVideo) {
      return {
        type: 'twitch_video',
        source: 'twitch',
        playerUri: `https://player.twitch.tv/?volume=0.5&!muted&autoplay&channel=${channelOrVideo}&parent=${parent}`,
      }
    }
  }

  // spotify
  if (urlp.hostname === 'open.spotify.com') {
    const [_, typeOrLocale, idOrType, id] = urlp.pathname.split('/')

    if (idOrType) {
      if (typeOrLocale === 'playlist' || idOrType === 'playlist') {
        return {
          type: 'spotify_playlist',
          source: 'spotify',
          playerUri: `https://open.spotify.com/embed/playlist/${
            id ?? idOrType
          }`,
        }
      }
      if (typeOrLocale === 'album' || idOrType === 'album') {
        return {
          type: 'spotify_album',
          source: 'spotify',
          playerUri: `https://open.spotify.com/embed/album/${id ?? idOrType}`,
        }
      }
      if (typeOrLocale === 'track' || idOrType === 'track') {
        return {
          type: 'spotify_song',
          source: 'spotify',
          playerUri: `https://open.spotify.com/embed/track/${id ?? idOrType}`,
        }
      }
      if (typeOrLocale === 'episode' || idOrType === 'episode') {
        return {
          type: 'spotify_song',
          source: 'spotify',
          playerUri: `https://open.spotify.com/embed/episode/${id ?? idOrType}`,
        }
      }
      if (typeOrLocale === 'show' || idOrType === 'show') {
        return {
          type: 'spotify_song',
          source: 'spotify',
          playerUri: `https://open.spotify.com/embed/show/${id ?? idOrType}`,
        }
      }
    }
  }

  // soundcloud
  if (
    urlp.hostname === 'soundcloud.com' ||
    urlp.hostname === 'www.soundcloud.com'
  ) {
    const [_, user, trackOrSets, set] = urlp.pathname.split('/')

    if (user && trackOrSets) {
      if (trackOrSets === 'sets' && set) {
        return {
          type: 'soundcloud_set',
          source: 'soundcloud',
          playerUri: `https://w.soundcloud.com/player/?url=${url}&auto_play=true&visual=false&hide_related=true`,
        }
      }

      return {
        type: 'soundcloud_track',
        source: 'soundcloud',
        playerUri: `https://w.soundcloud.com/player/?url=${url}&auto_play=true&visual=false&hide_related=true`,
      }
    }
  }

  if (
    urlp.hostname === 'music.apple.com' ||
    urlp.hostname === 'music.apple.com'
  ) {
    // This should always have: locale, type (playlist or album), name, and id. We won't use spread since we want
    // to check if the length is correct
    const pathParams = urlp.pathname.split('/')
    const type = pathParams[2]
    const songId = urlp.searchParams.get('i')

    if (pathParams.length === 5 && (type === 'playlist' || type === 'album')) {
      // We want to append the songId to the end of the url if it exists
      const embedUri = `https://embed.music.apple.com${urlp.pathname}${
        urlp.search ? '?i=' + songId : ''
      }`

      if (type === 'playlist') {
        return {
          type: 'apple_music_playlist',
          source: 'appleMusic',
          playerUri: embedUri,
        }
      } else if (type === 'album') {
        if (songId) {
          return {
            type: 'apple_music_song',
            source: 'appleMusic',
            playerUri: embedUri,
          }
        } else {
          return {
            type: 'apple_music_album',
            source: 'appleMusic',
            playerUri: embedUri,
          }
        }
      }
    }
  }

  if (urlp.hostname === 'vimeo.com' || urlp.hostname === 'www.vimeo.com') {
    const [_, videoId] = urlp.pathname.split('/')
    if (videoId) {
      return {
        type: 'vimeo_video',
        source: 'vimeo',
        playerUri: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      }
    }
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

  // this is a standard flickr path! we can use the embedder for albums and groups, so validate the path
  if (urlp.hostname === 'www.flickr.com' || urlp.hostname === 'flickr.com') {
    let i = urlp.pathname.length - 1
    while (i > 0 && urlp.pathname.charAt(i) === '/') {
      --i
    }

    const path_components = urlp.pathname.slice(1, i + 1).split('/')
    if (path_components.length === 4) {
      // discard username - it's not relevant
      const [photos, _, albums, id] = path_components
      if (photos === 'photos' && albums === 'albums') {
        // this at least has the shape of a valid photo-album URL!
        return {
          type: 'flickr_album',
          source: 'flickr',
          playerUri: `https://embedr.flickr.com/photosets/${id}`,
        }
      }
    }

    if (path_components.length === 3) {
      const [groups, id, pool] = path_components
      if (groups === 'groups' && pool === 'pool') {
        return {
          type: 'flickr_album',
          source: 'flickr',
          playerUri: `https://embedr.flickr.com/groups/${id}`,
        }
      }
    }
    // not an album or a group pool, don't know what to do with this!
    return undefined
  }

  // link shortened flickr path
  if (urlp.hostname === 'flic.kr') {
    const b58alph = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
    let [_, type, idBase58Enc] = urlp.pathname.split('/')
    let id = 0n
    for (const char of idBase58Enc) {
      const nextIdx = b58alph.indexOf(char)
      if (nextIdx >= 0) {
        id = id * 58n + BigInt(nextIdx)
      } else {
        // not b58 encoded, ergo not a valid link to embed
        return undefined
      }
    }

    switch (type) {
      case 'go':
        const formattedGroupId = `${id}`
        return {
          type: 'flickr_album',
          source: 'flickr',
          playerUri: `https://embedr.flickr.com/groups/${formattedGroupId.slice(
            0,
            -2,
          )}@N${formattedGroupId.slice(-2)}`,
        }
      case 's':
        return {
          type: 'flickr_album',
          source: 'flickr',
          playerUri: `https://embedr.flickr.com/photosets/${id}`,
        }
      default:
        // we don't know what this is so we can't embed it
        return undefined
    }
  }
}

export function getPlayerAspect({
  type,
  hasThumb,
  width,
}: {
  type: EmbedPlayerParams['type']
  hasThumb: boolean
  width: number
}): {aspectRatio?: number; height?: number} {
  if (!hasThumb) return {aspectRatio: 16 / 9}

  switch (type) {
    case 'youtube_video':
    case 'twitch_video':
    case 'vimeo_video':
      return {aspectRatio: 16 / 9}
    case 'youtube_short':
      if (SCREEN_HEIGHT < 600) {
        return {aspectRatio: (9 / 16) * 1.75}
      } else {
        return {aspectRatio: (9 / 16) * 1.5}
      }
    case 'spotify_album':
    case 'apple_music_album':
    case 'apple_music_playlist':
    case 'spotify_playlist':
    case 'soundcloud_set':
      return {height: 380}
    case 'spotify_song':
      if (width <= 300) {
        return {height: 155}
      }
      return {height: 232}
    case 'soundcloud_track':
      return {height: 165}
    case 'apple_music_song':
      return {height: 150}
    default:
      return {aspectRatio: 16 / 9}
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

  if (isWeb) {
    if (isSafari) {
      id = id.replace('AAAAC', 'AAAP1')
      filename = filename.replace('.gif', '.mp4')
    } else {
      id = id.replace('AAAAC', 'AAAP3')
      filename = filename.replace('.gif', '.webm')
    }
  } else {
    id = id.replace('AAAAC', 'AAAAM')
  }

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
