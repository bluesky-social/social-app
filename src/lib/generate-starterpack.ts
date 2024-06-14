import {AppBskyActorDefs, BskyAgent, Facet} from '@atproto/api'
import {msg} from '@lingui/macro'

import {logger} from '#/logger'
import {sanitizeHandle} from 'lib/strings/handles'

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
    writes: profiles.map(p => ({
      $type: 'com.atproto.repo.applyWrites#create',
      collection: 'app.bsky.graph.listitem',
      value: {
        $type: 'app.bsky.graph.listitem',
        subject: p.did,
        list: list?.uri,
        createdAt: new Date().toISOString(),
      },
    })),
  })

  return list
}

export async function generateStarterpack({
  agent,
}: {
  agent: BskyAgent
}): Promise<string | 'NOT_ENOUGH_FOLLOWERS' | 'ERROR'> {
  try {
    const profileRes = await agent.app.bsky.actor.getProfile({
      actor: agent.session!.did,
    })
    const profile = profileRes.data

    const defaultName = `${
      profile.displayName || `@${sanitizeHandle(profile.handle)}`
    }${msg`'s Starter Pack`.message!}`

    const profilesRes = await agent.app.bsky.actor.searchActors({
      q: encodeURIComponent('*'),
      limit: 49,
    })
    const profiles = [
      profile,
      ...profilesRes.data.actors.filter(p => p.viewer?.following),
    ]

    if (profiles.length < 8) {
      return 'NOT_ENOUGH_FOLLOWERS'
    }

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
