import {AppBskyGraphDefs, AtUri} from '@atproto/api'

const DEV = process.env.NODE_ENV === 'development'
const HOST = DEV
  ? `http://localhost:3000/start`
  : `https://ogcard.cdn.bsky.app/start`

export function getStarterPackImageUri(
  record: AppBskyGraphDefs.StarterPackViewBasic,
) {
  const urip = new AtUri(record.uri)
  return `${HOST}/${record.creator.did}/${urip.rkey}`
}
