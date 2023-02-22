export const extractYoutubeMeta = (html: string): Record<string, string> => {
  const res: Record<string, string> = {}
  const youtubeTitleRegex = /"videoDetails":.*"title":"([^"]*)"/i
  const youtubeDescriptionRegex =
    /"videoDetails":.*"shortDescription":"([^"]*)"/i
  const youtubeThumbnailRegex = /"videoDetails":.*"url":"(.*)(default\.jpg)/i
  const youtubeAvatarRegex =
    /"avatar":{"thumbnails":\[{.*?url.*?url.*?url":"([^"]*)"/i
  const youtubeTitleMatch = youtubeTitleRegex.exec(html)
  const youtubeDescriptionMatch = youtubeDescriptionRegex.exec(html)
  const youtubeThumbnailMatch = youtubeThumbnailRegex.exec(html)
  const youtubeAvatarMatch = youtubeAvatarRegex.exec(html)

  if (youtubeTitleMatch && youtubeTitleMatch.length >= 1) {
    res.title = decodeURI(youtubeTitleMatch[1])
  }
  if (youtubeDescriptionMatch && youtubeDescriptionMatch.length >= 1) {
    res.description = decodeURI(youtubeDescriptionMatch[1]).replace(
      /\\n/g,
      '\n',
    )
  }
  if (youtubeThumbnailMatch && youtubeThumbnailMatch.length >= 2) {
    res.image = youtubeThumbnailMatch[1] + 'default.jpg'
  }
  if (!res.image && youtubeAvatarMatch && youtubeAvatarMatch.length >= 1) {
    res.image = youtubeAvatarMatch[1]
  }

  return res
}
