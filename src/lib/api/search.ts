/**
 * This is a temporary off-spec search endpoint
 * TODO removeme when we land this in proto!
 */
import {AppBskyFeedPost} from '@atproto/api'
import {SEARCH_HOST} from 'lib/constants'
import {RootStoreModel} from 'state/index'

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
  rootStore: RootStoreModel,
  query: string,
): Promise<ProfileSearchItem[]> {
  const host = SEARCH_HOST(rootStore.session.currentSession?.service || '')
  const endpoint = `${host}/search/profiles`
  return await doFetch<ProfileSearchItem[]>(endpoint, query)
}

export async function searchPosts(
  rootStore: RootStoreModel,
  query: string,
): Promise<PostSearchItem[]> {
  const host = SEARCH_HOST(rootStore.session.currentSession?.service || '')
  const endpoint = `${host}/search/posts`
  return await doFetch<PostSearchItem[]>(endpoint, query)
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
