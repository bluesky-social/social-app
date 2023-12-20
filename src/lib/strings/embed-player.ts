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
        playerUri: `https://www.youtube.com/embed/${videoId}`,
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
        playerUri: `https://www.youtube.com/embed/${videoId}`,
      }
    }
  }

  // twitch
  if (urlp.hostname === 'twitch.tv' || urlp.hostname === 'www.twitch.tv') {
    const parts = urlp.pathname.split('/')
    if (parts.length === 2 && parts[1]) {
      return {
        type: 'twitch_live',
        channelId: parts[1],
        playerUri: `https://player.twitch.tv/?volume=0.5&!muted&autoplay&channel=${parts[1]}&parent=localhost`,
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
}
