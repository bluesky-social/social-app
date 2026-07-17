import {type Client} from '@atproto/lex-client'
import {AtUri, type AtUriString, type DatetimeString} from '@atproto/syntax'
import {RichText} from '@bsky.app/sdk/richtext'
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import chunk from 'lodash.chunk'

import {until} from '#/lib/async/until'
import {createStarterPackList} from '#/lib/generate-starterpack'
import {
  createStarterPackUri,
  httpStarterPackUriToAtUri,
  parseStarterPackUri,
} from '#/lib/strings/starter-pack'
import {invalidateActorStarterPacksQuery} from '#/state/queries/actor-starter-packs'
import {STALE} from '#/state/queries/index'
import {invalidateListMembersQuery} from '#/state/queries/list-members'
import {useAppviewClient, usePdsClient} from '#/state/session'
import {app, com} from '#/lexicons'
import * as bsky from '#/types/bsky'

const RQKEY_ROOT = 'starter-pack'
const RQKEY = ({
  uri,
  did,
  rkey,
}: {
  uri?: string
  did?: string
  rkey?: string
}) => {
  if (uri?.startsWith('https://') || uri?.startsWith('at://')) {
    const parsed = parseStarterPackUri(uri)
    return [RQKEY_ROOT, parsed?.name, parsed?.rkey]
  } else {
    return [RQKEY_ROOT, did, rkey]
  }
}

export function useStarterPackQuery({
  uri,
  did,
  rkey,
}: {
  uri?: string
  did?: string
  rkey?: string
}) {
  const client = useAppviewClient()

  return useQuery<app.bsky.graph.defs.StarterPackView>({
    queryKey: RQKEY(uri ? {uri} : {did, rkey}),
    queryFn: async () => {
      if (!uri) {
        uri = `at://${did}/app.bsky.graph.starterpack/${rkey}`
      } else if (uri && !uri.startsWith('at://')) {
        uri = httpStarterPackUriToAtUri(uri) as string
      }

      const res = await client.call(app.bsky.graph.getStarterPack, {
        starterPack: uri as AtUriString,
      })
      return res.starterPack
    },
    enabled: Boolean(uri) || Boolean(did && rkey),
    staleTime: STALE.MINUTES.FIVE,
  })
}

export async function invalidateStarterPack({
  queryClient,
  did,
  rkey,
}: {
  queryClient: QueryClient
  did: string
  rkey: string
}) {
  await queryClient.invalidateQueries({queryKey: RQKEY({did, rkey})})
}

interface UseCreateStarterPackMutationParams {
  name: string
  description?: string
  profiles: bsky.profile.AnyProfileView[]
  feeds?: app.bsky.feed.defs.GeneratorView[]
}

export function useCreateStarterPackMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (data: {uri: string; cid: string}) => void
  onError: (e: Error) => void
}) {
  const queryClient = useQueryClient()
  const appviewClient = useAppviewClient()
  const pdsClient = usePdsClient()

  return useMutation<
    {uri: string; cid: string},
    Error,
    UseCreateStarterPackMutationParams
  >({
    mutationFn: async ({name, description, feeds, profiles}) => {
      let descriptionFacets: app.bsky.richtext.facet.Main[] | undefined
      if (description) {
        const rt = new RichText({text: description})
        await rt.detectFacets(appviewClient)
        descriptionFacets = rt.facets
      }

      let listRes
      listRes = await createStarterPackList({
        name,
        description,
        profiles,
        descriptionFacets,
        client: pdsClient,
      })

      return await pdsClient.create(app.bsky.graph.starterpack, {
        name,
        description,
        descriptionFacets,
        list: listRes?.uri as AtUriString,
        feeds: feeds?.map(f => ({uri: f.uri})),
        createdAt: new Date().toISOString() as DatetimeString,
      })
    },
    onSuccess: async data => {
      await whenAppViewReady(appviewClient, data.uri, v => {
        return typeof v?.starterPack.uri === 'string'
      })
      await invalidateActorStarterPacksQuery({
        queryClient,
        did: pdsClient.assertDid,
      })
      onSuccess(data)
    },
    onError: async error => {
      onError(error)
    },
  })
}

export function useEditStarterPackMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void
  onError: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  const appviewClient = useAppviewClient()
  const pdsClient = usePdsClient()

  return useMutation<
    void,
    Error,
    UseCreateStarterPackMutationParams & {
      currentStarterPack: app.bsky.graph.defs.StarterPackView
      currentListItems: app.bsky.graph.defs.ListItemView[]
    }
  >({
    mutationFn: async ({
      name,
      description,
      feeds,
      profiles,
      currentStarterPack,
      currentListItems,
    }) => {
      let descriptionFacets: app.bsky.richtext.facet.Main[] | undefined
      if (description) {
        const rt = new RichText({text: description})
        await rt.detectFacets(appviewClient)
        descriptionFacets = rt.facets
      }

      if (!bsky.isType(app.bsky.graph.starterpack, currentStarterPack.record)) {
        throw new Error('Invalid starter pack')
      }

      const removedItems = currentListItems.filter(
        i =>
          i.subject.did !== pdsClient.did &&
          !profiles.find(p => p.did === i.subject.did && p.did),
      )
      if (removedItems.length !== 0) {
        const chunks = chunk(removedItems, 50)
        for (const chunk of chunks) {
          await pdsClient.call(com.atproto.repo.applyWrites, {
            repo: pdsClient.assertDid,
            writes: chunk.map(
              (
                i,
              ): com.atproto.repo.applyWrites.$InputBody['writes'][number] => ({
                $type: 'com.atproto.repo.applyWrites#delete',
                collection: 'app.bsky.graph.listitem',
                rkey: new AtUri(i.uri).rkey,
              }),
            ),
          })
        }
      }

      const addedProfiles = profiles.filter(
        p => !currentListItems.find(i => i.subject.did === p.did),
      )
      if (addedProfiles.length > 0) {
        const chunks = chunk(addedProfiles, 50)
        for (const chunk of chunks) {
          await pdsClient.call(com.atproto.repo.applyWrites, {
            repo: pdsClient.assertDid,
            writes: chunk.map(
              (
                p,
              ): com.atproto.repo.applyWrites.$InputBody['writes'][number] => ({
                $type: 'com.atproto.repo.applyWrites#create',
                collection: 'app.bsky.graph.listitem',
                value: {
                  $type: 'app.bsky.graph.listitem',
                  subject: p.did,
                  list: currentStarterPack.list?.uri,
                  createdAt: new Date().toISOString(),
                },
              }),
            ),
          })
        }
      }

      const rkey = parseStarterPackUri(currentStarterPack.uri)!.rkey
      await pdsClient.call(com.atproto.repo.putRecord, {
        repo: pdsClient.assertDid,
        collection: 'app.bsky.graph.starterpack',
        rkey,
        record: {
          $type: 'app.bsky.graph.starterpack',
          name,
          description,
          descriptionFacets,
          list: currentStarterPack.list?.uri,
          feeds,
          createdAt: currentStarterPack.record.createdAt,
          updatedAt: new Date().toISOString(),
        },
      })
    },
    onSuccess: async (_, {currentStarterPack}) => {
      const parsed = parseStarterPackUri(currentStarterPack.uri)
      await whenAppViewReady(appviewClient, currentStarterPack.uri, v => {
        return currentStarterPack.cid !== v?.starterPack.cid
      })
      await invalidateActorStarterPacksQuery({
        queryClient,
        did: pdsClient.assertDid,
      })
      if (currentStarterPack.list) {
        await invalidateListMembersQuery({
          queryClient,
          uri: currentStarterPack.list.uri,
        })
      }
      await invalidateStarterPack({
        queryClient,
        did: pdsClient.assertDid,
        rkey: parsed!.rkey,
      })
      onSuccess()
    },
    onError: error => {
      onError(error)
    },
  })
}

export function useDeleteStarterPackMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void
  onError: (error: Error) => void
}) {
  const appviewClient = useAppviewClient()
  const pdsClient = usePdsClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({listUri, rkey}: {listUri?: string; rkey: string}) => {
      const did = pdsClient.assertDid

      if (listUri) {
        await pdsClient.delete(app.bsky.graph.list, {
          repo: did,
          rkey: new AtUri(listUri).rkey,
        })
      }
      await pdsClient.delete(app.bsky.graph.starterpack, {
        repo: did,
        rkey,
      })
    },
    onSuccess: async (_, {listUri, rkey}) => {
      const uri = createStarterPackUri({
        did: pdsClient.assertDid,
        rkey,
      })

      if (uri) {
        await whenAppViewReady(appviewClient, uri, v => {
          return Boolean(v?.starterPack) === false
        })
      }

      if (listUri) {
        await invalidateListMembersQuery({queryClient, uri: listUri})
      }
      await invalidateActorStarterPacksQuery({
        queryClient,
        did: pdsClient.assertDid,
      })
      await invalidateStarterPack({
        queryClient,
        did: pdsClient.assertDid,
        rkey,
      })
      onSuccess()
    },
    onError: error => {
      onError(error)
    },
  })
}

async function whenAppViewReady(
  client: Client,
  uri: string,
  fn: (res?: app.bsky.graph.getStarterPack.$OutputBody) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () =>
      client.call(app.bsky.graph.getStarterPack, {
        starterPack: uri as AtUriString,
      }),
  )
}

export function precacheStarterPack(
  queryClient: QueryClient,
  starterPack:
    | app.bsky.graph.defs.StarterPackViewBasic
    | app.bsky.graph.defs.StarterPackView,
) {
  if (!bsky.isType(app.bsky.graph.starterpack, starterPack.record)) {
    return
  }

  let starterPackView: app.bsky.graph.defs.StarterPackView | undefined
  if (bsky.isType(app.bsky.graph.defs.starterPackView, starterPack)) {
    starterPackView = starterPack
  } else if (
    bsky.isType(app.bsky.graph.defs.starterPackViewBasic, starterPack) &&
    bsky.matches(app.bsky.graph.starterpack, starterPack.record)
  ) {
    let feeds: app.bsky.feed.defs.GeneratorView[] | undefined
    if (starterPack.record.feeds) {
      feeds = []
      for (const feed of starterPack.record.feeds) {
        // note: types are wrong? claims to be `FeedItem`, but we actually
        // get un$typed `GeneratorView` objects here -sfn
        if (bsky.matches(app.bsky.feed.defs.generatorView, feed)) {
          feeds.push(feed)
        }
      }
    }

    const listView: app.bsky.graph.defs.ListViewBasic = {
      uri: starterPack.record.list,
      // This will be populated once the data from server is fetched
      cid: '',
      name: starterPack.record.name,
      purpose: 'app.bsky.graph.defs#referencelist',
    }
    starterPackView = {
      ...starterPack,
      $type: 'app.bsky.graph.defs#starterPackView',
      list: listView,
      feeds,
    }
  }

  if (starterPackView) {
    queryClient.setQueryData(RQKEY({uri: starterPack.uri}), starterPackView)
  }
}
