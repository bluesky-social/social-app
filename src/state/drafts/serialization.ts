import {type ComposerState} from '#/view/com/composer/state/composer'
import {type ComposerDraft} from '#/storage'

type SerializedImage = {
  alt: string
  path: string
  width: number
  height: number
  mime: string
}

type SerializedVideo = {
  blobRef: unknown
  width: number
  height: number
  mimeType: string
  altText: string
}

export function serializeDraft(state: ComposerState): ComposerDraft {
  return {
    version: 1,
    timestamp: Date.now(),
    thread: {
      posts: state.thread.posts.map(post => {
        const media = post.embed.media
        let images: SerializedImage[] | undefined
        let gif:
          | {id: string; media_formats: unknown; title: string; alt: string}
          | undefined
        let video: SerializedVideo | undefined

        if (media?.type === 'images') {
          images = media.images.map(img => ({
            alt: img.alt,
            path: img.source.path,
            width: img.source.width,
            height: img.source.height,
            mime: img.source.mime,
          }))
        } else if (media?.type === 'gif') {
          gif = {
            id: media.gif.id,
            media_formats: media.gif.media_formats,
            title: media.gif.title,
            alt: media.alt,
          }
        } else if (media?.type === 'video') {
          if (media.video.status === 'done') {
            video = {
              blobRef: media.video.pendingPublish.blobRef,
              width: media.video.asset.width,
              height: media.video.asset.height,
              mimeType: media.video.asset.mimeType || 'video/mp4',
              altText: media.video.altText,
            }
          }
        }

        return {
          id: post.id,
          text: post.richtext.text,
          labels: post.labels,
          embed: {
            quoteUri: post.embed.quote?.uri,
            linkUri: post.embed.link?.uri,
            images,
            gif,
            video,
          },
        }
      }),
      postgate: state.thread.postgate,
      threadgate: state.thread.threadgate,
    },
    activePostIndex: state.activePostIndex,
  }
}
