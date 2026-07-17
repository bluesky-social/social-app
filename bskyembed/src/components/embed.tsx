import {app} from '@bsky.app/sdk/lexicons'
import {ComponentChildren, h} from 'preact'
import {useMemo} from 'preact/hooks'

import {Link} from '#/components/link'
import {VerificationCheck} from '#/components/verification-check'
import {Globe} from '#/icons/Globe'
import {CONTENT_LABELS, labelsToInfo} from '#/labels'
import {getRkey} from '#/util/rkey'
import {getVerificationState} from '#/util/verification-state'

import infoIcon from '../../assets/arrowBottom_stroke2_corner0_rounded.svg'
import playIcon from '../../assets/play_filled_corner0_rounded.svg'
import starterPackIcon from '../../assets/starterPack.svg'

export function Embed({
  content,
  labels,
  hideRecord,
}: {
  content: app.bsky.feed.defs.PostView['embed']
  labels: app.bsky.feed.defs.PostView['labels']
  hideRecord?: boolean
}) {
  const labelInfo = useMemo(() => labelsToInfo(labels), [labels])

  if (!content) return null

  try {
    // Case 1: Image
    if (app.bsky.embed.images.view.isTypeOf(content)) {
      return <ImageEmbed content={content} labelInfo={labelInfo} />
    }

    // Case 1b: Gallery (Photos v2)
    if (app.bsky.embed.gallery.view.isTypeOf(content)) {
      return <GalleryEmbed content={content} labelInfo={labelInfo} />
    }

    // Case 2: External link
    if (app.bsky.embed.external.view.isTypeOf(content)) {
      return <ExternalEmbed content={content} labelInfo={labelInfo} />
    }

    // Case 3: Record (quote or linked post)
    if (app.bsky.embed.record.view.isTypeOf(content)) {
      if (hideRecord) {
        return null
      }

      const record = content.record

      // Case 3.1: Post
      if (app.bsky.embed.record.viewRecord.isTypeOf(record)) {
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
        const validation = app.bsky.feed.post.$safeValidate(record.value)
        if (validation.success) {
          text = validation.value.text
        }

        const isAuthorLabeled = record.author.labels?.some(label =>
          CONTENT_LABELS.includes(label.val),
        )

        const verification = getVerificationState({profile: record.author})

        return (
          <Link
            href={`/profile/${record.author.did}/post/${getRkey(record)}`}
            className="transition-colors hover:bg-blue-50 dark:hover:bg-slate-900 border dark:border-slate-600 rounded-xl p-2 gap-1.5 w-full flex flex-col">
            <div className="flex gap-1.5 items-center">
              <div className="w-4 h-4 rounded-full bg-neutral-300 dark:bg-slate-900 shrink-0">
                <img
                  className="rounded-full"
                  src={record.author.avatar}
                  style={isAuthorLabeled ? {filter: 'blur(1.5px)'} : undefined}
                />
              </div>
              <div className="flex flex-1 items-center shrink min-w-0 min-h-0">
                <p className="text-sm shrink-0 font-semibold max-w-[70%] truncate">
                  {record.author.displayName?.trim() || record.author.handle}
                </p>
                {verification.isVerified && (
                  <VerificationCheck
                    className="ml-[3px] mt-px shrink-0 self-center"
                    verifier={verification.role === 'verifier'}
                    size={12}
                  />
                )}
                <p className="text-sm text-textLight dark:text-textDimmed min-w-0 truncate ml-1">
                  @{record.author.handle}
                </p>
              </div>
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
      if (app.bsky.graph.defs.listView.isTypeOf(record)) {
        if (labelInfo) {
          return <Info>{labelInfo}</Info>
        }
        return (
          <GenericWithImageEmbed
            image={record.avatar}
            title={record.name}
            href={`/profile/${record.creator.did}/lists/${getRkey(record)}`}
            subtitle={
              record.purpose === app.bsky.graph.defs.modlist.value
                ? `Moderation list by @${record.creator.handle}`
                : `User list by @${record.creator.handle}`
            }
            description={record.description}
          />
        )
      }

      // Case 3.3: Feed
      if (app.bsky.feed.defs.generatorView.isTypeOf(record)) {
        if (labelInfo) {
          return <Info>{labelInfo}</Info>
        }
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
      if (app.bsky.labeler.defs.labelerView.isTypeOf(record)) {
        // Embed type does not exist in the app, so show nothing
        return null
      }

      // Case 3.5: Starter pack
      if (app.bsky.graph.defs.starterPackViewBasic.isTypeOf(record)) {
        return <StarterPackEmbed content={record} />
      }

      // Case 3.6: Post not found
      if (app.bsky.embed.record.viewNotFound.isTypeOf(record)) {
        return <Info>Quoted post not found, it may have been deleted.</Info>
      }

      // Case 3.7: Post blocked
      if (app.bsky.embed.record.viewBlocked.isTypeOf(record)) {
        return <Info>The quoted post is blocked.</Info>
      }

      // Case 3.8: Detached quote post
      if (app.bsky.embed.record.viewDetached.isTypeOf(record)) {
        // Just don't show anything
        return null
      }

      // Unknown embed type
      return null
    }

    // Case 4: Video
    if (app.bsky.embed.video.view.isTypeOf(content)) {
      return <VideoEmbed content={content} />
    }

    // Case 5: Record with media
    if (
      app.bsky.embed.recordWithMedia.view.isTypeOf(content) &&
      app.bsky.embed.record.viewRecord.isTypeOf(content.record.record)
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
    <div className="w-full rounded-xl border py-2 px-2.5 flex-row flex gap-2 hover:bg-blue-50 dark:border-slate-600 dark:hover:bg-slate-900">
      <img src={infoIcon} className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-sm text-textLight dark:text-textDimmed">{children}</p>
    </div>
  )
}

type GridImage = {thumb: string; alt: string}

function ImageEmbed({
  content,
  labelInfo,
}: {
  content: app.bsky.embed.images.View
  labelInfo?: string
}) {
  if (labelInfo) {
    return <Info>{labelInfo}</Info>
  }
  return (
    <ImageGrid
      images={content.images.map(i => ({thumb: i.thumb, alt: i.alt}))}
    />
  )
}

function GalleryEmbed({
  content,
  labelInfo,
}: {
  content: app.bsky.embed.gallery.View
  labelInfo?: string
}) {
  if (labelInfo) {
    return <Info>{labelInfo}</Info>
  }
  const images = content.items
    .filter(i => app.bsky.embed.gallery.viewImage.isTypeOf(i))
    .map(i => ({thumb: i.thumbnail, alt: i.alt}))
  return <ImageGrid images={images} />
}

function ImageGrid({images}: {images: GridImage[]}) {
  switch (images.length) {
    case 0:
      return null
    case 1:
      return (
        <img
          src={images[0].thumb}
          alt={images[0].alt}
          className="w-full rounded-xl overflow-hidden object-cover h-auto max-h-[1000px]"
        />
      )
    case 2:
      return (
        <div className="flex gap-1 rounded-xl overflow-hidden w-full aspect-2/1">
          {images.map((image, i) => (
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
        <div className="flex gap-1 rounded-xl overflow-hidden w-full aspect-2/1">
          <div className="flex-1 aspect-square">
            <img
              src={images[0].thumb}
              alt={images[0].alt}
              className="w-full h-full object-cover rounded-sm"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            {images.slice(1).map((image, i) => (
              <img
                key={i}
                src={image.thumb}
                alt={image.alt}
                className="flex-1 object-cover rounded-sm min-h-0"
              />
            ))}
          </div>
        </div>
      )
    default: {
      const remaining = images.length - 4
      return (
        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
          {images.slice(0, 4).map((image, i) => {
            const isOverflowCell = i === 3 && remaining > 0
            return (
              <div
                key={i}
                className="relative aspect-3/2 rounded-sm overflow-hidden">
                <img
                  src={image.thumb}
                  alt={image.alt}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {isOverflowCell && (
                  <div
                    aria-label={`+${remaining} more image${remaining === 1 ? '' : 's'}, view post to see all`}
                    className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-white text-2xl font-semibold">
                      +{remaining}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )
    }
  }
}

function ExternalEmbed({
  content,
  labelInfo,
}: {
  content: app.bsky.embed.external.View
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
      className="w-full rounded-xl overflow-hidden border dark:border-slate-600 flex flex-col items-stretch"
      disableTracking>
      {content.external.thumb && (
        <img
          src={content.external.thumb}
          className="aspect-1200/630 object-cover"
        />
      )}
      <div className="py-3 px-4">
        <p className="font-semibold leading-tight line-clamp-3">
          {content.external.title}
        </p>
        <p className="text-sm leading-snug text-textLight dark:text-textDimmed line-clamp-2 mt-0.5">
          {content.external.description}
        </p>
        <div className="flex flex-row items-end gap-1 border-t dark:border-slate-600 mt-1 pt-1.5">
          <Globe size={12} className="text-textLight dark:text-textDimmed" />
          <p className="text-sm leading-none text-textLight dark:text-textDimmed line-clamp-1">
            {toNiceDomain(content.external.uri)}
          </p>
        </div>
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
      className="w-full rounded-xl border dark:border-slate-600 py-2 px-3 flex flex-col gap-2">
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
          <p className="font-semibold text-sm">{title}</p>
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

function VideoEmbed({content}: {content: app.bsky.embed.video.View}) {
  let aspectRatio = 1

  if (content.aspectRatio) {
    const {width, height} = content.aspectRatio
    aspectRatio = clamp(width / height, 1 / 1, 3 / 1)
  }

  const supportsHls = useMemo(() => {
    const video = document.createElement('video')
    return video.canPlayType('application/vnd.apple.mpegurl') !== ''
  }, [])

  if (supportsHls) {
    return (
      <video
        src={content.playlist}
        poster={content.thumbnail}
        controls
        playsinline
        preload="metadata"
        // @ts-expect-error https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video#loading
        loading="lazy"
        aria-label={content.alt || undefined}
        onClickCapture={evt => evt.stopPropagation()}
        className="w-full rounded-xl bg-black"
        style={{aspectRatio: `${aspectRatio} / 1`}}
      />
    )
  }

  return (
    <div
      className="w-full overflow-hidden rounded-xl aspect-square relative"
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
  content: app.bsky.graph.defs.StarterPackViewBasic
}) {
  const validation = app.bsky.graph.starterpack.$safeValidate(content.record)
  if (!validation.success) {
    return null
  }
  const record = validation.value

  const starterPackHref = getStarterPackHref(content)
  const imageUri = getStarterPackImage(content)

  return (
    <Link
      href={starterPackHref}
      className="w-full rounded-xl overflow-hidden border dark:border-slate-600 flex flex-col items-stretch">
      <img src={imageUri} className="aspect-1200/630 object-cover" />
      <div className="py-3 px-4">
        <div className="flex space-x-2 items-center">
          <img src={starterPackIcon} className="w-10 h-10" />
          <div>
            <p className="font-semibold leading-[21px]">{record.name}</p>
            <p className="text-sm text-textLight dark:text-textDimmed line-clamp-2 leading-[18px]">
              Starter pack by{' '}
              {content.creator.displayName || `@${content.creator.handle}`}
            </p>
          </div>
        </div>
        {record.description && (
          <p className="text-sm mt-1">{record.description}</p>
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
function getStarterPackImage(
  starterPack: app.bsky.graph.defs.StarterPackViewBasic,
) {
  const rkey = getRkey({uri: starterPack.uri})
  return `https://ogcard.cdn.bsky.app/start/${starterPack.creator.did}/${rkey}`
}

function getStarterPackHref(
  starterPack: app.bsky.graph.defs.StarterPackViewBasic,
) {
  const rkey = getRkey({uri: starterPack.uri})
  const handleOrDid = starterPack.creator.handle || starterPack.creator.did
  return `/starter-pack/${handleOrDid}/${rkey}`
}

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(num, max))
}
