/**
 * Eurosky per-route Open Graph metadata injector (Bunny.net Edge Scripting).
 *
 * The web app ships as a static SPA uploaded to Bunny Edge Storage (see
 * ../../bunny_upload.sh) and served from the main pull zone (mu.social). A
 * static SPA has no per-route server rendering, so out of the box EVERY shared
 * link - a post, a profile, the homepage - unfurls with the single default card
 * baked into index.html (../../web/index.html). Upstream Bluesky avoids this by
 * serving its HTML through the Go `bskyweb` server, which queries the appview
 * and templates per-post/per-profile og:* tags (see ../../bskyweb/templates/).
 * That server is not in our request path.
 *
 * This script reproduces bskyweb's metadata role at the Bunny edge. It runs as
 * pull-zone MIDDLEWARE (not a standalone service like the other workers, which
 * live on their own subdomains): it sits in front of the existing mu.social
 * pull zone, inspects the origin's HTML response, and for post/profile routes
 * rewrites the <head> with tags built from live appview data. The og:image
 * reuses media that already exists (post thumbnails, profile banners, avatars) -
 * there is NO image generation here, matching what bskyweb does for posts and
 * profiles.
 *
 * Routes handled (mirrors ../../bskyweb/cmd/bskyweb/server.go):
 *   /profile/<actor>                -> profile card
 *   /profile/<actor>/post/<rkey>    -> post card
 * <actor> is a handle or DID. Everything else (assets, other routes, the
 * homepage) passes through untouched and keeps the static default card from
 * index.html, which also serves as the fallback if this script ever fails:
 * every code path here fails OPEN, returning the unmodified origin response.
 *
 * Config (Bunny dashboard -> script -> Env Configuration), all optional:
 *   APPVIEW_URL   atproto appview base, no trailing slash
 *                 (default https://public.api.bsky.app).
 *   SITE_URL      public origin of this deployment, for canonical og:url and the
 *                 absolute og:logo (default https://mu.social). MUST be set per
 *                 deployment, e.g. https://staging.mu.social on staging - it
 *                 cannot be derived from the request (onOriginResponse sees the
 *                 proxied origin IP, not the public host).
 *   SITE_NAME     og:site_name value (default "mu").
 *   BOTS_ONLY     "1"/"true" to only enrich requests from known crawler
 *                 user-agents and pass humans straight through. Default is to
 *                 enrich everyone: the output is a pure function of the path, so
 *                 it caches per-URL on the pull zone and humans pay the appview
 *                 round-trip only on a cold cache. Turn this on to keep the
 *                 human path a pure passthrough at the cost of no SEO tags for
 *                 search-engine crawlers that do not match the UA list.
 *
 * Deploy: see ./README.md. In short - create an Edge Script, paste this file,
 * and attach it to the EXISTING mu.social pull zone as middleware (not a new
 * hostname). Make sure the pull zone is allowed to cache text/html so enriched
 * pages are reused.
 */
import * as BunnySDK from 'https://esm.sh/@bunny.net/edgescript-sdk@0.11.2'

const APPVIEW_URL = (
  Deno.env.get('APPVIEW_URL') || 'https://public.api.bsky.app'
).replace(/\/+$/, '')
const SITE_NAME = Deno.env.get('SITE_NAME') || 'mu'
// Public origin of this deployment, used to build canonical og:url and the
// absolute og:logo URL. We CANNOT derive this from the request: inside
// onOriginResponse the request URL is the proxied origin (an internal IP:port),
// not the public hostname. Set per deployment, e.g. https://staging.mu.social.
const SITE_URL = (Deno.env.get('SITE_URL') || 'https://mu.social').replace(
  /\/+$/,
  '',
)
// Small site logo shown by some unfurlers (e.g. Discord) next to the site name,
// mirroring bskyweb's og:logo. Absolute so it resolves regardless of og:url.
const SITE_LOGO = `${SITE_URL}/favicon-32.png`
const BOTS_ONLY = /^(1|true|yes)$/i.test(Deno.env.get('BOTS_ONLY') || '')

// How long the pull zone may serve an enriched page before refetching. The
// tags are derived from the post/profile, which is effectively immutable for
// sharing purposes, so this is generous. Counts (likes/replies) are not in the
// card, so staleness is invisible.
const CACHE_CONTROL =
  'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'

const POST_RE = /^\/profile\/([^/]+)\/post\/([^/]+)\/?$/
const PROFILE_RE = /^\/profile\/([^/]+)\/?$/

// A request is from a link-preview crawler or search bot. Only consulted when
// BOTS_ONLY is set.
const BOT_RE =
  /(bot|crawler|spider|facebookexternalhit|twitterbot|slackbot|discordbot|whatsapp|telegrambot|linkedinbot|pinterest|redditbot|applebot|googlebot|bingbot|embedly|quora link preview|skypeuripreview|nuzzel|vkshare|w3c_validator|mastodon|pleroma|misskey|iframely)/i

const MAX_DESC = 300
const MAX_IMAGES = 4

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function truncate(s: string, n: number): string {
  const t = s.trim()
  if (t.length <= n) return t
  return t.slice(0, n - 1).trimEnd() + '…'
}

function meta(kind: 'property' | 'name', key: string, value: string): string {
  return `<meta ${kind}="${key}" content="${escapeAttr(value)}">`
}

// avatarThumbnail mirrors bskyweb's avatar_thumbnail filter (commit 8b1c47a49,
// upstream #9923). The full avatar (/img/avatar/plain/, ~1000px) renders as a
// huge cropped card; the thumbnail variant is a small square that unfurlers
// show as a compact summary card. Used as the og:image fallback when a post has
// no media and when a profile has no banner.
function avatarThumbnail(url: string): string {
  return url.replace('/img/avatar/plain/', '/img/avatar_thumbnail/plain/')
}

type Tag = string

// extractPostImages mirrors bskyweb extractPostMedia
// (../../bskyweb/cmd/bskyweb/jsonld.go): image, video, and the media slot of a
// record-with-media embed, in that order. External-link thumbnails are
// deliberately not used as og:image, same as upstream.
function extractPostImages(post: any): string[] {
  const e = post?.embed
  if (!e) return []
  const t: string = e.$type || ''
  if (t.includes('app.bsky.embed.images')) {
    return (e.images || []).map((i: any) => i?.thumb).filter(Boolean)
  }
  if (t.includes('app.bsky.embed.video')) {
    return e.thumbnail ? [e.thumbnail] : []
  }
  if (t.includes('app.bsky.embed.recordWithMedia')) {
    const m = e.media
    const mt: string = m?.$type || ''
    if (mt.includes('app.bsky.embed.images')) {
      return (m.images || []).map((i: any) => i?.thumb).filter(Boolean)
    }
    if (mt.includes('app.bsky.embed.video')) {
      return m.thumbnail ? [m.thumbnail] : []
    }
  }
  return []
}

// extractPostVideo mirrors bskyweb extractVideoMeta
// (../../bskyweb/cmd/bskyweb/embedmeta.go): the video embed's HLS playlist
// becomes og:video, so unfurlers that support video (Discord, etc.) play it
// inline instead of just showing the thumbnail. The thumbnail still flows
// through extractPostImages as og:image. Same video slots as the images path:
// a top-level video embed or the media slot of a record-with-media embed.
function extractPostVideo(
  post: any,
): {url: string; type: string; width?: number; height?: number} | null {
  const e = post?.embed
  if (!e) return null
  const t: string = e.$type || ''
  let v: any = null
  if (t.includes('app.bsky.embed.video')) {
    v = e
  } else if (t.includes('app.bsky.embed.recordWithMedia')) {
    const m = e.media
    if ((m?.$type || '').includes('app.bsky.embed.video')) v = m
  }
  if (!v?.playlist) return null
  return {
    url: v.playlist,
    type: 'application/vnd.apple.mpegurl',
    width: v.aspectRatio?.width,
    height: v.aspectRatio?.height,
  }
}

function ogTitle(displayName: string | undefined, handle: string): string {
  const dn = (displayName || '').trim()
  return dn ? `${dn} (@${handle})` : `@${handle}`
}

async function fetchJson(url: string): Promise<any | null> {
  const res = await fetch(url, {headers: {accept: 'application/json'}})
  if (!res.ok) return null
  return await res.json()
}

// Build the per-post tag set, or null to fall through to the default card.
async function buildPostTags(
  actor: string,
  rkey: string,
): Promise<{title: string; tags: Tag[]} | null> {
  const uri = `at://${actor}/app.bsky.feed.post/${rkey}`
  const data = await fetchJson(
    `${APPVIEW_URL}/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(
      uri,
    )}&depth=0&parentHeight=0`,
  )
  const post = data?.thread?.post
  if (!post?.author?.handle) return null

  const handle: string = post.author.handle
  const title = ogTitle(post.author.displayName, handle)
  const text: string = post.record?.text || ''
  const images = extractPostImages(post).slice(0, MAX_IMAGES)
  // Canonical handle-form URL (the path may have arrived in DID form).
  const canonical = `${SITE_URL}/profile/${handle}/post/${rkey}`

  const tags: Tag[] = [
    meta('property', 'og:type', 'article'),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:logo', SITE_LOGO),
    meta('property', 'og:url', canonical),
    meta('property', 'og:title', title),
    meta('name', 'twitter:title', title),
  ]
  if (text) {
    const desc = truncate(text, MAX_DESC)
    tags.push(meta('name', 'description', desc))
    tags.push(meta('property', 'og:description', desc))
    tags.push(meta('name', 'twitter:description', desc))
  }
  if (images.length > 0) {
    for (const img of images) {
      tags.push(meta('property', 'og:image', img))
      tags.push(meta('name', 'twitter:image', img))
    }
    tags.push(meta('name', 'twitter:card', 'summary_large_image'))
  } else if (post.author.avatar) {
    const thumb = avatarThumbnail(post.author.avatar)
    tags.push(meta('property', 'og:image', thumb))
    tags.push(meta('name', 'twitter:image', thumb))
    tags.push(meta('name', 'twitter:card', 'summary'))
  }
  const video = extractPostVideo(post)
  if (video) {
    tags.push(meta('property', 'og:video', video.url))
    tags.push(meta('property', 'og:video:type', video.type))
    if (video.width && video.height) {
      tags.push(meta('property', 'og:video:width', String(video.width)))
      tags.push(meta('property', 'og:video:height', String(video.height)))
    }
  }
  return {title, tags}
}

// Build the per-profile tag set, or null to fall through to the default card.
async function buildProfileTags(
  actor: string,
): Promise<{title: string; tags: Tag[]} | null> {
  const p = await fetchJson(
    `${APPVIEW_URL}/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(
      actor,
    )}`,
  )
  if (!p?.handle) return null

  const handle: string = p.handle
  const title = ogTitle(p.displayName, handle)
  const canonical = `${SITE_URL}/profile/${handle}`

  const tags: Tag[] = [
    meta('property', 'og:type', 'profile'),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:logo', SITE_LOGO),
    meta('property', 'og:url', canonical),
    meta('property', 'profile:username', handle),
    meta('property', 'og:title', title),
    meta('name', 'twitter:title', title),
  ]
  if (p.description) {
    const desc = truncate(p.description, MAX_DESC)
    tags.push(meta('name', 'description', desc))
    tags.push(meta('property', 'og:description', desc))
    tags.push(meta('name', 'twitter:description', desc))
  }
  // bskyweb deliberately avoids cropping full-size avatars into large cards: a
  // banner yields a large card, otherwise fall back to the small thumbnail
  // avatar as a compact summary card. (Upstream emits no image at all in the
  // no-banner case; we keep the thumbnail so the profile still gets a small
  // picture rather than a text-only card.)
  if (p.banner) {
    tags.push(meta('property', 'og:image', p.banner))
    tags.push(meta('name', 'twitter:image', p.banner))
    tags.push(meta('name', 'twitter:card', 'summary_large_image'))
  } else if (p.avatar) {
    const thumb = avatarThumbnail(p.avatar)
    tags.push(meta('property', 'og:image', thumb))
    tags.push(meta('name', 'twitter:image', thumb))
    tags.push(meta('name', 'twitter:card', 'summary'))
  }
  return {title, tags}
}

// Remove the tags we are about to replace from the document <head> only, so the
// crawler does not see duplicate og:* (it would honor the first, i.e. the stale
// default) and we stay idempotent if the script somehow runs twice.
const STRIP_RE =
  /<title>[\s\S]*?<\/title>|<meta\b[^>]*\b(?:property|name)=["'](?:og:[^"']*|twitter:[^"']*|description)["'][^>]*>\s*/gi

function rewriteHead(html: string, title: string, tags: Tag[]): string | null {
  const close = html.indexOf('</head>')
  if (close === -1) return null
  const head = html.slice(0, close).replace(STRIP_RE, '')
  const rest = html.slice(close)
  const block =
    `\n    <title>${escapeAttr(title)}</title>\n    ` +
    tags.join('\n    ') +
    '\n  '
  return head + block + rest
}

async function tagsFor(
  pathname: string,
): Promise<{title: string; tags: Tag[]} | null> {
  let m = POST_RE.exec(pathname)
  if (m) {
    return buildPostTags(decodeURIComponent(m[1]), decodeURIComponent(m[2]))
  }
  m = PROFILE_RE.exec(pathname)
  if (m) {
    return buildProfileTags(decodeURIComponent(m[1]))
  }
  return null
}

BunnySDK.net.http
  // `url` is only used for `bunny dev` local runs; deployed, requests proxy to
  // the origin configured in the pull zone (the Edge Storage static build).
  .servePullZone({url: 'https://mu.social'})
  // We only transform responses; let every request reach the origin untouched.
  .onOriginRequest((ctx: any) => ctx.request)
  .onOriginResponse(async (ctx: any) => {
    const response: Response = ctx.response
    try {
      const req: Request = ctx.request
      const url = new URL(req.url)

      // Only touch HTML documents. Assets (js/css/images), JSON, redirects,
      // etc. pass through untouched.
      const ct = response.headers.get('content-type') || ''
      if (!ct.includes('text/html')) return response

      // The storage zone serves index.html for unknown paths via its "404 File
      // path" setting, but it keeps a 404 STATUS. Browsers render the body so
      // SPA routes work, but link-preview crawlers and search bots ignore
      // non-200 responses - so we normalize these SPA-shell 404s back to 200.
      // Without this, enriched og:* tags are never read and no card unfurls.
      const spaFallback = response.status === 404
      const isPost = POST_RE.test(url.pathname)
      const isProfile = !isPost && PROFILE_RE.test(url.pathname)

      // A normal (200) page that is not a post/profile route needs nothing.
      if (!spaFallback && !isPost && !isProfile) return response

      // Reading the body decodes any gzip, so the original content-encoding /
      // -length headers no longer match - drop them and let the runtime
      // re-derive them on the new Response.
      const html = await response.text()
      const headers = new Headers(response.headers)
      headers.delete('content-encoding')
      headers.delete('content-length')
      headers.set('content-type', 'text/html; charset=utf-8')
      headers.set('cache-control', CACHE_CONTROL)

      // Enrich post/profile routes with per-route tags (unless BOTS_ONLY is set
      // and this is not a known crawler). Any miss - not found, blocked, no
      // </head> - leaves the default card untouched.
      let out = html
      const enrich =
        (isPost || isProfile) &&
        (!BOTS_ONLY || BOT_RE.test(req.headers.get('user-agent') || ''))
      if (enrich) {
        const built = await tagsFor(url.pathname)
        if (built) {
          const rewritten = rewriteHead(html, built.title, built.tags)
          if (rewritten != null) out = rewritten
        }
      }

      return new Response(out, {
        // Force 200 for the SPA shell so crawlers and search bots accept it.
        status: spaFallback ? 200 : response.status,
        statusText: spaFallback ? 'OK' : response.statusText,
        headers,
      })
    } catch {
      // Fail open: any appview/parse/runtime error serves the original
      // response, which still carries the static default card.
      return response
    }
  })
