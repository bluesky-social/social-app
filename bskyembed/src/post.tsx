import {AppBskyFeedDefs, AppBskyFeedPost, RichText} from '@atproto/api'
import {ComponentChildren, h} from 'preact'
import {useRef} from 'preact/hooks'

import replyIcon from '../../assets/icons/bubble_stroke2_corner2_rounded.svg'
import likeIcon from '../../assets/icons/heart2_stroke2_corner0_rounded.svg'
import repostIcon from '../../assets/icons/repost_stroke2_corner2_rounded.svg'
import logo from '../assets/logo.svg'
import {Link} from './link'
import {niceDate} from './time'

interface Props {
  thread: AppBskyFeedDefs.ThreadViewPost
}

export function Post({thread}: Props) {
  const post = thread.post

  let record: AppBskyFeedPost.Record | null = null
  if (AppBskyFeedPost.isRecord(post.record)) {
    record = post.record
  }

  const rkey = post.uri.split('/').pop() as string

  return (
    <Container href={`/profile/${post.author.did}/post/${rkey}`}>
      <div className="flex-1 flex-col flex gap-2">
        <div className="flex gap-2.5 items-center">
          <Link href={`/profile/${post.author.did}`} className="rounded-full">
            <img
              src={post.author.avatar}
              className="w-10 h-10 rounded-full bg-neutral-300 shrink-0"
            />
          </Link>
          <div>
            <Link
              href={`/profile/${post.author.did}`}
              className="font-bold text-[17px] leading-5 line-clamp-1 hover:underline underline-offset-2 decoration-2">
              <p>{post.author.displayName}</p>
            </Link>
            <Link
              href={`/profile/${post.author.did}`}
              className="text-[15px] text-textLight hover:underline line-clamp-1">
              <p>@{post.author.handle}</p>
            </Link>
          </div>
        </div>
        {record && <PostContent record={record} />}
        <time
          datetime={new Date(post.indexedAt).toISOString()}
          className="text-textLight mt-1 text-sm">
          {niceDate(post.indexedAt)}
        </time>
        <div className="border-t w-full pt-2.5 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <img src={replyIcon as string} className="w-4 h-4" />
            <p>{post.replyCount}</p>
          </div>
          <div className="flex items-center gap-2">
            <img src={likeIcon as string} className="w-4 h-4" />
            <p>{post.likeCount}</p>
          </div>
          <div className="flex items-center gap-2">
            <img src={repostIcon as string} className="w-4 h-4" />
            <p>{post.repostCount}</p>
          </div>
          <div className="flex-1" />
          <Link
            href="https://bsky.social/about"
            className="transition-transform hover:scale-125">
            <img src={logo as string} className="h-4" />
          </Link>
        </div>
      </div>
    </Container>
  )
}

function Container({
  children,
  href,
}: {
  children: ComponentChildren
  href: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      className="w-full hover:bg-neutral-50 transition-colors max-w-[550px] min-w-[300px] flex border rounded-xl px-4 pt-3 pb-2.5"
      onClick={() => {
        if (ref.current) {
          // forwardRef requires preact/compat - let's keep it simple
          // to keep the bundle size down
          const anchor = ref.current.querySelector('a')
          if (anchor) {
            anchor.click()
          }
        }
      }}>
      <Link href={href} />
      {children}
    </div>
  )
}

function PostContent({record}: {record: AppBskyFeedPost.Record}) {
  const rt = new RichText({
    text: record.text,
    facets: record.facets,
  })

  const richText = []

  let counter = 0
  for (const segment of rt.segments()) {
    if (segment.isLink() && segment.link) {
      richText.push(
        <Link
          key={counter}
          href={segment.link.uri}
          className="text-blue-400 hover:underline">
          {segment.text}
        </Link>,
      )
    } else if (segment.isMention() && segment.mention) {
      richText.push(
        <Link
          key={counter}
          href={`/profile/${segment.mention.did}`}
          className="text-blue-500 hover:underline">
          {segment.text}
        </Link>,
      )
    } else if (segment.isTag() && segment.tag) {
      richText.push(
        <Link
          key={counter}
          href={`/tag/${segment.tag.tag}`}
          className="text-blue-500 hover:underline">
          {segment.text}
        </Link>,
      )
    } else {
      richText.push(segment.text)
    }

    counter++
  }

  return <p className="text-lg leading-6">{richText}</p>
}
