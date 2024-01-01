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
    default:
      return width
  }
}
