import {type Client} from '@atproto/lex-client'
import {
  type AtIdentifierString,
  AtUri,
  type AtUriString,
  type DatetimeString,
  type NsidString,
} from '@atproto/syntax'
import {
  blockActorList,
  muteActorList,
  unblockActorList,
  unmuteActorList,
} from '@bsky.app/sdk'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import chunk from 'lodash.chunk'

import {uploadBlob} from '#/lib/api'
import {until} from '#/lib/async/until'
import {type ImageMeta} from '#/state/gallery'
import {STALE} from '#/state/queries'
import {useAppviewClient, usePdsClient, useSession} from '#/state/session'
import {app, com} from '#/lexicons'
import {FEED_INFO_RQKEY_ROOT} from './feed'
import {invalidate as invalidateMyLists} from './my-lists'
import {RQKEY as PROFILE_LISTS_RQKEY} from './profile-lists'

export const RQKEY_ROOT = 'list'
export const RQKEY = (uri: string) => [RQKEY_ROOT, uri]

export function useListQuery(uri?: string) {
  const client = useAppviewClient()
  return useQuery<app.bsky.graph.defs.ListView, Error>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(uri || ''),
    async queryFn() {
      if (!uri) {
        throw new Error('URI not provided')
      }
      const res = await client.call(app.bsky.graph.getList, {
        list: uri as AtUriString,
        limit: 1,
      })
      return res.list
    },
    enabled: !!uri,
  })
}

export interface ListCreateMutateParams {
  purpose: string
  name: string
  description: string
  descriptionFacets: app.bsky.richtext.facet.Main[] | undefined
  avatar: ImageMeta | null | undefined
}
export function useListCreateMutation() {
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const appviewClient = useAppviewClient()
  const pdsClient = usePdsClient()
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
        const record: Omit<app.bsky.graph.list.Main, '$type'> = {
          purpose,
          name,
          description,
          descriptionFacets,
          avatar: undefined,
          createdAt: new Date().toISOString() as DatetimeString,
        }
        if (avatar) {
          const blobRes = await uploadBlob(pdsClient, avatar.path, avatar.mime)
          record.avatar = blobRes.blob
        }
        const res = await pdsClient.create(app.bsky.graph.list, record)

        // wait for the appview to update
        await whenAppViewReady(appviewClient, res.uri, v => {
          return typeof v?.list.uri === 'string'
        })
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
  descriptionFacets: app.bsky.richtext.facet.Main[] | undefined
  avatar: ImageMeta | null | undefined
}
export function useListMetadataMutation() {
  const {currentAccount} = useSession()
  const appviewClient = useAppviewClient()
  const pdsClient = usePdsClient()
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
      const {value: record} = await pdsClient.get(app.bsky.graph.list, {
        repo: currentAccount.did,
        rkey,
      })

      // update the fields
      record.name = name
      record.description = description
      record.descriptionFacets = descriptionFacets
      if (avatar) {
        const blobRes = await uploadBlob(pdsClient, avatar.path, avatar.mime)
        record.avatar = blobRes.blob
      } else if (avatar === null) {
        record.avatar = undefined
      }
      const res = await pdsClient.call(com.atproto.repo.putRecord, {
        repo: currentAccount.did,
        collection: 'app.bsky.graph.list',
        rkey,
        record,
      })

      // wait for the appview to update
      await whenAppViewReady(appviewClient, res.uri, v => {
        const list = v.list
        return (
          list.name === record.name && list.description === record.description
        )
      })
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
      queryClient.invalidateQueries({
        queryKey: [FEED_INFO_RQKEY_ROOT],
      })
    },
  })
}

export function useListDeleteMutation() {
  const {currentAccount} = useSession()
  const appviewClient = useAppviewClient()
  const pdsClient = usePdsClient()
  const queryClient = useQueryClient()
  return useMutation<void, Error, {uri: string}>({
    mutationFn: async ({uri}) => {
      if (!currentAccount) {
        return
      }
      // fetch all the listitem records that belong to this list
      let cursor: string | undefined
      let listitemRecordUris: string[] = []
      for (let i = 0; i < 100; i++) {
        const res = await pdsClient.list(app.bsky.graph.listitem, {
          repo: currentAccount.did as AtIdentifierString,
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
      const createDel = (
        uri: string,
      ): com.atproto.repo.applyWrites.$InputBody['writes'][number] => {
        const urip = new AtUri(uri)
        return {
          $type: 'com.atproto.repo.applyWrites#delete',
          collection: urip.collection as NsidString,
          rkey: urip.rkey,
        }
      }
      const writes = listitemRecordUris
        .map(uri => createDel(uri))
        .concat([createDel(uri)])

      // apply in chunks
      for (const writesChunk of chunk(writes, 10)) {
        await pdsClient.call(com.atproto.repo.applyWrites, {
          repo: currentAccount.did as AtIdentifierString,
          writes: writesChunk,
        })
      }

      // wait for the appview to update. once the list is deleted, getList
      // throws (404), `until` catches it and passes `undefined` here, so an
      // absent body signals a completed delete.
      await whenAppViewReady(appviewClient, uri, v => {
        return !v
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
  const appviewClient = useAppviewClient()
  return useMutation<void, Error, {uri: string; mute: boolean}>({
    mutationFn: async ({uri, mute}) => {
      if (mute) {
        await appviewClient.call(muteActorList, {list: uri as AtUriString})
      } else {
        await appviewClient.call(unmuteActorList, {list: uri as AtUriString})
      }

      await whenAppViewReady(appviewClient, uri, v => {
        return Boolean(v?.list.viewer?.muted) === mute
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
  const appviewClient = useAppviewClient()
  const pdsClient = usePdsClient()
  return useMutation<void, Error, {uri: string; block: boolean}>({
    mutationFn: async ({uri, block}) => {
      if (block) {
        await pdsClient.call(blockActorList, {list: uri as AtUriString})
      } else {
        await pdsClient.call(unblockActorList, {list: uri as AtUriString})
      }

      await whenAppViewReady(appviewClient, uri, v => {
        return block
          ? typeof v?.list.viewer?.blocked === 'string'
          : !v?.list.viewer?.blocked
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
  client: Client,
  uri: string,
  fn: (res: app.bsky.graph.getList.$OutputBody) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () =>
      client.call(app.bsky.graph.getList, {
        list: uri as AtUriString,
        limit: 1,
      }),
  )
}
