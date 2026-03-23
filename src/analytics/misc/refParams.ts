/**
 * This is used for our own Bluesky post embeds, and maybe other things.
 *
 * In the case of our embeds, `ref_src=embed`. Not sure if `ref_url` is used.
 */

import * as env from '#/env'

let refSrc = ''
let refUrl = ''
if (env.IS_WEB) {
  const params = new URLSearchParams(window.location.search)
  refSrc = params.get('ref_src') ?? ''
  refUrl = decodeURIComponent(params.get('ref_url') ?? '')
}

export const src = refSrc
export const url = refUrl
