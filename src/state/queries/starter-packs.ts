import {
  type AppGndrFeedDefs,
  AppGndrGraphDefs,
  type AppGndrGraphGetStarterPack,
  AppGndrGraphStarterpack,
  type AppGndrRichtextFacet,
  AtUri,
  type GndrAgent,
  RichText,
} from '@gander-social-atproto/api'
import {type StarterPackView} from '@gander-social-atproto/api/dist/client/types/app/gndr/graph/defs'
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
import {useAgent} from '#/state/session'
import * as gndr from '#/types/gndr'

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
  const agent = useAgent()

  return useQuery<StarterPackView>({
    queryKey: RQKEY(uri ? {uri} : {did, rkey}),
    queryFn: async () => {
      if (!uri) {
        uri = `at://${did}/app.gndr.graph.starterpack/${rkey}`
      } else if (uri && !uri.startsWith('at://')) {
        uri = httpStarterPackUriToAtUri(uri) as string
      }

      const res = await agent.app.gndr.graph.getStarterPack({
        starterPack: uri,
      })
      return res.data.starterPack
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
  profiles: gndr.profile.AnyProfileView[]
  feeds?: AppGndrFeedDefs.GeneratorView[]
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
    mutationFn: async ({name, description, feeds, profiles}) => {
      let descriptionFacets: AppGndrRichtextFacet.Main[] | undefined
      if (description) {
        const rt = new RichText({text: description})
        await rt.detectFacets(agent)
        descriptionFacets = rt.facets
      }

      let listRes
      listRes = await createStarterPackList({
        name,
        description,
        profiles,
        descriptionFacets,
        agent,
      })

      return await agent.app.gndr.graph.starterpack.create(
        {
          repo: agent.assertDid,
        },
        {
          name,
          description,
          descriptionFacets,
          list: listRes?.uri,
          feeds: feeds?.map(f => ({uri: f.uri})),
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
      currentStarterPack: AppGndrGraphDefs.StarterPackView
      currentListItems: AppGndrGraphDefs.ListItemView[]
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
      let descriptionFacets: AppGndrRichtextFacet.Main[] | undefined
      if (description) {
        const rt = new RichText({text: description})
        await rt.detectFacets(agent)
        descriptionFacets = rt.facets
      }

      if (!AppGndrGraphStarterpack.isRecord(currentStarterPack.record)) {
        throw new Error('Invalid starter pack')
      }

      const removedItems = currentListItems.filter(
        i =>
          i.subject.did !== agent.session?.did &&
          !profiles.find(p => p.did === i.subject.did && p.did),
      )
      if (removedItems.length !== 0) {
        const chunks = chunk(removedItems, 50)
        for (const chunk of chunks) {
          await agent.com.atproto.repo.applyWrites({
            repo: agent.session!.did,
            writes: chunk.map(i => ({
              $type: 'com.atproto.repo.applyWrites#delete',
              collection: 'app.gndr.graph.listitem',
              rkey: new AtUri(i.uri).rkey,
            })),
          })
        }
      }

      const addedProfiles = profiles.filter(
        p => !currentListItems.find(i => i.subject.did === p.did),
      )
      if (addedProfiles.length > 0) {
        const chunks = chunk(addedProfiles, 50)
        for (const chunk of chunks) {
          await agent.com.atproto.repo.applyWrites({
            repo: agent.session!.did,
            writes: chunk.map(p => ({
              $type: 'com.atproto.repo.applyWrites#create',
              collection: 'app.gndr.graph.listitem',
              value: {
                $type: 'app.gndr.graph.listitem',
                subject: p.did,
                list: currentStarterPack.list?.uri,
                createdAt: new Date().toISOString(),
              },
            })),
          })
        }
      }

      const rkey = parseStarterPackUri(currentStarterPack.uri)!.rkey
      await agent.com.atproto.repo.putRecord({
        repo: agent.session!.did,
        collection: 'app.gndr.graph.starterpack',
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
        throw new Error(`Requires signed in user`)
      }

      if (listUri) {
        await agent.app.gndr.graph.list.delete({
          repo: agent.session.did,
          rkey: new AtUri(listUri).rkey,
        })
      }
      await agent.app.gndr.graph.starterpack.delete({
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
  agent: GndrAgent,
  uri: string,
  fn: (res?: AppGndrGraphGetStarterPack.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () => agent.app.gndr.graph.getStarterPack({starterPack: uri}),
  )
}

export async function precacheStarterPack(
  queryClient: QueryClient,
  starterPack:
    | AppGndrGraphDefs.StarterPackViewBasic
    | AppGndrGraphDefs.StarterPackView,
) {
  if (!AppGndrGraphStarterpack.isRecord(starterPack.record)) {
    return
  }

  let starterPackView: AppGndrGraphDefs.StarterPackView | undefined
  if (AppGndrGraphDefs.isStarterPackView(starterPack)) {
    starterPackView = starterPack
  } else if (
    AppGndrGraphDefs.isStarterPackViewBasic(starterPack) &&
    gndr.validate(starterPack.record, AppGndrGraphStarterpack.validateRecord)
  ) {
    const listView: AppGndrGraphDefs.ListViewBasic = {
      uri: starterPack.record.list,
      // This will be populated once the data from server is fetched
      cid: '',
      name: starterPack.record.name,
      purpose: 'app.gndr.graph.defs#referencelist',
    }
    starterPackView = {
      ...starterPack,
      $type: 'app.gndr.graph.defs#starterPackView',
      list: listView,
    }
  }

  if (starterPackView) {
    queryClient.setQueryData(RQKEY({uri: starterPack.uri}), starterPackView)
  }
}
