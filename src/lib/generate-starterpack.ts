import {AppBskyActorDefs, BskyAgent, Facet} from '@atproto/api'
import {msg} from '@lingui/macro'

import {logger} from '#/logger'
import {sanitizeHandle} from 'lib/strings/handles'
import {enforceLen} from 'lib/strings/helpers'

export const createStarterPackList = async ({
  name,
  description,
  descriptionFacets,
  profiles,
  agent,
}: {
  name: string
  description?: string
  descriptionFacets?: Facet[]
  profiles: AppBskyActorDefs.ProfileViewBasic[]
  agent: BskyAgent
}): Promise<{uri: string; cid: string}> => {
  if (profiles.length === 0) throw new Error('No profiles given')

  const list = await agent.app.bsky.graph.list.create(
    {repo: agent.session!.did},
    {
      name,
      description,
      descriptionFacets,
      avatar: undefined,
      createdAt: new Date().toISOString(),
      purpose: 'app.bsky.graph.defs#referencelist',
    },
  )
  if (!list) throw new Error('List creation failed')
  await agent.com.atproto.repo.applyWrites({
    repo: agent.session!.did,
    writes: [
      createListItem({did: agent.session!.did, listUri: list.uri}),
    ].concat(
      profiles
        // Ensure we don't have ourselves in this list twice
        .filter(p => p.did !== agent.session!.did)
        .map(p => createListItem({did: p.did, listUri: list.uri})),
    ),
  })

  return list
}

export async function generateStarterpack({
  agent,
}: {
  agent: BskyAgent
}): Promise<string | 'NOT_ENOUGH_FOLLOWERS' | 'ERROR'> {
  try {
    let profile: AppBskyActorDefs.ProfileViewBasic | undefined
    let profiles: AppBskyActorDefs.ProfileViewBasic[] | undefined

    await Promise.all([
      (async () => {
        profile = (
          await agent.app.bsky.actor.getProfile({
            actor: agent.session!.did,
          })
        ).data
      })(),
      (async () => {
        profiles = (
          await agent.app.bsky.actor.searchActors({
            q: encodeURIComponent('*'),
            limit: 49,
          })
        ).data.actors.filter(p => p.viewer?.following)
      })(),
    ])

    if (!profile || !profiles) {
      return 'ERROR'
    }

    // We include ourselves when we make the list
    if (profiles.length < 7) {
      return 'NOT_ENOUGH_FOLLOWERS'
    }

    const defaultName = `${enforceLen(
      profile.displayName || `@${sanitizeHandle(profile.handle)}`,
      25,
      true,
    )}${msg`'s Starter Pack`.message!}`

    const list = await createStarterPackList({
      name: defaultName ?? '',
      profiles,
      agent,
    })

    return (
      await agent.app.bsky.graph.starterpack.create(
        {
          repo: agent.session!.did,
          validate: false,
        },
        {
          name: defaultName ?? '',
          list: list.uri,
          createdAt: new Date().toISOString(),
        },
      )
    ).uri
  } catch (e: unknown) {
    logger.error('Failed to generate starter pack', {error: e})
    return 'ERROR'
  }
}

function createListItem({did, listUri}: {did: string; listUri: string}) {
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
