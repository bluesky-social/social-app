export const getYoutubeVideoId = (link: string): string | undefined => {
  let url
  try {
    url = new URL(link)
  } catch (e) {
    return undefined
  }

  if (
    url.hostname !== 'www.youtube.com' &&
    url.hostname !== 'youtube.com' &&
    url.hostname !== 'youtu.be'
  ) {
    return undefined
  }
  if (url.hostname === 'youtu.be') {
    const videoId = url.pathname.split('/')[1]
    if (!videoId) {
      return undefined
    }
    return videoId
  }
  const videoId = url.searchParams.get('v') as string
  if (!videoId) {
    return undefined
  }
  return videoId
}
