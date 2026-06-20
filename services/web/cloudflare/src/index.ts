/**
 * Brand web Worker (Cloudflare) - serves the static SPA and folds in two edge
 * services that on Bunny were separate scripts:
 *
 *   GET /geolocation              -> { countryCode[, regionCode] } from request.cf
 *                                    (port of services/geolocation/bunny)
 *   /profile/<actor>[/post/<rkey>] -> SPA shell with per-route OG/Twitter tags
 *                                    injected from appview data
 *                                    (port of services/og/bunny)
 *   everything else                -> static asset, or index.html (SPA fallback)
 *
 * Static files are served via the ASSETS binding (the `web-build/` output,
 * built by scripts/deploy-cloudflare.sh). `run_worker_first` makes this Worker handle every
 * request so it can own the two routes above and delegate the rest to ASSETS.
 *
 * OG enrichment mirrors bskyweb and the Bunny og worker exactly (same appview
 * queries, same tag set, same fail-open behavior). The og:image reuses existing
 * media (thumbnails/banners/avatars) - no image generation. Unlike Bunny, the
 * SPA fallback already returns 200 here, so no status normalization is needed.
 *
 * Config (wrangler.jsonc `vars`, all optional):
 *   APPVIEW_URL    atproto appview base (default https://public.api.bsky.app)
 *   SITE_URL       public origin, for canonical og:url + absolute og:logo
 *                  (default https://mu.social) - set per deployment
 *   SITE_NAME      og:site_name (default "mu")
 *   ALLOWED_ORIGIN Access-Control-Allow-Origin for /geolocation (default *)
 *   BOTS_ONLY      "1"/"true" to only enrich known crawler UAs (default: all)
 */

import brandMeta from '../../../../src/config/brand.json'

// The brand's primary web origin - the single source for the SITE_URL /
// SITE_NAME / ALLOWED_ORIGIN defaults (from src/config/brand.json, bundled
// into the Worker at build). The env vars below only OVERRIDE it per deployment
// (e.g. a staging host), so a rebrand is one edit in brand.json.
const BRAND_ORIGIN = `https://${brandMeta.hosts[0]}`

interface Env {
  ASSETS: {fetch: (request: Request) => Promise<Response>}
  APPVIEW_URL?: string
  SITE_URL?: string
  SITE_NAME?: string
  ALLOWED_ORIGIN?: string
  BOTS_ONLY?: string
}

type Cfg = {
  appview: string
  siteUrl: string
  siteName: string
  siteLogo: string
  botsOnly: boolean
}

function configFrom(env: Env): Cfg {
  const siteUrl = (env.SITE_URL || BRAND_ORIGIN).replace(/\/+$/, '')
  return {
    appview: (env.APPVIEW_URL || 'https://public.api.bsky.app').replace(
      /\/+$/,
      '',
    ),
    siteUrl,
    siteName: env.SITE_NAME || brandMeta.name,
    siteLogo: `${siteUrl}/favicon-32.png`,
    botsOnly: /^(1|true|yes)$/i.test(env.BOTS_ONLY || ''),
  }
}

const POST_RE = /^\/profile\/([^/]+)\/post\/([^/]+)\/?$/
const PROFILE_RE = /^\/profile\/([^/]+)\/?$/

const BOT_RE =
  /(bot|crawler|spider|facebookexternalhit|twitterbot|slackbot|discordbot|whatsapp|telegrambot|linkedinbot|pinterest|redditbot|applebot|googlebot|bingbot|embedly|quora link preview|skypeuripreview|nuzzel|vkshare|w3c_validator|mastodon|pleroma|misskey|iframely)/i

const MAX_DESC = 300
const MAX_IMAGES = 4
const CACHE_CONTROL =
  'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'

// ---------------------------------------------------------------------------
// /geolocation (port of services/geolocation/bunny) - request.cf supplies the
// country and (bonus over Bunny) the ISO 3166-2 region code.
// ---------------------------------------------------------------------------

function handleGeolocation(request: Request, env: Env): Response {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || BRAND_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    // Never cache: the body is per-visitor.
    'Cache-Control': 'no-store',
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers})
  }
  if (request.method !== 'GET') {
    return new Response(null, {status: 405, headers})
  }
  const cf = request.cf as {country?: string; regionCode?: string} | undefined
  const countryCode = (cf?.country || '').toUpperCase()
  // The app treats any non-2xx as failure and proceeds fail-closed; a 200
  // without a valid country would wrongly cache "unknown" as success.
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return new Response(null, {status: 503, headers})
  }
  const regionCode =
    typeof cf?.regionCode === 'string' && cf.regionCode
      ? cf.regionCode.toUpperCase()
      : undefined
  const body = regionCode ? {countryCode, regionCode} : {countryCode}
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {...headers, 'Content-Type': 'application/json'},
  })
}

// ---------------------------------------------------------------------------
// OG enrichment (port of services/og/bunny) - identical appview queries + tags.
// ---------------------------------------------------------------------------

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

function avatarThumbnail(url: string): string {
  return url.replace('/img/avatar/plain/', '/img/avatar_thumbnail/plain/')
}

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

async function buildPostTags(
  actor: string,
  rkey: string,
  cfg: Cfg,
): Promise<{title: string; tags: string[]} | null> {
  const uri = `at://${actor}/app.bsky.feed.post/${rkey}`
  const data = await fetchJson(
    `${cfg.appview}/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(
      uri,
    )}&depth=0&parentHeight=0`,
  )
  const post = data?.thread?.post
  if (!post?.author?.handle) return null

  const handle: string = post.author.handle
  const title = ogTitle(post.author.displayName, handle)
  const text: string = post.record?.text || ''
  const images = extractPostImages(post).slice(0, MAX_IMAGES)
  const canonical = `${cfg.siteUrl}/profile/${handle}/post/${rkey}`

  const tags: string[] = [
    meta('property', 'og:type', 'article'),
    meta('property', 'og:site_name', cfg.siteName),
    meta('property', 'og:logo', cfg.siteLogo),
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

async function buildProfileTags(
  actor: string,
  cfg: Cfg,
): Promise<{title: string; tags: string[]} | null> {
  const p = await fetchJson(
    `${cfg.appview}/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(
      actor,
    )}`,
  )
  if (!p?.handle) return null

  const handle: string = p.handle
  const title = ogTitle(p.displayName, handle)
  const canonical = `${cfg.siteUrl}/profile/${handle}`

  const tags: string[] = [
    meta('property', 'og:type', 'profile'),
    meta('property', 'og:site_name', cfg.siteName),
    meta('property', 'og:logo', cfg.siteLogo),
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

// Strip the default tags we are replacing so a crawler does not see duplicate
// og:* (it would honor the first, stale one), and so we stay idempotent.
const STRIP_RE =
  /<title>[\s\S]*?<\/title>|<meta\b[^>]*\b(?:property|name)=["'](?:og:[^"']*|twitter:[^"']*|description)["'][^>]*>\s*/gi

function rewriteHead(
  html: string,
  title: string,
  tags: string[],
): string | null {
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
  cfg: Cfg,
): Promise<{title: string; tags: string[]} | null> {
  let m = POST_RE.exec(pathname)
  if (m) {
    return buildPostTags(
      decodeURIComponent(m[1]),
      decodeURIComponent(m[2]),
      cfg,
    )
  }
  m = PROFILE_RE.exec(pathname)
  if (m) {
    return buildProfileTags(decodeURIComponent(m[1]), cfg)
  }
  return null
}

async function handleOg(
  request: Request,
  env: Env,
  pathname: string,
): Promise<Response> {
  // The SPA shell (index.html) for this route, via the assets SPA fallback.
  const shell = await env.ASSETS.fetch(request)
  const ct = shell.headers.get('content-type') || ''
  if (!ct.includes('text/html')) return shell

  const cfg = configFrom(env)
  const ua = request.headers.get('user-agent') || ''
  if (cfg.botsOnly && !BOT_RE.test(ua)) return shell

  // Buffer once, then enrich; any failure falls open to the unmodified shell.
  let html: string
  try {
    html = await shell.text()
  } catch {
    return shell
  }
  let out = html
  try {
    const built = await tagsFor(pathname, cfg)
    if (built) {
      const rewritten = rewriteHead(html, built.title, built.tags)
      if (rewritten != null) out = rewritten
    }
  } catch {
    // fail open: out stays = html (the default card)
  }
  const headers = new Headers(shell.headers)
  headers.delete('content-encoding')
  headers.delete('content-length')
  headers.set('content-type', 'text/html; charset=utf-8')
  headers.set('cache-control', CACHE_CONTROL)
  return new Response(out, {status: 200, headers})
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/geolocation') {
      return handleGeolocation(request, env)
    }
    if (POST_RE.test(url.pathname) || PROFILE_RE.test(url.pathname)) {
      return handleOg(request, env, url.pathname)
    }
    // Static asset, or index.html via the SPA fallback (not_found_handling).
    return env.ASSETS.fetch(request)
  },
}
