import {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  AppBskyGraphGetStarterPack,
  AppBskyGraphStarterpack,
  AtUri,
  BskyAgent,
} from '@atproto/api'
import {StarterPackView} from '@atproto/api/dist/client/types/app/bsky/graph/defs'
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {until} from 'lib/async/until'
import {createStarterPackList} from 'lib/generate-starterpack'
import {
  createStarterPackUri,
  httpStarterPackUriToAtUri,
  parseStarterPackUri,
} from 'lib/strings/starter-pack'
import {invalidateActorStarterPacksQuery} from 'state/queries/actor-starter-packs'
import {invalidateListMembersQuery} from 'state/queries/list-members'
import {useAgent} from 'state/session'

const RQKEY_ROOT = 'starter-pack'
const RQKEY = (did?: string, rkey?: string) => {
  if (did?.startsWith('https://') || did?.startsWith('at://')) {
    const parsed = parseStarterPackUri(did)
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
  const agent = useAgent()

  return useQuery<StarterPackView>({
    queryKey: RQKEY(did, rkey),
    queryFn: async () => {
      if (!uri) {
        uri = `at://${did}/app.bsky.graph.starterpack/${rkey}`
      } else if (uri && !uri.startsWith('at://')) {
        uri = httpStarterPackUriToAtUri(uri) as string
      }

      const res = await agent.app.bsky.graph.getStarterPack({
        starterPack: uri,
      })
      return res.data.starterPack
    },
    enabled: Boolean(uri) || Boolean(did && rkey),
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
  await queryClient.invalidateQueries({queryKey: RQKEY(did, rkey)})
}

interface UseCreateStarterPackMutationParams {
  name: string
  description?: string
  descriptionFacets: []
  profiles: AppBskyActorDefs.ProfileViewBasic[]
  feeds?: AppBskyFeedDefs.GeneratorView[]
}

export function useCreateStarterPackMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (data: {uri: string; cid: string}) => void
  onError: (e: Error) => void
}) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation<
    {uri: string; cid: string},
    Error,
    UseCreateStarterPackMutationParams
  >({
    mutationFn: async params => {
      let listRes
      listRes = await createStarterPackList({...params, agent})
      return await agent.app.bsky.graph.starterpack.create(
        {
          repo: agent.session?.did,
        },
        {
          ...params,
          list: listRes?.uri,
          createdAt: new Date().toISOString(),
        },
      )
    },
    onSuccess: async data => {
      await whenAppViewReady(agent, data.uri, v => {
        return typeof v?.data.starterPack.uri === 'string'
      })
      await invalidateActorStarterPacksQuery({
        queryClient,
        did: agent.session!.did,
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
  const agent = useAgent()

  return useMutation<
    void,
    Error,
    UseCreateStarterPackMutationParams & {
      currentStarterPack: AppBskyGraphDefs.StarterPackView
      currentListItems: AppBskyGraphDefs.ListItemView[]
    }
  >({
    mutationFn: async params => {
      const {
        name,
        description,
        descriptionFacets,
        feeds,
        profiles,
        currentStarterPack,
        currentListItems,
      } = params

      if (!AppBskyGraphStarterpack.isRecord(currentStarterPack.record)) {
        throw new Error('Invalid starter pack')
      }

      const removedItems = currentListItems.filter(
        i =>
          i.subject.did !== agent.session?.did &&
          !profiles.find(p => p.did === i.subject.did && p.did),
      )

      if (removedItems.length !== 0) {
        await agent.com.atproto.repo.applyWrites({
          repo: agent.session!.did,
          writes: removedItems.map(i => ({
            $type: 'com.atproto.repo.applyWrites#delete',
            collection: 'app.bsky.graph.listitem',
            rkey: new AtUri(i.uri).rkey,
          })),
        })
      }

      const addedProfiles = profiles.filter(
        p => !currentListItems.find(i => i.subject.did === p.did),
      )

      if (addedProfiles.length > 0) {
        await agent.com.atproto.repo.applyWrites({
          repo: agent.session!.did,
          writes: addedProfiles.map(p => ({
            $type: 'com.atproto.repo.applyWrites#create',
            collection: 'app.bsky.graph.listitem',
            value: {
              $type: 'app.bsky.graph.listitem',
              subject: p.did,
              list: currentStarterPack.list?.uri,
              createdAt: new Date().toISOString(),
            },
          })),
        })
      }

      const rkey = parseStarterPackUri(currentStarterPack.uri)!.rkey
      await agent.com.atproto.repo.putRecord({
        repo: agent.session!.did,
        collection: 'app.bsky.graph.starterpack',
        rkey,
        record: {
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
      await whenAppViewReady(agent, currentStarterPack.uri, v => {
        return currentStarterPack.cid !== v?.data.starterPack.cid
      })
      await invalidateActorStarterPacksQuery({
        queryClient,
        did: agent.session!.did,
      })
      if (currentStarterPack.list) {
        await invalidateListMembersQuery({
          queryClient,
          uri: currentStarterPack.list.uri,
        })
      }
      await invalidateStarterPack({
        queryClient,
        did: agent.session!.did,
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
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({listUri, rkey}: {listUri?: string; rkey: string}) => {
      if (!agent.session) {
        throw new Error(`Requires logged in user`)
      }

      if (listUri) {
        await agent.app.bsky.graph.list.delete({
          repo: agent.session.did,
          rkey: new AtUri(listUri).rkey,
        })
      }
      await agent.app.bsky.graph.starterpack.delete({
        repo: agent.session.did,
        rkey,
      })
    },
    onSuccess: async (_, {listUri, rkey}) => {
      const uri = createStarterPackUri({
        did: agent.session!.did,
        rkey,
      })

      if (uri) {
        await whenAppViewReady(agent, uri, v => {
          return Boolean(v?.data?.starterPack) === false
        })
      }

      if (listUri) {
        await invalidateListMembersQuery({queryClient, uri: listUri})
      }
      await invalidateActorStarterPacksQuery({
        queryClient,
        did: agent.session!.did,
      })
      await invalidateStarterPack({
        queryClient,
        did: agent.session!.did,
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
  agent: BskyAgent,
  uri: string,
  fn: (res?: AppBskyGraphGetStarterPack.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () => agent.app.bsky.graph.getStarterPack({starterPack: uri}),
  )
}
