/**
 * The environment is a place where services and shared dependencies between
 * models live. They are made available to every model via dependency injection.
 */

import {getEnv, IStateTreeNode} from 'mobx-state-tree'
// import {ReactNativeStore} from './auth'
import {AdxClient, blueskywebSchemas, AdxRepoClient} from '@adxp/mock-api'
import * as storage from './lib/storage'

export const adx = new AdxClient({
  pds: 'http://localhost',
  schemas: blueskywebSchemas,
})

export class Environment {
  adx = adx
  // authStore?: ReactNativeStore

  constructor() {}

  async setup() {
    await adx.setupMock(
      () => storage.load('mock-root'),
      async root => {
        await storage.save('mock-root', root)
      },
      generateMockData,
    )
    // this.authStore = await ReactNativeStore.load()
  }
}

/**
 * Extension to the MST models that adds the env property.
 * Usage:
 *
 *   .extend(withEnvironment)
 *
 */
export const withEnvironment = (self: IStateTreeNode) => ({
  views: {
    get env() {
      return getEnv<Environment>(self)
    },
  },
})

// TEMPORARY
// mock api config
// =======

function* dateGen() {
  let start = 1657846031914
  while (true) {
    yield new Date(start).toISOString()
    start += 1e3
  }
}
const date = dateGen()

function repo(didOrName: string) {
  const userDb = adx.mockDb.getUser(didOrName)
  if (!userDb) throw new Error(`User not found: ${didOrName}`)
  return adx.mainPds.repo(userDb.did, userDb.writable)
}

export async function generateMockData() {
  await adx.mockDb.addUser({name: 'alice.com', writable: true})
  await adx.mockDb.addUser({name: 'bob.com', writable: true})
  await adx.mockDb.addUser({name: 'carla.com', writable: true})

  const alice = repo('alice.com')
  const bob = repo('bob.com')
  const carla = repo('carla.com')

  await alice.collection('blueskyweb.xyz:Profiles').put('Profile', 'profile', {
    $type: 'blueskyweb.xyz:Profile',
    displayName: 'Alice',
    description: 'Test user 1',
  })
  await bob.collection('blueskyweb.xyz:Profiles').put('Profile', 'profile', {
    $type: 'blueskyweb.xyz:Profile',
    displayName: 'Bob',
    description: 'Test user 2',
  })
  await carla.collection('blueskyweb.xyz:Profiles').put('Profile', 'profile', {
    $type: 'blueskyweb.xyz:Profile',
    displayName: 'Carla',
    description: 'Test user 3',
  })

  // everybody follows everybody
  const follow = async (who: AdxRepoClient, subjectName: string) => {
    const subjectDb = adx.mockDb.getUser(subjectName)
    return who.collection('blueskyweb.xyz:Follows').create('Follow', {
      $type: 'blueskyweb.xyz:Follow',
      subject: {
        did: subjectDb?.did,
        name: subjectDb?.name,
      },
      createdAt: date.next().value,
    })
  }
  await follow(alice, 'bob.com')
  await follow(alice, 'carla.com')
  await follow(bob, 'alice.com')
  await follow(bob, 'carla.com')
  await follow(carla, 'alice.com')
  await follow(carla, 'bob.com')

  // 2 posts on each user
  const alicePosts: {uri: string}[] = []
  for (let i = 0; i < 2; i++) {
    alicePosts.push(
      await alice.collection('blueskyweb.xyz:Posts').create('Post', {
        $type: 'blueskyweb.xyz:Post',
        text: `Alice post ${i + 1}`,
        createdAt: date.next().value,
      }),
    )
    await bob.collection('blueskyweb.xyz:Posts').create('Post', {
      $type: 'blueskyweb.xyz:Post',
      text: `Bob post ${i + 1}`,
      createdAt: date.next().value,
    })
    await carla.collection('blueskyweb.xyz:Posts').create('Post', {
      $type: 'blueskyweb.xyz:Post',
      text: `Carla post ${i + 1}`,
      createdAt: date.next().value,
    })
  }

  // small thread of replies on alice's first post
  const bobReply1 = await bob
    .collection('blueskyweb.xyz:Posts')
    .create('Post', {
      $type: 'blueskyweb.xyz:Post',
      text: 'Bob reply',
      reply: {root: alicePosts[0].uri, parent: alicePosts[0].uri},
      createdAt: date.next().value,
    })
  await carla.collection('blueskyweb.xyz:Posts').create('Post', {
    $type: 'blueskyweb.xyz:Post',
    text: 'Carla reply',
    reply: {root: alicePosts[0].uri, parent: alicePosts[0].uri},
    createdAt: date.next().value,
  })
  const aliceReply1 = await alice
    .collection('blueskyweb.xyz:Posts')
    .create('Post', {
      $type: 'blueskyweb.xyz:Post',
      text: 'Alice reply',
      reply: {root: alicePosts[0].uri, parent: bobReply1.uri},
      createdAt: date.next().value,
    })

  // bob and carla repost alice's first post
  await bob.collection('blueskyweb.xyz:Posts').create('Repost', {
    $type: 'blueskyweb.xyz:Repost',
    subject: alicePosts[0].uri,
    createdAt: date.next().value,
  })
  await carla.collection('blueskyweb.xyz:Posts').create('Repost', {
    $type: 'blueskyweb.xyz:Repost',
    subject: alicePosts[0].uri,
    createdAt: date.next().value,
  })

  // bob likes all of alice's posts
  for (let i = 0; i < 2; i++) {
    await bob.collection('blueskyweb.xyz:Likes').create('Like', {
      $type: 'blueskyweb.xyz:Like',
      subject: alicePosts[i].uri,
      createdAt: date.next().value,
    })
  }

  // carla likes all of alice's posts and everybody's replies
  for (let i = 0; i < 2; i++) {
    await carla.collection('blueskyweb.xyz:Likes').create('Like', {
      $type: 'blueskyweb.xyz:Like',
      subject: alicePosts[i].uri,
      createdAt: date.next().value,
    })
  }
  await carla.collection('blueskyweb.xyz:Likes').create('Like', {
    $type: 'blueskyweb.xyz:Like',
    subject: aliceReply1.uri,
    createdAt: date.next().value,
  })
  await carla.collection('blueskyweb.xyz:Likes').create('Like', {
    $type: 'blueskyweb.xyz:Like',
    subject: bobReply1.uri,
    createdAt: date.next().value,
  })

  // give alice 3 badges, 2 from bob and 2 from carla, with one ignored
  const inviteBadge = await bob
    .collection('blueskyweb.xyz:Badges')
    .create('Badge', {
      $type: 'blueskyweb.xyz:Badge',
      subject: {did: alice.did, name: 'alice.com'},
      assertion: {type: 'invite'},
      createdAt: date.next().value,
    })
  const techTagBadge1 = await bob
    .collection('blueskyweb.xyz:Badges')
    .create('Badge', {
      $type: 'blueskyweb.xyz:Badge',
      subject: {did: alice.did, name: 'alice.com'},
      assertion: {type: 'tag', tag: 'tech'},
      createdAt: date.next().value,
    })
  const techTagBadge2 = await carla
    .collection('blueskyweb.xyz:Badges')
    .create('Badge', {
      $type: 'blueskyweb.xyz:Badge',
      subject: {did: alice.did, name: 'alice.com'},
      assertion: {type: 'tag', tag: 'tech'},
      createdAt: date.next().value,
    })
  await bob.collection('blueskyweb.xyz:Badges').create('Badge', {
    $type: 'blueskyweb.xyz:Badge',
    subject: {did: alice.did, name: 'alice.com'},
    assertion: {type: 'employee'},
    createdAt: date.next().value,
  })
  await alice.collection('blueskyweb.xyz:Profiles').put('Profile', 'profile', {
    $type: 'blueskyweb.xyz:Profile',
    displayName: 'Alice',
    description: 'Test user 1',
    badges: [
      {uri: inviteBadge.uri},
      {uri: techTagBadge1.uri},
      {uri: techTagBadge2.uri},
    ],
  })
}
