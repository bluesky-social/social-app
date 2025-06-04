export type ConstellationLink = {
  did: `did:${string}`
  collection: string
  rkey: string
}

type Collection =
  | 'app.bsky.actor.profile'
  | 'app.bsky.feed.generator'
  | 'app.bsky.feed.like'
  | 'app.bsky.feed.post'
  | 'app.bsky.feed.repost'
  | 'app.bsky.feed.threadgate'
  | 'app.bsky.graph.block'
  | 'app.bsky.graph.follow'
  | 'app.bsky.graph.list'
  | 'app.bsky.graph.listblock'
  | 'app.bsky.graph.listitem'
  | 'app.bsky.graph.starterpack'
  | 'app.bsky.graph.verification'
  | 'chat.bsky.actor.declaration'

const headers = new Headers({
  Accept: 'application/json',
  'User-Agent': 'blacksky.community (contact @aviva.gay)',
})

const makeReqUrl = (
  instance: string,
  route: string,
  params: Record<string, string | string[]>,
) => {
  const url = new URL(instance)
  url.pathname = route
  for (const [k, v] of Object.entries(params)) {
    // NOTE: in the future this should probably be a repeated param...
    if (Array.isArray(v)) {
      url.searchParams.set(k, v.join(','))
    } else {
      url.searchParams.set(k, v)
    }
  }
  return url
}

// using an async generator lets us kick off dependent requests before finishing pagination
// this doesn't solve the gross N+1 queries thing going on here to get records, but it should make it faster :3
export async function* constellationLinks(
  instance: string,
  params: {
    target: string
    collection: Collection
    path: string
    from_dids?: string[]
  },
) {
  const url = makeReqUrl(instance, 'links', params)

  const req = async () =>
    (await (await fetch(url, {method: 'GET', headers})).json()) as {
      total: number
      linking_records: ConstellationLink[]
      cursor: string | null
    }

  let cursor: string | null = null
  while (true) {
    const resp = await req()

    for (const link of resp.linking_records) {
      yield link
    }

    cursor = resp.cursor
    if (cursor === null) break
    url.searchParams.set('cursor', cursor)
  }
}

export async function constellationCounts(
  instance: string,
  params: {target: string},
) {
  const url = makeReqUrl(instance, 'links/all', params)
  const json = (await (await fetch(url, {method: 'GET', headers})).json()) as {
    links: {
      [P in Collection]?: {
        [k: string]: {distinct_dids: number; records: number} | undefined
      }
    }
  }
  const links = json.links
  return {
    likeCount:
      links?.['app.bsky.feed.like']?.['.subject.uri']?.distinct_dids ?? 0,
    repostCount:
      links?.['app.bsky.feed.repost']?.['.subject.uri']?.distinct_dids ?? 0,
    replyCount:
      links?.['app.bsky.feed.post']?.['.reply.parent.uri']?.records ?? 0,
  }
}

export function asUri(link: ConstellationLink): string {
  return `at://${link.did}/${link.collection}/${link.rkey}`
}

export async function* asyncGenMap<K, V>(
  gen: AsyncGenerator<K, void, unknown>,
  fn: (val: K) => V,
) {
  for await (const v of gen) {
    yield fn(v)
  }
}

export async function* asyncGenTryMap<K, V>(
  gen: AsyncGenerator<K, void, unknown>,
  fn: (val: K) => Promise<V>,
  err: (val: K, e: unknown) => void,
) {
  for await (const v of gen) {
    try {
      // make sure we resolve inside the try catch
      yield await fn(v)
    } catch (e) {
      err(v, e)
    }
  }
}

export function asyncGenFilter<K, V extends K>(
  gen: AsyncGenerator<K, void, unknown>,
  predicate: (item: K) => item is V,
): AsyncGenerator<Awaited<V>, void, unknown>

export function asyncGenFilter<K>(
  gen: AsyncGenerator<K, void, unknown>,
  predicate: (item: K) => boolean,
): AsyncGenerator<Awaited<K>, void, unknown>

export async function* asyncGenFilter<K>(
  gen: AsyncGenerator<K, void, unknown>,
  predicate: (item: K) => boolean,
) {
  for await (const v of gen) {
    if (predicate(v)) yield v
  }
}

export async function* asyncGenTake<V>(
  gen: AsyncGenerator<V, void, unknown>,
  n: number,
) {
  if (n <= 0) return

  let taken = 0
  for await (const v of gen) {
    yield v
    if (++taken >= n) break
  }
}

export async function* asyncGenDedupe<V, K>(
  gen: AsyncGenerator<V, void, unknown>,
  keyFn: (_: V) => K,
) {
  const seen = new Set<K>()
  for await (const v of gen) {
    const key = keyFn(v)
    if (!seen.has(key)) {
      seen.add(key)
      yield v
    }
  }
}

export async function asyncGenCollect<V>(
  gen: AsyncGenerator<V, void, unknown>,
) {
  const out = []
  for await (const v of gen) {
    out.push(v)
  }
  return out
}

export async function asyncGenFind<V>(
  gen: AsyncGenerator<V, void, unknown>,
  predicate: (item: V) => boolean,
) {
  for await (const v of gen) {
    if (predicate(v)) return v
  }
  return undefined
}

export function dbg<V>(v: V): V {
  console.log(v)
  return v
}
