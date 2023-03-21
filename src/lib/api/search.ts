/**
 * This is a temporary off-spec search endpoint
 * TODO removeme when we land this in proto!
 */
import {AppBskyFeedPost} from '@atproto/api'

const PROFILES_ENDPOINT = 'https://search.bsky.social/search/profiles'
const POSTS_ENDPOINT = 'https://search.bsky.social/search/posts'

export interface ProfileSearchItem {
  $type: string
  avatar: {
    cid: string
    mimeType: string
  }
  banner: {
    cid: string
    mimeType: string
  }
  description: string | undefined
  displayName: string | undefined
  did: string
}

export interface PostSearchItem {
  tid: string
  cid: string
  user: {
    did: string
    handle: string
  }
  post: AppBskyFeedPost.Record
}

export async function searchProfiles(
  query: string,
): Promise<ProfileSearchItem[]> {
  return await doFetch<ProfileSearchItem[]>(PROFILES_ENDPOINT, query)
}

export async function searchPosts(query: string): Promise<PostSearchItem[]> {
  return await doFetch<PostSearchItem[]>(POSTS_ENDPOINT, query)
}

async function doFetch<T>(endpoint: string, query: string): Promise<T> {
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), 15e3)

  const uri = new URL(endpoint)
  uri.searchParams.set('q', query)

  const res = await fetch(String(uri), {
    method: 'get',
    headers: {
      accept: 'application/json',
    },
    signal: controller.signal,
  })

  const resHeaders: Record<string, string> = {}
  res.headers.forEach((value: string, key: string) => {
    resHeaders[key] = value
  })
  let resBody = await res.json()

  clearTimeout(to)

  return resBody as unknown as T
}
