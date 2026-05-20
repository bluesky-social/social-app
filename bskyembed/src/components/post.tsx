import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyRichtextFacet,
  RichText,
} from '@atproto/api'
import {h} from 'preact'

import logo from '../../assets/logo_full_name.svg'
import {Like as LikeIcon} from '../icons/Like'
import {Reply as ReplyIcon} from '../icons/Reply'
import {Repost as RepostIcon} from '../icons/Repost'
import {Robot as RobotIcon} from '../icons/Robot'
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
  const isBot = post.author.labels?.some(
    l => l.val === 'bot' && l.src === post.author.did,
  )

  const href = `/profile/${post.author.did}/post/${getRkey(post)}`

  return (
    <Container href={href}>
      <div
        className="flex-1 flex-col flex gap-4 bg-white dark:bg-black hover:bg-brandHover dark:hover:bg-brandHoverDark rounded-[30px] p-5"
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
                className="block font-semibold text-[15px] min-[400px]:text-[17px] leading-5 line-clamp-1 hover:underline underline-offset-2 text-ellipsis decoration-2">
                {post.author.displayName?.trim() || post.author.handle}
              </Link>
              {verification.isVerified && (
                <VerificationCheck
                  className="pl-[3px] mt-px shrink-0"
                  verifier={verification.role === 'verifier'}
                  size={15}
                />
              )}
              {isBot && (
                <RobotIcon
                  className="pl-[3px] mt-px shrink-0 text-slate-500 dark:text-slate-400"
                  size={15}
                />
              )}
            </div>
            <div className="flex items-center gap-1 text-[13px] min-[400px]:text-[15px] min-w-0">
              <Link
                href={`/profile/${post.author.did}`}
                className="text-textNeutral hover:underline line-clamp-1">
                @{post.author.handle}
              </Link>
              <span className="text-textNeutral shrink-0">·</span>
              <Link
                href={`/profile/${post.author.did}`}
                className="text-brand hover:underline shrink-0">
                Follow
              </Link>
            </div>
          </div>
        </div>

        <PostContent record={record} />
        <Embed content={post.embed} labels={post.labels} />

        <div className="flex items-end justify-between w-full">
          <div className="flex flex-col min-[400px]:gap-0.5">
            <div className="flex items-center gap-3 text-sm cursor-pointer ml-[-2px]">
              {!!post.likeCount && (
                <div className="flex items-center gap-0.5 min-[400px]:gap-1 cursor-pointer group">
                  <LikeIcon className="w-5 h-5 min-[400px]:w-[22px] min-[400px]:h-[22px] text-textLight dark:text-textDimmed group-hover:text-neutral-800 dark:group-hover:text-white transition-colors" />
                  <p className="text-[11px] min-[400px]:text-[15px] font-semibold text-textLight dark:text-textDimmed mb-px group-hover:text-neutral-800 dark:group-hover:text-white transition-colors">
                    {prettyNumber(post.likeCount)}
                  </p>
                </div>
              )}
              {!!post.replyCount && (
                <div className="flex items-center gap-0.5 min-[400px]:gap-1 cursor-pointer group">
                  <ReplyIcon className="w-5 h-5 min-[400px]:w-[22px] min-[400px]:h-[22px] text-textLight dark:text-textDimmed group-hover:text-neutral-800 dark:group-hover:text-white transition-colors" />
                  <p className="text-[11px] min-[400px]:text-[15px] font-semibold text-textLight dark:text-textDimmed mb-px group-hover:text-neutral-800 dark:group-hover:text-white transition-colors">
                    {prettyNumber(post.replyCount)}
                  </p>
                </div>
              )}
              {!!post.repostCount && (
                <div className="flex items-center gap-0.5 min-[400px]:gap-1 cursor-pointer group">
                  <RepostIcon className="w-5 h-5 min-[400px]:w-[22px] min-[400px]:h-[22px] text-textLight dark:text-textDimmed group-hover:text-neutral-800 dark:group-hover:text-white transition-colors" />
                  <p className="text-[11px] min-[400px]:text-[15px] font-semibold text-textLight dark:text-textDimmed mb-px group-hover:text-neutral-800 dark:group-hover:text-white transition-colors">
                    {prettyNumber(post.repostCount)}
                  </p>
                </div>
              )}
            </div>
            <Link href={href}>
              <time
                datetime={new Date(post.indexedAt).toISOString()}
                className="text-[11px] min-[400px]:text-[15px] text-textNeutral hover:underline">
                {niceDate(post.indexedAt)}
              </time>
            </Link>
          </div>
          <Link
            href={href}
            className="transition-transform hover:scale-110 shrink-0">
            <img src={logo} className="h-5 min-[400px]:h-7" />
          </Link>
        </div>
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
          className="text-brand hover:underline"
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
          className="text-brand hover:underline">
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
          className="text-brand hover:underline">
          {segment.text}
        </Link>,
      )
    } else {
      richText.push(segment.text)
    }

    counter++
  }

  return (
    <p className="text-md min-[400px]:text-lg leading-snug min-[400px]:leading-snug break-word break-words whitespace-pre-wrap">
      {richText}
    </p>
  )
}
