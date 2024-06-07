import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyGraphDefs,
  AppBskyLabelerDefs,
} from '@atproto/api'
import {ComponentChildren, h} from 'preact'
import {useMemo} from 'preact/hooks'

import infoIcon from '../../assets/circleInfo_stroke2_corner0_rounded.svg'
import {CONTENT_LABELS, labelsToInfo} from '../labels'
import {getRkey} from '../utils'
import {Link} from './link'

export function Embed({
  content,
  labels,
  hideRecord,
}: {
  content: AppBskyFeedDefs.PostView['embed']
  labels: AppBskyFeedDefs.PostView['labels']
  hideRecord?: boolean
}) {
  const labelInfo = useMemo(() => labelsToInfo(labels), [labels])

  if (!content) return null

  try {
    // Case 1: Image
    if (AppBskyEmbedImages.isView(content)) {
      return <ImageEmbed content={content} labelInfo={labelInfo} />
    }

    // Case 2: External link
    if (AppBskyEmbedExternal.isView(content)) {
      return <ExternalEmbed content={content} labelInfo={labelInfo} />
    }

    // Case 3: Record (quote or linked post)
    if (AppBskyEmbedRecord.isView(content)) {
      if (hideRecord) {
        return null
      }

      const record = content.record

      // Case 3.1: Post
      if (AppBskyEmbedRecord.isViewRecord(record)) {
        const pwiOptOut = !!record.author.labels?.find(
          label => label.val === '!no-unauthenticated',
        )
        if (pwiOptOut) {
          return (
            <Info>
              The author of the quoted post has requested their posts not be
              displayed on external sites.
            </Info>
          )
        }

        let text
        if (AppBskyFeedPost.isRecord(record.value)) {
          text = record.value.text
        }

        const isAuthorLabeled = record.author.labels?.some(label =>
          CONTENT_LABELS.includes(label.val),
        )

        return (
          <Link
            href={`/profile/${record.author.did}/post/${getRkey(record)}`}
            className="transition-colors hover:bg-neutral-100 border rounded-lg p-2 gap-1.5 w-full flex flex-col">
            <div className="flex gap-1.5 items-center">
              <div className="w-4 h-4 overflow-hidden rounded-full bg-neutral-300 shrink-0">
                <img
                  src={record.author.avatar}
                  style={isAuthorLabeled ? {filter: 'blur(1.5px)'} : undefined}
                />
              </div>
              <p className="line-clamp-1 text-sm">
                <span className="font-bold">{record.author.displayName}</span>
                <span className="text-textLight ml-1">
                  @{record.author.handle}
                </span>
              </p>
            </div>
            {text && <p className="text-sm">{text}</p>}
            {record.embeds?.map(embed => (
              <Embed
                key={embed.$type}
                content={embed}
                labels={record.labels}
                hideRecord
              />
            ))}
          </Link>
        )
      }

      // Case 3.2: List
      if (AppBskyGraphDefs.isListView(record)) {
        return (
          <GenericWithImage
            image={record.avatar}
            title={record.name}
            href={`/profile/${record.creator.did}/lists/${getRkey(record)}`}
            subtitle={
              record.purpose === AppBskyGraphDefs.MODLIST
                ? `Moderation list by @${record.creator.handle}`
                : `User list by @${record.creator.handle}`
            }
            description={record.description}
          />
        )
      }

      // Case 3.3: Feed
      if (AppBskyFeedDefs.isGeneratorView(record)) {
        return (
          <GenericWithImage
            image={record.avatar}
            title={record.displayName}
            href={`/profile/${record.creator.did}/feed/${getRkey(record)}`}
            subtitle={`Feed by @${record.creator.handle}`}
            description={`Liked by ${record.likeCount ?? 0} users`}
          />
        )
      }

      // Case 3.4: Labeler
      if (AppBskyLabelerDefs.isLabelerView(record)) {
        return (
          <GenericWithImage
            image={record.creator.avatar}
            title={record.creator.displayName || record.creator.handle}
            href={`/profile/${record.creator.did}`}
            subtitle="Labeler"
            description={`Liked by ${record.likeCount ?? 0} users`}
          />
        )
      }

      // Case 3.5: Post not found
      if (AppBskyEmbedRecord.isViewNotFound(record)) {
        return <Info>Quoted post not found, it may have been deleted.</Info>
      }

      // Case 3.6: Post blocked
      if (AppBskyEmbedRecord.isViewBlocked(record)) {
        return <Info>The quoted post is blocked.</Info>
      }

      throw new Error('Unknown embed type')
    }

    // Case 4: Record with media
    if (
      AppBskyEmbedRecordWithMedia.isView(content) &&
      AppBskyEmbedRecord.isViewRecord(content.record.record)
    ) {
      return (
        <div className="flex flex-col gap-2">
          <Embed
            content={content.media}
            labels={labels}
            hideRecord={hideRecord}
          />
          <Embed
            content={{
              $type: 'app.bsky.embed.record#view',
              record: content.record.record,
            }}
            labels={content.record.record.labels}
            hideRecord={hideRecord}
          />
        </div>
      )
    }

    throw new Error('Unsupported embed type')
  } catch (err) {
    return (
      <Info>{err instanceof Error ? err.message : 'An error occurred'}</Info>
    )
  }
}

function Info({children}: {children: ComponentChildren}) {
  return (
    <div className="w-full rounded-lg border py-2 px-2.5 flex-row flex gap-2 bg-neutral-50">
      <img src={infoIcon} className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-sm text-textLight">{children}</p>
    </div>
  )
}

function ImageEmbed({
  content,
  labelInfo,
}: {
  content: AppBskyEmbedImages.View
  labelInfo?: string
}) {
  if (labelInfo) {
    return <Info>{labelInfo}</Info>
  }

  switch (content.images.length) {
    case 1:
      return (
        <img
          src={content.images[0].thumb}
          alt={content.images[0].alt}
          className="w-full rounded-lg overflow-hidden object-cover h-auto max-h-[1000px]"
        />
      )
    case 2:
      return (
        <div className="flex gap-1 rounded-lg overflow-hidden w-full aspect-[2/1]">
          {content.images.map((image, i) => (
            <img
              key={i}
              src={image.thumb}
              alt={image.alt}
              className="w-1/2 h-full object-cover rounded-sm"
            />
          ))}
        </div>
      )
    case 3:
      return (
        <div className="flex gap-1 rounded-lg overflow-hidden w-full aspect-[2/1]">
          <img
            src={content.images[0].thumb}
            alt={content.images[0].alt}
            className="flex-[3] object-cover rounded-sm"
          />
          <div className="flex flex-col gap-1 flex-[2]">
            {content.images.slice(1).map((image, i) => (
              <img
                key={i}
                src={image.thumb}
                alt={image.alt}
                className="w-full h-full object-cover rounded-sm"
              />
            ))}
          </div>
        </div>
      )
    case 4:
      return (
        <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
          {content.images.map((image, i) => (
            <img
              key={i}
              src={image.thumb}
              alt={image.alt}
              className="aspect-square w-full object-cover rounded-sm"
            />
          ))}
        </div>
      )
    default:
      return null
  }
}

function ExternalEmbed({
  content,
  labelInfo,
}: {
  content: AppBskyEmbedExternal.View
  labelInfo?: string
}) {
  function toNiceDomain(url: string): string {
    try {
      const urlp = new URL(url)
      return urlp.host ? urlp.host : url
    } catch (e) {
      return url
    }
  }

  if (labelInfo) {
    return <Info>{labelInfo}</Info>
  }

  return (
    <Link
      href={content.external.uri}
      className="w-full rounded-lg overflow-hidden border flex flex-col items-stretch"
      disableTracking>
      {content.external.thumb && (
        <img
          src={content.external.thumb}
          className="aspect-[1.91/1] object-cover"
        />
      )}
      <div className="py-3 px-4">
        <p className="text-sm text-textLight line-clamp-1">
          {toNiceDomain(content.external.uri)}
        </p>
        <p className="font-semibold line-clamp-3">{content.external.title}</p>
        <p className="text-sm text-textLight line-clamp-2 mt-0.5">
          {content.external.description}
        </p>
      </div>
    </Link>
  )
}

function GenericWithImage({
  title,
  subtitle,
  href,
  image,
  description,
}: {
  title: string
  subtitle: string
  href: string
  image?: string
  description?: string
}) {
  return (
    <Link
      href={href}
      className="w-full rounded-lg border py-2 px-3 flex flex-col gap-2">
      <div className="flex gap-2.5 items-center">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-8 h-8 rounded-md bg-neutral-300 shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-md bg-brand shrink-0" />
        )}
        <div className="flex-1">
          <p className="font-bold text-sm">{title}</p>
          <p className="text-textLight text-sm">{subtitle}</p>
        </div>
      </div>
      {description && <p className="text-textLight text-sm">{description}</p>}
    </Link>
  )
}
