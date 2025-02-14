import {Image as RNImage} from 'react-native-image-crop-picker'
import {
  AppBskyGraphDefs,
  AppBskyGraphGetList,
  AppBskyGraphList,
  AtUri,
  BskyAgent,
  Facet,
} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import chunk from 'lodash.chunk'

import {uploadBlob} from '#/lib/api'
import {until} from '#/lib/async/until'
import {STALE} from '#/state/queries'
import {useAgent, useSession} from '../session'
import {invalidate as invalidateMyLists} from './my-lists'
import {RQKEY as PROFILE_LISTS_RQKEY} from './profile-lists'

export const RQKEY_ROOT = 'list'
export const RQKEY = (uri: string) => [RQKEY_ROOT, uri]

export function useListQuery(uri?: string) {
  const agent = useAgent()
  return useQuery<AppBskyGraphDefs.ListView, Error>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(uri || ''),
    async queryFn() {
      if (!uri) {
        throw new Error('URI not provided')
      }
      const res = await agent.app.bsky.graph.getList({
        list: uri,
        limit: 1,
      })
      return res.data.list
    },
    enabled: !!uri,
  })
}

export interface ListCreateMutateParams {
  purpose: string
  name: string
  description: string
  descriptionFacets: Facet[] | undefined
  avatar: RNImage | null | undefined
}
export function useListCreateMutation() {
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const agent = useAgent()
  return useMutation<{uri: string; cid: string}, Error, ListCreateMutateParams>(
    {
      async mutationFn({
        purpose,
        name,
        description,
        descriptionFacets,
        avatar,
      }) {
        if (!currentAccount) {
          throw new Error('Not signed in')
        }
        if (
          purpose !== 'app.bsky.graph.defs#curatelist' &&
          purpose !== 'app.bsky.graph.defs#modlist'
        ) {
          throw new Error('Invalid list purpose: must be curatelist or modlist')
        }
        const record: AppBskyGraphList.Record = {
          purpose,
          name,
          description,
          descriptionFacets,
          avatar: undefined,
          createdAt: new Date().toISOString(),
        }
        if (avatar) {
          const blobRes = await uploadBlob(agent, avatar.path, avatar.mime)
          record.avatar = blobRes.data.blob
        }
        const res = await agent.app.bsky.graph.list.create(
          {
            repo: currentAccount.did,
          },
          record,
        )

        // wait for the appview to update
        await whenAppViewReady(
          agent,
          res.uri,
          (v: AppBskyGraphGetList.Response) => {
            return typeof v?.data?.list.uri === 'string'
          },
        )
        return res
      },
      onSuccess() {
        invalidateMyLists(queryClient)
        queryClient.invalidateQueries({
          queryKey: PROFILE_LISTS_RQKEY(currentAccount!.did),
        })
      },
    },
  )
}

export interface ListMetadataMutateParams {
  uri: string
  name: string
  description: string
  descriptionFacets: Facet[] | undefined
  avatar: RNImage | null | undefined
}
export function useListMetadataMutation() {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation<
    {uri: string; cid: string},
    Error,
    ListMetadataMutateParams
  >({
    async mutationFn({uri, name, description, descriptionFacets, avatar}) {
      const {hostname, rkey} = new AtUri(uri)
      if (!currentAccount) {
        throw new Error('Not signed in')
      }
      if (currentAccount.did !== hostname) {
        throw new Error('You do not own this list')
      }

      // get the current record
      const {value: record} = await agent.app.bsky.graph.list.get({
        repo: currentAccount.did,
        rkey,
      })

      // update the fields
      record.name = name
      record.description = description
      record.descriptionFacets = descriptionFacets
      if (avatar) {
        const blobRes = await uploadBlob(agent, avatar.path, avatar.mime)
        record.avatar = blobRes.data.blob
      } else if (avatar === null) {
        record.avatar = undefined
      }
      const res = (
        await agent.com.atproto.repo.putRecord({
          repo: currentAccount.did,
          collection: 'app.bsky.graph.list',
          rkey,
          record,
        })
      ).data

      // wait for the appview to update
      await whenAppViewReady(
        agent,
        res.uri,
        (v: AppBskyGraphGetList.Response) => {
          const list = v.data.list
          return (
            list.name === record.name && list.description === record.description
          )
        },
      )
      return res
    },
    onSuccess(data, variables) {
      invalidateMyLists(queryClient)
      queryClient.invalidateQueries({
        queryKey: PROFILE_LISTS_RQKEY(currentAccount!.did),
      })
      queryClient.invalidateQueries({
        queryKey: RQKEY(variables.uri),
      })
    },
  })
}

export function useListDeleteMutation() {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation<void, Error, {uri: string}>({
    mutationFn: async ({uri}) => {
      if (!currentAccount) {
        return
      }
      // fetch all the listitem records that belong to this list
      let cursor
      let listitemRecordUris: string[] = []
      for (let i = 0; i < 100; i++) {
        const res = await agent.app.bsky.graph.listitem.list({
          repo: currentAccount.did,
          cursor,
          limit: 100,
        })
        listitemRecordUris = listitemRecordUris.concat(
          res.records
            .filter(record => record.value.list === uri)
            .map(record => record.uri),
        )
        cursor = res.cursor
        if (!cursor) {
          break
        }
      }

      // batch delete the list and listitem records
      const createDel = (uri: string) => {
        const urip = new AtUri(uri)
        return {
          $type: 'com.atproto.repo.applyWrites#delete',
          collection: urip.collection,
          rkey: urip.rkey,
        }
      }
      const writes = listitemRecordUris
        .map(uri => createDel(uri))
        .concat([createDel(uri)])

      // apply in chunks
      for (const writesChunk of chunk(writes, 10)) {
        await agent.com.atproto.repo.applyWrites({
          repo: currentAccount.did,
          writes: writesChunk,
        })
      }

      // wait for the appview to update
      await whenAppViewReady(agent, uri, (v: AppBskyGraphGetList.Response) => {
        return !v?.success
      })
    },
    onSuccess() {
      invalidateMyLists(queryClient)
      queryClient.invalidateQueries({
        queryKey: PROFILE_LISTS_RQKEY(currentAccount!.did),
      })
      // TODO!! /* dont await */ this.rootStore.preferences.removeSavedFeed(this.uri)
    },
  })
}

export function useListMuteMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()
  return useMutation<void, Error, {uri: string; mute: boolean}>({
    mutationFn: async ({uri, mute}) => {
      if (mute) {
        await agent.muteModList(uri)
      } else {
        await agent.unmuteModList(uri)
      }

      await whenAppViewReady(agent, uri, (v: AppBskyGraphGetList.Response) => {
        return Boolean(v?.data.list.viewer?.muted) === mute
      })
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: RQKEY(variables.uri),
      })
    },
  })
}

export function useListBlockMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()
  return useMutation<void, Error, {uri: string; block: boolean}>({
    mutationFn: async ({uri, block}) => {
      if (block) {
        await agent.blockModList(uri)
      } else {
        await agent.unblockModList(uri)
      }

      await whenAppViewReady(agent, uri, (v: AppBskyGraphGetList.Response) => {
        return block
          ? typeof v?.data.list.viewer?.blocked === 'string'
          : !v?.data.list.viewer?.blocked
      })
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: RQKEY(variables.uri),
      })
    },
  })
}

async function whenAppViewReady(
  agent: BskyAgent,
  uri: string,
  fn: (res: AppBskyGraphGetList.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () =>
      agent.app.bsky.graph.getList({
        list: uri,
        limit: 1,
      }),
  )
}
