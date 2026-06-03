/**
 * Local shim for `app.bsky.embed.gallery` until @atproto/api ships the
 * generated types. Mirrors the shape from atproto PR #4827:
 * https://github.com/bluesky-social/atproto/pull/4827
 *
 * Once the lexicon ships and we bump @atproto/api, delete this file and
 * replace `import {AppBskyEmbedGallery} from '#/lib/api/gallery-embed-shim'`
 * with `import {AppBskyEmbedGallery} from '@atproto/api'`.
 */
import * as gallery from './gallery-embed-shim.impl'

export {gallery as AppBskyEmbedGallery}
