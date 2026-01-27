import {parseEmbedPlayerFromUrl} from '#/lib/strings/embed-player'
import {type Embed as TEmbed} from '#/types/bsky/post'

/**
 * Check if an embed contains media (images, video, or GIF)
 */
export function embedHasMedia(embed: TEmbed | undefined): boolean {
  if (!embed) return false
  return (
    embed.type === 'images' ||
    embed.type === 'video' ||
    (embed.type === 'link' &&
      !!parseEmbedPlayerFromUrl(embed.view.external.uri)?.isGif) ||
    (embed.type === 'post_with_media' && embedHasMedia(embed.media))
  )
}
