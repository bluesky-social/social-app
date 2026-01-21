// TODO check Referrer.getReferrerInfo()

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
