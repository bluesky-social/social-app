import {Platform} from 'react-native'

export type EmbedPlayerParams =
  | {type: 'youtube_video'; videoId: string; playerUri: string}
  | {type: 'twitch_live'; channelId: string; playerUri: string}
  | {type: 'spotify_album'; albumId: string; playerUri: string}
  | {
      type: 'spotify_playlist'
      playlistId: string
      playerUri: string
    }
  | {type: 'spotify_song'; songId: string; playerUri: string}
  | {type: 'soundcloud_track'; user: string; track: string; playerUri: string}
  | {type: 'soundcloud_set'; user: string; set: string; playerUri: string}
  | {type: 'apple_music_playlist'; playlistId: string; playerUri: string}
  | {type: 'apple_music_album'; albumId: string; playerUri: string}
  | {type: 'apple_music_song'; songId: string; playerUri: string}
  | {type: 'vimeo_video'; videoId: string; playerUri: string}
  | {type: 'gif'; playerUri: string}

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
    if (videoId) {
      return {
        type: 'youtube_video',
        videoId,
        playerUri: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
      }
    }
  }
  if (urlp.hostname === 'www.youtube.com' || urlp.hostname === 'youtube.com') {
    const [_, page, shortVideoId] = urlp.pathname.split('/')
    const videoId =
      page === 'shorts' ? shortVideoId : (urlp.searchParams.get('v') as string)

    if (videoId) {
      return {
        type: 'youtube_video',
        videoId,
        playerUri: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
      }
    }
  }

  // twitch
  if (urlp.hostname === 'twitch.tv' || urlp.hostname === 'www.twitch.tv') {
    const parent =
      Platform.OS === 'web' ? window.location.hostname : 'localhost'

    const parts = urlp.pathname.split('/')
    if (parts.length === 2 && parts[1]) {
      return {
        type: 'twitch_live',
        channelId: parts[1],
        playerUri: `https://player.twitch.tv/?volume=0.5&!muted&autoplay&channel=${parts[1]}&parent=${parent}`,
      }
    }
  }

  // spotify
  if (urlp.hostname === 'open.spotify.com') {
    const [_, type, id] = urlp.pathname.split('/')
    if (type && id) {
      if (type === 'playlist') {
        return {
          type: 'spotify_playlist',
          playlistId: id,
          playerUri: `https://open.spotify.com/embed/playlist/${id}`,
        }
      }
      if (type === 'album') {
        return {
          type: 'spotify_album',
          albumId: id,
          playerUri: `https://open.spotify.com/embed/album/${id}`,
        }
      }
      if (type === 'track') {
        return {
          type: 'spotify_song',
          songId: id,
          playerUri: `https://open.spotify.com/embed/track/${id}`,
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
          user,
          set: set,
          playerUri: `https://w.soundcloud.com/player/?url=${url}&auto_play=true&visual=false&hide_related=true`,
        }
      }

      return {
        type: 'soundcloud_track',
        user,
        track: trackOrSets,
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
      const embedUri = `https://embed.music.apple.com${urlp.pathname}${
        urlp.search ? '?i=' + songId : ''
      }`

      if (type === 'playlist') {
        return {
          type: 'apple_music_playlist',
          playlistId: pathParams[4],
          playerUri: embedUri,
        }
      } else if (type === 'album') {
        if (songId) {
          return {
            type: 'apple_music_song',
            songId,
            playerUri: embedUri,
          }
        } else {
          return {
            type: 'apple_music_album',
            albumId: pathParams[4],
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
        videoId,
        playerUri: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      }
    }
  }

  if (urlp.hostname === 'giphy.com' || urlp.hostname === 'www.giphy.com') {
    const [_, gifs, nameAndId] = urlp.pathname.split('/')
    /*
     * nameAndId is a string that consists of the name (dash separated) and the id of the gif (the last part of the name)
     * We want to get the id of the gif, then direct to media.giphy.com/media/{id}/giphy.gif so we can
     * use it in an <Image> component
     */
    if (gifs === 'gifs' && nameAndId) {
      const id = nameAndId.split('-').pop()

      if (id) {
        return {
          type: 'gif',
          playerUri: `https://i.giphy.com/media/${id}/giphy.webp`,
        }
      }
    }
  }

  if (urlp.hostname === 'tenor.com' || urlp.hostname === 'www.tenor.com') {
    const [_, path, filename] = urlp.pathname.split('/')

    if (path === 'view' && filename) {
      const includesExt = filename.split('.').pop() === 'gif'

      return {
        type: 'gif',
        playerUri: `${url}${!includesExt ? '.gif' : ''}`,
      }
    }
  }
}

export function getPlayerHeight({
  type,
  width,
  hasThumb,
}: {
  type: EmbedPlayerParams['type']
  width: number
  hasThumb: boolean
}) {
  if (!hasThumb) return (width / 16) * 9

  switch (type) {
    case 'youtube_video':
    case 'twitch_live':
    case 'vimeo_video':
      return (width / 16) * 9
    case 'spotify_album':
      return 380
    case 'spotify_playlist':
      return 360
    case 'spotify_song':
      if (width <= 300) {
        return 180
      }
      return 232
    case 'soundcloud_track':
      return 165
    case 'soundcloud_set':
      return 360
    case 'apple_music_song':
      return 150
    default:
      return width
  }
}

export function getGifHeight(
  originalHeight: number,
  originalWidth: number,
  viewWidth: number,
) {
  return (originalHeight / originalWidth) * viewWidth
}
