import {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  AppBskyGraphGetList,
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
  httpStarterPackUriToAtUri,
  parseStarterPackUri,
} from 'lib/strings/starter-pack'
import {
  invalidateActorStarterPacksQuery,
  RQKEY,
} from 'state/queries/actor-starter-packs'
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
        // TODO remove this assertion
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
}: {
  onSuccess: () => void
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
      const listRes = await createStarterPackList({...params, agent})
      return await agent.app.bsky.graph.starterpack.create(
        {
          repo: agent.session?.did,
          validate: false, // TODO remove
        },
        {
          ...params,
          list: listRes.uri,
          createdAt: new Date().toISOString(),
        },
      )
    },
    onSuccess: async data => {
      await whenAppViewReady(
        agent,
        data.uri,
        (v?: AppBskyGraphDefs.StarterPackView) => {
          return typeof v.uri === 'string'
        },
      )
      await invalidateActorStarterPacksQuery({
        queryClient,
        did: agent.session?.did,
      })
      onSuccess()
    },
    onError: async error => {
      onError(error)
    },
  })
}

async function whenAppViewReady(
  agent: BskyAgent,
  uri: string,
  fn: (res?: AppBskyGraphGetList.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () =>
      agent.app.bsky.graph.getStarterPack({
        starterPack: uri,
      }),
  )
}
