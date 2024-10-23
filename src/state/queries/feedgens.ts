import {BskyAgent} from '@atproto/api'

import {networkRetry} from '#/lib/async/retry'

const $TYPE = 'club.feeed.submission'

/*
{
  $type: 'club.feeed.submission',
  feed: 'at://...',
  post: 'at://...',
}
*/

export async function writeFeedSubmissionRecords({
  agent,
  records,
}: {
  agent: BskyAgent
  records: {feedUri: string; postUri: string}[]
}) {
  await networkRetry(2, () =>
    agent.api.com.atproto.repo.applyWrites({
      repo: agent.session!.did,
      writes: records.map(({feedUri, postUri}) => ({
        $type: 'com.atproto.repo.applyWrites#create',
        collection: $TYPE,
        value: {
          $type: $TYPE,
          feed: feedUri,
          post: postUri,
        },
      })),
    }),
  )
}
