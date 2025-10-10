import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyRichtextFacet,
  RichText,
} from '@atproto/api'
import {h} from 'preact'

import likeIcon from '../../assets/heart_stroke2_corner0_rounded.svg'
import logo from '../../assets/logo_full_name.svg'
import replyIcon from '../../assets/reply_unfilled_stroke2_corner0_rounded.svg'
import repostIcon from '../../assets/repost_unfilled_stroke2_corner0_rounded.svg'
import {CONTENT_LABELS} from '../labels'
import * as bsky from '../types/bsky'
import {niceDate} from '../util/nice-date'
import {prettyNumber} from '../util/pretty-number'
import {getRkey} from '../util/rkey'
import {getVerificationState} from '../util/verification-state'
import {Container} from './container'
import {Embed} from './embed'
import {Link} from './link'
import {VerificationCheck} from './verification-check'

interface Props {
  thread: AppBskyFeedDefs.ThreadViewPost
}

export function Post({thread}: Props) {
  const post = thread.post

  const isAuthorLabeled = post.author.labels?.some(label =>
    CONTENT_LABELS.includes(label.val),
  )

  let record: AppBskyFeedPost.Record | null = null
  if (
    bsky.dangerousIsType<AppBskyFeedPost.Record>(
      post.record,
      AppBskyFeedPost.isRecord,
    )
  ) {
    record = post.record
  }

  const verification = getVerificationState({profile: post.author})

  const href = `/profile/${post.author.did}/post/${getRkey(post)}`
  return (
    <Container href={href}>
      <div
        className="flex-1 flex-col flex gap-2 bg-neutral-50 dark:bg-black dark:hover:bg-slate-900 hover:bg-blue-50  rounded-2xl p-4"
        lang={record?.langs?.[0]}>
        <div className="flex gap-2.5 items-center cursor-pointer w-full max-w-full ">
          <Link
            href={`/profile/${post.author.did}`}
            className="rounded-full shrink-0">
            <div className="w-10 h-10 overflow-hidden rounded-full bg-neutral-300 dark:bg-slate-700 shrink-0">
              <img
                src={post.author.avatar}
                style={isAuthorLabeled ? {filter: 'blur(2.5px)'} : undefined}
              />
            </div>
          </Link>
          <div className="flex flex-1 flex-col min-w-0">
            <div className="flex flex-1 items-center">
              <Link
                href={`/profile/${post.author.did}`}
                className="block font-bold text-[17px] leading-5 line-clamp-1 hover:underline underline-offset-2 text-ellipsis decoration-2">
                {post.author.displayName?.trim() || post.author.handle}
              </Link>
              {verification.isVerified && (
                <VerificationCheck
                  className="pl-[3px] mt-px shrink-0"
                  verifier={verification.role === 'verifier'}
                  size={15}
                />
              )}
            </div>
            <Link
              href={`/profile/${post.author.did}`}
              className="block text-[15px] text-textLight dark:text-textDimmed hover:underline line-clamp-1">
              @{post.author.handle}
            </Link>
          </div>
        </div>
        <PostContent record={record} />
        <Embed content={post.embed} labels={post.labels} />

        <div className="flex items-center justify-between w-full pt-2.5  text-sm">
          <div className="flex items-center gap-3 text-sm cursor-pointer">
            {!!post.likeCount && (
              <div className="flex items-center gap-1 cursor-pointer group">
                <img
                  src={likeIcon}
                  className="w-5 h-5 group-hover:opacity-100 dark:opacity-100 group-hover:brightness-0 group-hover:invert-[0.2] dark:group-hover:invert-[0.9] transition-all"
                />
                <p className="font-bold text-neutral-600 dark:text-neutral-300 mb-px group-hover:text-neutral-800 dark:group-hover:text-white transition-colors dark:text-slate-500">
                  {prettyNumber(post.likeCount)}
                </p>
              </div>
            )}
            {!!post.replyCount && (
              <div className="flex items-center gap-1 cursor-pointer group">
                <img
                  src={replyIcon}
                  className="w-5 h-5 group-hover:opacity-100 dark:opacity-100 group-hover:brightness-0 group-hover:invert-[0.2] dark:group-hover:invert-[0.9] transition-all"
                />
                <p className="font-bold text-neutral-600 dark:text-neutral-300 mb-px group-hover:text-neutral-800 dark:group-hover:text-white transition-colors dark:text-slate-500">
                  {prettyNumber(post.replyCount)}
                </p>
              </div>
            )}

            {!!post.repostCount && (
              <div className="flex items-center gap-1 cursor-pointer group">
                <img
                  src={repostIcon}
                  className="w-5 h-5 dark:opacity-100 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert-[0.2] dark:group-hover:invert-[0.9] transition-all"
                />
                <p className="font-bold text-neutral-600 dark:text-neutral-300 mb-px group-hover:text-neutral-800 dark:group-hover:text-white transition-colors dark:text-slate-500">
                  {prettyNumber(post.repostCount)}
                </p>
              </div>
            )}
          </div>
          <Link href={href}>
            <time
              datetime={new Date(post.indexedAt).toISOString()}
              className="text-textLight dark:text-textDimmed text-sm hover:underline dark:text-slate-500">
              {niceDate(post.indexedAt)}
            </time>
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-end pt-2">
        <Link
          href={href}
          className="transition-transform hover:scale-110 shrink-0">
          <img src={logo} className="h-8" />
        </Link>
      </div>
    </Container>
  )
}

function PostContent({record}: {record: AppBskyFeedPost.Record | null}) {
  if (!record) return null

  const rt = new RichText({
    text: record.text,
    facets: record.facets,
  })

  const richText = []

  let counter = 0
  for (const segment of rt.segments()) {
    if (
      segment.link &&
      AppBskyRichtextFacet.validateLink(segment.link).success
    ) {
      richText.push(
        <Link
          key={counter}
          href={segment.link.uri}
          className="text-blue-500 hover:underline"
          disableTracking={
            !segment.link.uri.startsWith('https://bsky.app') &&
            !segment.link.uri.startsWith('https://go.bsky.app')
          }>
          {segment.text}
        </Link>,
      )
    } else if (
      segment.mention &&
      AppBskyRichtextFacet.validateMention(segment.mention).success
    ) {
      richText.push(
        <Link
          key={counter}
          href={`/profile/${segment.mention.did}`}
          className="text-blue-500 hover:underline">
          {segment.text}
        </Link>,
      )
    } else if (
      segment.tag &&
      AppBskyRichtextFacet.validateTag(segment.tag).success
    ) {
      richText.push(
        <Link
          key={counter}
          href={`/hashtag/${segment.tag.tag}`}
          className="text-blue-500 hover:underline">
          {segment.text}
        </Link>,
      )
    } else {
      richText.push(segment.text)
    }

    counter++
  }

  return (
    <p className="min-[300px]:text-lg leading-6 min-[300px]:leading-6 break-word break-words whitespace-pre-wrap">
      {richText}
    </p>
  )
}
