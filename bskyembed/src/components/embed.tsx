import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyGraphDefs,
  AppBskyGraphStarterpack,
  AppBskyLabelerDefs,
} from '@atproto/api'
import {ComponentChildren, h} from 'preact'
import {useMemo} from 'preact/hooks'

import infoIcon from '../../assets/circleInfo_stroke2_corner0_rounded.svg'
import playIcon from '../../assets/play_filled_corner2_rounded.svg'
import starterPackIcon from '../../assets/starterPack.svg'
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
            className="transition-colors hover:bg-neutral-100 dark:hover:bg-slate-700 border dark:border-slate-600 rounded-lg p-2 gap-1.5 w-full flex flex-col">
            <div className="flex gap-1.5 items-center">
              <div className="w-4 h-4 overflow-hidden rounded-full bg-neutral-300 dark:bg-slate-700 shrink-0">
                <img
                  src={record.author.avatar}
                  style={isAuthorLabeled ? {filter: 'blur(1.5px)'} : undefined}
                />
              </div>
              <p className="line-clamp-1 text-sm">
                <span className="font-bold">{record.author.displayName}</span>
                <span className="text-textLight dark:text-textDimmed ml-1">
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
          <GenericWithImageEmbed
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
          <GenericWithImageEmbed
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
        // Embed type does not exist in the app, so show nothing
        return null
      }

      // Case 3.5: Starter pack
      if (AppBskyGraphDefs.isStarterPackViewBasic(record)) {
        return <StarterPackEmbed content={record} />
      }

      // Case 3.6: Post not found
      if (AppBskyEmbedRecord.isViewNotFound(record)) {
        return <Info>Quoted post not found, it may have been deleted.</Info>
      }

      // Case 3.7: Post blocked
      if (AppBskyEmbedRecord.isViewBlocked(record)) {
        return <Info>The quoted post is blocked.</Info>
      }

      // Case 3.8: Detached quote post
      if (AppBskyEmbedRecord.isViewDetached(record)) {
        // Just don't show anything
        return null
      }

      // Unknown embed type
      return null
    }

    // Case 4: Video
    if (AppBskyEmbedVideo.isView(content)) {
      return <VideoEmbed content={content} />
    }

    // Case 5: Record with media
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

    // Unknown embed type
    return null
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
      <p className="text-sm text-textLight dark:text-textDimmed">{children}</p>
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
      className="w-full rounded-lg overflow-hidden border dark:border-slate-600 flex flex-col items-stretch"
      disableTracking>
      {content.external.thumb && (
        <img
          src={content.external.thumb}
          className="aspect-[1.91/1] object-cover"
        />
      )}
      <div className="py-3 px-4">
        <p className="text-sm text-textLight dark:text-textDimmed line-clamp-1">
          {toNiceDomain(content.external.uri)}
        </p>
        <p className="font-semibold line-clamp-3">{content.external.title}</p>
        <p className="text-sm text-textLight dark:text-textDimmed line-clamp-2 mt-0.5">
          {content.external.description}
        </p>
      </div>
    </Link>
  )
}

function GenericWithImageEmbed({
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
      className="w-full rounded-lg border dark:border-slate-600 py-2 px-3 flex flex-col gap-2">
      <div className="flex gap-2.5 items-center">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-8 h-8 rounded-md bg-neutral-300 dark:bg-slate-700 shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-md bg-brand shrink-0" />
        )}
        <div className="flex-1">
          <p className="font-bold text-sm">{title}</p>
          <p className="text-textLight dark:text-textDimmed text-sm">
            {subtitle}
          </p>
        </div>
      </div>
      {description && (
        <p className="text-textLight dark:text-textDimmed text-sm">
          {description}
        </p>
      )}
    </Link>
  )
}

// just the thumbnail and a play button
function VideoEmbed({content}: {content: AppBskyEmbedVideo.View}) {
  let aspectRatio = 1

  if (content.aspectRatio) {
    const {width, height} = content.aspectRatio
    aspectRatio = clamp(width / height, 1 / 1, 3 / 1)
  }

  return (
    <div
      className="w-full overflow-hidden rounded-lg aspect-square relative"
      style={{aspectRatio: `${aspectRatio} / 1`}}>
      <img
        src={content.thumbnail}
        alt={content.alt}
        className="object-cover size-full"
      />
      <div className="size-24 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50 flex items-center justify-center">
        <img src={playIcon} className="object-cover size-3/5" />
      </div>
    </div>
  )
}

function StarterPackEmbed({
  content,
}: {
  content: AppBskyGraphDefs.StarterPackViewBasic
}) {
  if (!AppBskyGraphStarterpack.isRecord(content.record)) {
    return null
  }

  const starterPackHref = getStarterPackHref(content)
  const imageUri = getStarterPackImage(content)

  return (
    <Link
      href={starterPackHref}
      className="w-full rounded-lg overflow-hidden border dark:border-slate-600 flex flex-col items-stretch">
      <img src={imageUri} className="aspect-[1.91/1] object-cover" />
      <div className="py-3 px-4">
        <div className="flex space-x-2 items-center">
          <img src={starterPackIcon} className="w-10 h-10" />
          <div>
            <p className="font-semibold leading-[21px]">
              {content.record.name}
            </p>
            <p className="text-sm text-textLight dark:text-textDimmed line-clamp-2 leading-[18px]">
              Starter pack by{' '}
              {content.creator.displayName || `@${content.creator.handle}`}
            </p>
          </div>
        </div>
        {content.record.description && (
          <p className="text-sm mt-1">{content.record.description}</p>
        )}
        {!!content.joinedAllTimeCount && content.joinedAllTimeCount > 50 && (
          <p className="text-sm font-semibold text-textLight dark:text-textDimmed mt-1">
            {content.joinedAllTimeCount} users have joined!
          </p>
        )}
      </div>
    </Link>
  )
}

// from #/lib/strings/starter-pack.ts
function getStarterPackImage(starterPack: AppBskyGraphDefs.StarterPackView) {
  const rkey = getRkey({uri: starterPack.uri})
  return `https://ogcard.cdn.bsky.app/start/${starterPack.creator.did}/${rkey}`
}

function getStarterPackHref(
  starterPack: AppBskyGraphDefs.StarterPackViewBasic,
) {
  const rkey = getRkey({uri: starterPack.uri})
  const handleOrDid = starterPack.creator.handle || starterPack.creator.did
  return `/starter-pack/${handleOrDid}/${rkey}`
}

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(num, max))
}
