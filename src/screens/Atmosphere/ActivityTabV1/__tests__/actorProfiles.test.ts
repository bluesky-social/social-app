import {type Client} from '@atproto/lex'

import {
  fetchActorProfiles,
  findActorProfiles,
  getActorDids,
} from '../actorProfiles'
import {
  actorGroup,
  article,
  caelin,
  danielle,
  debbie,
  eric,
  gallery,
  item,
  manton,
  NSID,
  profile,
  subjectGroup,
} from './fixtures'

describe('actor profiles', () => {
  const feed = [
    // Gallery author is the actor, so the view already carries their profile.
    item({actor: manton, collection: NSID.gallery, view: gallery(manton)}),
    // A recommend's view is the target article, which doesn't include Eric.
    actorGroup({
      actor: eric,
      collection: NSID.recommend,
      view: article('paul.pckt.blog', {associatedProfiles: [debbie]}),
      count: 2,
    }),
    // Subject groups carry their own actors and need no lookup.
    subjectGroup({
      actors: [danielle, caelin],
      collection: NSID.recommend,
      view: article(),
    }),
  ]

  it('only looks up actors that the response identifies by DID', () => {
    expect([...getActorDids(feed)]).toEqual([manton.did, eric.did])
  })

  it('keeps only actor profiles found in the page', () => {
    expect([...findActorProfiles(feed).values()]).toEqual([manton])
  })

  it('fetches the rest in chunks of 25', async () => {
    const actors = Array.from({length: 30}, (_, i) => profile(`user${i}.test`))
    const call = jest.fn(
      (_method: unknown, {actors: dids}: {actors: string[]}) =>
        Promise.resolve({
          profiles: actors.filter(actor => dids.includes(actor.did)),
        }),
    )
    const profiles = await fetchActorProfiles({call} as unknown as Client, [
      ...feed,
      ...actors.map(actor =>
        item({actor, collection: NSID.recommend, view: article()}),
      ),
    ])

    expect(call.mock.calls.map(([, params]) => params.actors.length)).toEqual([
      25, 6,
    ])
    expect(profiles.get(manton.did)).toBe(manton)
    expect(profiles.get(eric.did)).toBeUndefined()
    expect(profiles.get(actors[29].did)).toBe(actors[29])
  })
})
