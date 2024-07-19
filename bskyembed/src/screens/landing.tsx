import '../index.css'

import {AppBskyFeedDefs, AppBskyFeedPost, AtUri, BskyAgent} from '@atproto/api'
import {h, render} from 'preact'
import {useEffect, useMemo, useRef, useState} from 'preact/hooks'

import arrowBottom from '../../assets/arrowBottom_stroke2_corner0_rounded.svg'
import logo from '../../assets/logo.svg'
import {Container} from '../components/container'
import {Link} from '../components/link'
import {Post} from '../components/post'
import {niceDate} from '../utils'

const DEFAULT_POST = 'https://bsky.app/profile/emilyliu.me/post/3jzn6g7ixgq2y'
const DEFAULT_URI =
  'at://did:plc:vjug55kidv6sye7ykr5faxxn/app.bsky.feed.post/3jzn6g7ixgq2y'

export const EMBED_SERVICE = 'https://embed.bsky.app'
export const EMBED_SCRIPT = `${EMBED_SERVICE}/static/embed.js`

const root = document.getElementById('app')
if (!root) throw new Error('No root element')

const agent = new BskyAgent({
  service: 'https://public.api.bsky.app',
})

render(<LandingPage />, root)

function LandingPage() {
  const [uri, setUri] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [thread, setThread] = useState<AppBskyFeedDefs.ThreadViewPost | null>(
    null,
  )

  useEffect(() => {
    void (async () => {
      setError(null)
      setThread(null)
      setLoading(true)
      try {
        let atUri = DEFAULT_URI

        if (uri) {
          if (uri.startsWith('at://')) {
            atUri = uri
          } else {
            try {
              const urlp = new URL(uri)
              if (!urlp.hostname.endsWith('bsky.app')) {
                throw new Error('Invalid hostname')
              }
              const split = urlp.pathname.slice(1).split('/')
              if (split.length < 4) {
                throw new Error('Invalid pathname')
              }
              const [profile, didOrHandle, type, rkey] = split
              if (profile !== 'profile' || type !== 'post') {
                throw new Error('Invalid profile or type')
              }

              let did = didOrHandle
              if (!didOrHandle.startsWith('did:')) {
                const resolution = await agent.resolveHandle({
                  handle: didOrHandle,
                })
                if (!resolution.data.did) {
                  throw new Error('No DID found')
                }
                did = resolution.data.did
              }

              atUri = `at://${did}/app.bsky.feed.post/${rkey}`
            } catch (err) {
              console.log(err)
              throw new Error('Invalid Bluesky URL')
            }
          }
        }

        const {data} = await agent.getPostThread({
          uri: atUri,
          depth: 0,
          parentHeight: 0,
        })

        if (!AppBskyFeedDefs.isThreadViewPost(data.thread)) {
          throw new Error('Post not found')
        }
        const pwiOptOut = !!data.thread.post.author.labels?.find(
          label => label.val === '!no-unauthenticated',
        )
        if (pwiOptOut) {
          throw new Error(
            'The author of this post has requested their posts not be displayed on external sites.',
          )
        }
        setThread(data.thread)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Invalid Bluesky URL')
      } finally {
        setLoading(false)
      }
    })()
  }, [uri])

  return (
    <main className="w-full min-h-screen flex flex-col items-center gap-8 py-14 px-4 md:pt-32">
      <Link
        href="https://bsky.social/about"
        className="transition-transform hover:scale-110">
        <img src={logo} className="h-10" />
      </Link>

      <h1 className="text-4xl font-bold text-center">Embed a Bluesky Post</h1>

      <input
        type="text"
        value={uri}
        onInput={e => setUri(e.currentTarget.value)}
        className="border rounded-lg py-3 w-full max-w-[600px] px-4"
        placeholder={DEFAULT_POST}
      />

      <img src={arrowBottom} className="w-6" />

      {loading ? (
        <Skeleton />
      ) : (
        <div className="w-full max-w-[600px] gap-8 flex flex-col">
          {!error && thread && uri && <Snippet thread={thread} />}
          {!error && thread && <Post thread={thread} key={thread.post.uri} />}
          {error && (
            <div className="w-full border border-red-500 bg-red-50 px-4 py-3 rounded-lg">
              <p className="text-red-500 text-center">{error}</p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

function Skeleton() {
  return (
    <Container>
      <div className="flex-1 flex-col flex gap-2 pb-8">
        <div className="flex gap-2.5 items-center">
          <div className="w-10 h-10 overflow-hidden rounded-full bg-neutral-100 shrink-0 animate-pulse" />
          <div className="flex-1">
            <div className="bg-neutral-100 animate-pulse w-64 h-4 rounded" />
            <div className="bg-neutral-100 animate-pulse w-32 h-3 mt-1 rounded" />
          </div>
        </div>
        <div className="w-full h-4 mt-2 bg-neutral-100 rounded animate-pulse" />
        <div className="w-5/6 h-4 bg-neutral-100 rounded animate-pulse" />
        <div className="w-3/4 h-4 bg-neutral-100 rounded animate-pulse" />
      </div>
    </Container>
  )
}

function Snippet({thread}: {thread: AppBskyFeedDefs.ThreadViewPost}) {
  const ref = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)

  // reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  const snippet = useMemo(() => {
    const record = thread.post.record

    if (!AppBskyFeedPost.isRecord(record)) {
      return ''
    }

    const lang = record.langs && record.langs.length > 0 ? record.langs[0] : ''
    const profileHref = toShareUrl(
      ['/profile', thread.post.author.did].join('/'),
    )
    const urip = new AtUri(thread.post.uri)
    const href = toShareUrl(
      ['/profile', thread.post.author.did, 'post', urip.rkey].join('/'),
    )

    // x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x
    // DO NOT ADD ANY NEW INTERPOLATIONS BELOW WITHOUT ESCAPING THEM!
    // Also, keep this code synced with the app code in Embed.tsx.
    // x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x
    return `<blockquote class="bluesky-embed" data-bluesky-uri="${escapeHtml(
      thread.post.uri,
    )}" data-bluesky-cid="${escapeHtml(thread.post.cid)}"><p lang="${escapeHtml(
      lang,
    )}">${escapeHtml(record.text)}${
      record.embed
        ? `<br><br><a href="${escapeHtml(href)}">[image or embed]</a>`
        : ''
    }</p>&mdash; ${escapeHtml(
      thread.post.author.displayName || thread.post.author.handle,
    )} (<a href="${escapeHtml(profileHref)}">@${escapeHtml(
      thread.post.author.handle,
    )}</a>) <a href="${escapeHtml(href)}">${escapeHtml(
      niceDate(thread.post.indexedAt),
    )}</a></blockquote><script async src="${EMBED_SCRIPT}" charset="utf-8"></script>`
  }, [thread])

  return (
    <div className="flex gap-2 w-full">
      <input
        ref={ref}
        type="text"
        value={snippet}
        className="border rounded-lg py-3 w-full px-4"
        readOnly
        autoFocus
        onFocus={() => {
          ref.current?.select()
        }}
      />
      <button
        className="rounded-lg bg-brand text-white color-white py-3 px-4 whitespace-nowrap min-w-28"
        onClick={() => {
          ref.current?.focus()
          ref.current?.select()
          void navigator.clipboard.writeText(snippet)
          setCopied(true)
        }}>
        {copied ? 'Copied!' : 'Copy code'}
      </button>
    </div>
  )
}

function toShareUrl(path: string) {
  return `https://bsky.app${path}?ref_src=embed`
}

/**
 * Based on a snippet of code from React, which itself was based on the escape-html library.
 * Copyright (c) Meta Platforms, Inc. and affiliates
 * Copyright (c) 2012-2013 TJ Holowaychuk
 * Copyright (c) 2015 Andreas Lubbe
 * Copyright (c) 2015 Tiancheng "Timothy" Gu
 * Licensed as MIT.
 */
const matchHtmlRegExp = /["'&<>]/
function escapeHtml(string: string) {
  const str = String(string)
  const match = matchHtmlRegExp.exec(str)
  if (!match) {
    return str
  }
  let escape
  let html = ''
  let index
  let lastIndex = 0
  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;'
        break
      case 38: // &
        escape = '&amp;'
        break
      case 39: // '
        escape = '&#x27;'
        break
      case 60: // <
        escape = '&lt;'
        break
      case 62: // >
        escape = '&gt;'
        break
      default:
        continue
    }
    if (lastIndex !== index) {
      html += str.slice(lastIndex, index)
    }
    lastIndex = index + 1
    html += escape
  }
  return lastIndex !== index ? html + str.slice(lastIndex, index) : html
}
