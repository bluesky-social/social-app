import {type Client} from '@atproto/lex-client'
import {type AtUriString, type DatetimeString} from '@atproto/syntax'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {enforceLen} from '#/lib/strings/helpers'
import {useAppviewClient, usePdsClient} from '#/state/session'
import {app, com} from '#/lexicons'
import type * as bsky from '#/types/bsky'

export const createStarterPackList = async ({
  name,
  description,
  descriptionFacets,
  profiles,
  client,
}: {
  name: string
  description?: string
  descriptionFacets?: app.bsky.richtext.facet.Main[]
  profiles: bsky.profile.AnyProfileView[]
  client: Client
}): Promise<{uri: string; cid: string}> => {
  if (profiles.length === 0) throw new Error('No profiles given')

  const list = await client.create(app.bsky.graph.list, {
    name,
    description,
    descriptionFacets,
    avatar: undefined,
    createdAt: new Date().toISOString() as DatetimeString,
    purpose: 'app.bsky.graph.defs#referencelist',
  })
  if (!list) throw new Error('List creation failed')
  await client.call(com.atproto.repo.applyWrites, {
    repo: client.assertDid,
    writes: profiles.map(p => createListItem({did: p.did, listUri: list.uri})),
  })

  return list
}

export function useGenerateStarterPackMutation({
  onSuccess,
  onError,
}: {
  onSuccess: ({uri, cid}: {uri: string; cid: string}) => void
  onError: (e: Error) => void
}) {
  const {_} = useLingui()
  const appviewClient = useAppviewClient()
  const pdsClient = usePdsClient()

  return useMutation<{uri: string; cid: string}, Error, void>({
    mutationFn: async () => {
      let profile: app.bsky.actor.defs.ProfileViewDetailed | undefined
      let profiles: app.bsky.actor.defs.ProfileView[] | undefined

      await Promise.all([
        (async () => {
          profile = await appviewClient.call(app.bsky.actor.getProfile, {
            actor: pdsClient.assertDid,
          })
        })(),
        (async () => {
          profiles = (
            await appviewClient.call(app.bsky.actor.searchActors, {
              q: encodeURIComponent('*'),
              limit: 49,
            })
          ).actors.filter(p => p.viewer?.following)
        })(),
      ])

      if (!profile || !profiles) {
        throw new Error('ERROR_DATA')
      }

      // We include ourselves when we make the list
      if (profiles.length < 7) {
        throw new Error('NOT_ENOUGH_FOLLOWERS')
      }

      const displayName = enforceLen(
        profile.displayName
          ? sanitizeDisplayName(profile.displayName)
          : `@${sanitizeHandle(profile.handle)}`,
        25,
        true,
      )
      const starterPackName = _(msg`${displayName}'s Starter Pack`)

      const list = await createStarterPackList({
        name: starterPackName,
        profiles,
        client: pdsClient,
      })

      return await pdsClient.create(app.bsky.graph.starterpack, {
        name: starterPackName,
        list: list.uri as AtUriString,
        createdAt: new Date().toISOString() as DatetimeString,
      })
    },
    onSuccess: async data => {
      await whenAppViewReady(appviewClient, data.uri, v => {
        return typeof v?.starterPack.uri === 'string'
      })
      onSuccess(data)
    },
    onError: error => {
      onError(error)
    },
  })
}

function createListItem({
  did,
  listUri,
}: {
  did: string
  listUri: string
}): com.atproto.repo.applyWrites.$InputBody['writes'][number] {
  return {
    $type: 'com.atproto.repo.applyWrites#create',
    collection: 'app.bsky.graph.listitem',
    value: {
      $type: 'app.bsky.graph.listitem',
      subject: did,
      list: listUri,
      createdAt: new Date().toISOString(),
    },
  }
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
