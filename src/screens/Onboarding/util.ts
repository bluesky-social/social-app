import {AppBskyGraphFollow, AppBskyGraphGetFollows} from '@atproto/api'

import {until} from '#/lib/async/until'
import {getAgent} from '#/state/session'
import {PRIMARY_FEEDS} from './StepAlgoFeeds'

function shuffle(array: any) {
  let currentIndex = array.length,
    randomIndex

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ]
  }

  return array
}

export function aggregateInterestItems(
  interests: string[],
  map: {[key: string]: string[]},
  fallbackItems: string[],
) {
  const selected = interests.length
  const all = interests
    .map(i => {
      // suggestions from server
      const rawSuggestions = map[i]

      // safeguard against a missing interest->suggestion mapping
      if (!rawSuggestions || !rawSuggestions.length) {
        return []
      }

      const suggestions = shuffle(rawSuggestions)

      if (selected === 1) {
        return suggestions // return all
      } else if (selected === 2) {
        return suggestions.slice(0, 5) // return 5
      } else {
        return suggestions.slice(0, 3) // return 3
      }
    })
    .flat()
  // dedupe suggestions
  const results = Array.from(new Set(all))

  // backfill
  if (results.length < 20) {
    results.push(...shuffle(fallbackItems))
  }

  // dedupe and return 20
  return Array.from(new Set(results)).slice(0, 20)
}

export async function bulkWriteFollows(dids: string[]) {
  const session = getAgent().session

  if (!session) {
    throw new Error(`bulkWriteFollows failed: no session`)
  }

  const followRecords: AppBskyGraphFollow.Record[] = dids.map(did => {
    return {
      $type: 'app.bsky.graph.follow',
      subject: did,
      createdAt: new Date().toISOString(),
    }
  })
  const followWrites = followRecords.map(r => ({
    $type: 'com.atproto.repo.applyWrites#create',
    collection: 'app.bsky.graph.follow',
    value: r,
  }))

  await getAgent().com.atproto.repo.applyWrites({
    repo: session.did,
    writes: followWrites,
  })
  await whenFollowsIndexed(session.did, res => !!res.data.follows.length)
}

async function whenFollowsIndexed(
  actor: string,
  fn: (res: AppBskyGraphGetFollows.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () =>
      getAgent().app.bsky.graph.getFollows({
        actor,
        limit: 1,
      }),
  )
}

/**
 * Kinda hacky, but we want For Your or Discover to appear as the first pinned
 * feed after Following
 */
export function sortPrimaryAlgorithmFeeds(uris: string[]) {
  return uris.sort((a, b) => {
    if (a === PRIMARY_FEEDS[0].uri) {
      return -1
    }
    if (b === PRIMARY_FEEDS[0].uri) {
      return 1
    }
    if (a === PRIMARY_FEEDS[1].uri) {
      return -1
    }
    if (b === PRIMARY_FEEDS[1].uri) {
      return 1
    }
    return a.localeCompare(b)
  })
}
