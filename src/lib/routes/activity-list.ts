import {AtUri} from '@atproto/syntax'

const POST_COLLECTION = 'app.bsky.feed.post'

/**
 * Link to the activity list screen, which shows the given posts as a feed.
 *
 * A notification group can hold up to 200 posts, so the list is compacted to
 * keep the URL short. Each author's DID appears once, then each post is
 * `$n/rkey`, where `n` is the 1-based index of its author's DID, e.g.
 * `did:plc:a,did:plc:b,$1/3k2a,$2/3k2b,$1/3k2c`. Order is preserved. Any
 * at-uri that isn't a post by a DID is kept whole.
 */
export function makeActivityListLink(uris: string[]) {
  const didIndexes = new Map<string, number>()
  const entries: string[] = []
  for (const uri of uris) {
    const urip = new AtUri(uri)
    if (urip.collection !== POST_COLLECTION || !urip.host.startsWith('did:')) {
      entries.push(uri)
      continue
    }
    let index = didIndexes.get(urip.host)
    if (index === undefined) {
      index = didIndexes.size + 1
      didIndexes.set(urip.host, index)
    }
    entries.push(`$${index}/${urip.rkey}`)
  }
  const posts = [...didIndexes.keys(), ...entries].join(',')
  return `/notifications/activity?posts=${encodeURIComponent(posts)}`
}

/**
 * Reads the `posts` param of an activity list link back into at-uris. Also
 * accepts the older form, a plain list of at-uris. Entries it can't read are
 * skipped.
 */
export function parseActivityListPosts(posts: string): string[] {
  const dids: string[] = []
  const uris: string[] = []
  for (const entry of posts.split(',')) {
    if (entry.startsWith('did:')) {
      dids.push(entry)
    } else if (entry.startsWith('at://')) {
      uris.push(entry)
    } else {
      const match = /^\$(\d+)\/(.+)$/.exec(entry)
      const did = match && dids[Number(match[1]) - 1]
      if (did) {
        uris.push(`at://${did}/${POST_COLLECTION}/${match[2]}`)
      }
    }
  }
  return uris
}
