import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyGraphDefs,
  AtpAgent,
  RichText,
} from '@atproto/api'

import {httpLogger} from '../logger.js'
import {getStarterPackImageUri} from '../util/getStarterPackImageUri.js'
import {getImage} from './getImage.js'

export type Metadata = {
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
  texts: Map<string, RichText>
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

export async function getPostData(
  post: AppBskyFeedDefs.PostView,
  agent: AtpAgent,
): Promise<PostData> {
  const images: Map<string, Metadata> = new Map()
  const texts: Map<string, RichText> = new Map()

  // console.log(JSON.stringify(post, null, 2))

  if (post.author.avatar) {
    images.set(post.author.avatar, {
      aspectRatio: {
        width: 1000,
        height: 1000,
      },
    })
  }

  if (AppBskyFeedPost.isRecord(post.record) && post.record.text) {
    texts.set(post.record.text, new RichText({text: post.record.text}))
  }

  if (post.embed) {
    if (AppBskyEmbedImages.isView(post.embed)) {
      // get OPs media
      for (const image of post.embed.images) {
        images.set(image.fullsize, {
          aspectRatio: normalizeAspectRatio(image.aspectRatio),
        })
      }
    }

    if (AppBskyEmbedExternal.isView(post.embed)) {
      if (post.embed.external.thumb) {
        images.set(post.embed.external.thumb, {
          aspectRatio: {
            width: 1200,
            height: 630,
          },
        })
      }
    }

    if (AppBskyEmbedRecord.isView(post.embed)) {
      if (AppBskyEmbedRecord.isViewRecord(post.embed.record)) {
        if (post.embed.record.author.avatar) {
          images.set(post.embed.record.author.avatar, {
            aspectRatio: {
              width: 1000,
              height: 1000,
            },
          })
        }

        for (const embed of post.embed.record.embeds) {
          if (AppBskyEmbedImages.isView(embed)) {
            for (const image of embed.images) {
              images.set(image.fullsize, {
                aspectRatio: normalizeAspectRatio(image.aspectRatio),
              })
            }
          }
          if (AppBskyEmbedExternal.isView(embed)) {
            if (embed.external.thumb) {
              images.set(embed.external.thumb, {
                aspectRatio: {
                  width: 1200,
                  height: 630,
                },
              })
            }
          }
          if (AppBskyEmbedRecordWithMedia.isView(embed)) {
            if (AppBskyEmbedImages.isView(embed.media)) {
              for (const image of embed.media.images) {
                images.set(image.fullsize, {
                  aspectRatio: normalizeAspectRatio(image.aspectRatio),
                })
              }
            } else if (AppBskyEmbedExternal.isView(embed.media)) {
              if (embed.media.external.thumb) {
                images.set(embed.media.external.thumb, {
                  aspectRatio: {
                    width: 1200,
                    height: 630,
                  },
                })
              }
            }
          }

          if (AppBskyGraphDefs.isListView(embed.record)) {
            if (embed.record.avatar) {
              images.set(embed.record.avatar, {
                aspectRatio: {
                  width: 1000,
                  height: 1000,
                },
              })
            }
          }

          if (AppBskyFeedDefs.isGeneratorView(embed.record)) {
            if (embed.record.avatar) {
              images.set(embed.record.avatar, {
                aspectRatio: {
                  width: 1000,
                  height: 1000,
                },
              })
            }
          }

          if (AppBskyGraphDefs.isStarterPackViewBasic(embed.record)) {
            const uri = getStarterPackImageUri(embed.record)
            images.set(uri, {
              aspectRatio: {
                width: 1200,
                height: 630,
              },
            })
          }
        }

        if (
          AppBskyFeedPost.isRecord(post.embed.record.value) &&
          post.embed.record.value.text
        ) {
          texts.set(
            post.embed.record.value.text,
            new RichText({text: post.embed.record.value.text}),
          )
        }
      }

      if (AppBskyGraphDefs.isListView(post.embed.record)) {
        if (post.embed.record.avatar) {
          images.set(post.embed.record.avatar, {
            aspectRatio: {
              width: 1000,
              height: 1000,
            },
          })
        }
      }

      if (AppBskyFeedDefs.isGeneratorView(post.embed.record)) {
        if (post.embed.record.avatar) {
          images.set(post.embed.record.avatar, {
            aspectRatio: {
              width: 1000,
              height: 1000,
            },
          })
        }
      }

      if (AppBskyGraphDefs.isStarterPackViewBasic(post.embed.record)) {
        const uri = getStarterPackImageUri(post.embed.record)
        images.set(uri, {
          aspectRatio: {
            width: 1200,
            height: 630,
          },
        })
      }
    }

    if (AppBskyEmbedRecordWithMedia.isView(post.embed)) {
      // get OPs media
      if (AppBskyEmbedImages.isView(post.embed.media)) {
        for (const image of post.embed.media.images) {
          images.set(image.fullsize, {
            aspectRatio: normalizeAspectRatio(image.aspectRatio),
          })
        }
      }

      if (AppBskyEmbedExternal.isView(post.embed.media)) {
        if (post.embed.media.external.thumb) {
          images.set(post.embed.media.external.thumb, {
            aspectRatio: {
              width: 1200,
              height: 630,
            },
          })
        }
      }

      // get media from embedded post
      if (AppBskyEmbedRecord.isViewRecord(post.embed.record.record)) {
        for (const embed of post.embed.record.record.embeds) {
          if (AppBskyEmbedImages.isView(embed)) {
            for (const image of embed.images) {
              images.set(image.fullsize, {
                aspectRatio: normalizeAspectRatio(image.aspectRatio),
              })
            }
          }
          if (AppBskyEmbedExternal.isView(embed)) {
            if (embed.external.thumb) {
              images.set(embed.external.thumb, {
                aspectRatio: {
                  width: 1200,
                  height: 630,
                },
              })
            }
          }
          if (AppBskyEmbedRecordWithMedia.isView(embed)) {
            if (AppBskyEmbedImages.isView(embed.media)) {
              for (const image of embed.media.images) {
                images.set(image.fullsize, {
                  aspectRatio: normalizeAspectRatio(image.aspectRatio),
                })
              }
            } else if (AppBskyEmbedExternal.isView(embed.media)) {
              if (embed.media.external.thumb) {
                images.set(embed.media.external.thumb, {
                  aspectRatio: {
                    width: 1200,
                    height: 630,
                  },
                })
              }
            }
          }
        }

        if (
          AppBskyFeedPost.isRecord(post.embed.record.record.value) &&
          post.embed.record.record.value.text
        ) {
          texts.set(
            post.embed.record.record.value.text,
            new RichText({text: post.embed.record.record.value.text}),
          )
        }
      }
    }
  }

  const deduped = Array.from(images.entries())
  const resolved = await Promise.all(
    deduped.map(async ([url, meta]) => {
      try {
        const image = await getImage(url)
        return [
          url,
          {
            ...meta,
            ...image,
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
  await Promise.all(Array.from(texts.values()).map(r => r.detectFacets(agent)))
  const extracted = resolved.filter(([, i]) => i.image !== null) as [
    string,
    Image,
  ][]

  return {
    images: new Map(extracted),
    texts,
  }
}
