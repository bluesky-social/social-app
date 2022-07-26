/**
 * The environment is a place where services and shared dependencies between
 * models live. They are made available to every model via dependency injection.
 */

// import {ReactNativeStore} from './auth'
import {
  AdxClient,
  AdxRepoClient,
  AdxRepoCollectionClient,
  AdxUri,
  bsky,
  SchemaOpt,
  ListRecordsResponseValidated,
  GetRecordResponseValidated,
} from '@adxp/mock-api'
import * as storage from './storage'
import {postTexts} from './mock-data/post-texts'
import {replyTexts} from './mock-data/reply-texts'

export async function setup(adx: AdxClient) {
  await adx.setupMock(
    () => storage.load('mock-root'),
    async root => {
      await storage.save('mock-root', root)
    },
    () => generateMockData(adx),
  )
}

export async function post(
  adx: AdxClient,
  user: string,
  text: string,
  replyToUri?: string,
) {
  let reply
  if (replyToUri) {
    const replyToUrip = new AdxUri(replyToUri)
    const parentPost = await adx
      .repo(replyToUrip.host, false)
      .collection(replyToUrip.collection)
      .get('Post', replyToUrip.recordKey)
    if (parentPost) {
      reply = {
        root: parentPost.value.reply?.root || parentPost.uri,
        parent: parentPost.uri,
      }
    }
  }
  return await adx
    .repo(user, true)
    .collection('blueskyweb.xyz:Posts')
    .create('Post', {
      $type: 'blueskyweb.xyz:Post',
      text,
      reply,
      createdAt: new Date().toISOString(),
    })
}

export async function like(adx: AdxClient, user: string, uri: string) {
  return await adx
    .repo(user, true)
    .collection('blueskyweb.xyz:Likes')
    .create('Like', {
      $type: 'blueskyweb.xyz:Like',
      subject: uri,
      createdAt: new Date().toISOString(),
    })
}

export async function unlike(adx: AdxClient, user: string, uri: string) {
  const coll = adx.repo(user, true).collection('blueskyweb.xyz:Likes')
  const numDels = await deleteWhere(coll, 'Like', record => {
    return record.value.subject === uri
  })
  return numDels > 0
}

export async function repost(adx: AdxClient, user: string, uri: string) {
  return await adx
    .repo(user, true)
    .collection('blueskyweb.xyz:Posts')
    .create('Repost', {
      $type: 'blueskyweb.xyz:Repost',
      subject: uri,
      createdAt: new Date().toISOString(),
    })
}

export async function unrepost(adx: AdxClient, user: string, uri: string) {
  const coll = adx.repo(user, true).collection('blueskyweb.xyz:Posts')
  const numDels = await deleteWhere(coll, 'Repost', record => {
    return record.value.subject === uri
  })
  return numDels > 0
}

type WherePred = (_record: GetRecordResponseValidated) => Boolean
async function deleteWhere(
  coll: AdxRepoCollectionClient,
  schema: SchemaOpt,
  cond: WherePred,
) {
  const toDelete: string[] = []
  iterateAll(coll, schema, record => {
    if (cond(record)) {
      toDelete.push(record.key)
    }
  })
  for (const key of toDelete) {
    await coll.del(key)
  }
  return toDelete.length
}

type IterateAllCb = (_record: GetRecordResponseValidated) => void
async function iterateAll(
  coll: AdxRepoCollectionClient,
  schema: SchemaOpt,
  cb: IterateAllCb,
) {
  let cursor
  let res: ListRecordsResponseValidated
  do {
    res = await coll.list(schema, {after: cursor, limit: 100})
    for (const record of res.records) {
      if (record.valid) {
        cb(record)
        cursor = record.key
      }
    }
  } while (res.records.length === 100)
}

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

function repo(adx: AdxClient, didOrName: string) {
  const userDb = adx.mockDb.getUser(didOrName)
  if (!userDb) throw new Error(`User not found: ${didOrName}`)
  return adx.mainPds.repo(userDb.did, userDb.writable)
}

export async function generateMockData(adx: AdxClient) {
  const rand = (n: number) => Math.floor(Math.random() * n)
  const picka = <T>(arr: Array<T>): T => {
    if (arr.length) {
      return arr[rand(arr.length)] || arr[0]
    }
    throw new Error('Not found')
  }

  await adx.mockDb.addUser({name: 'alice.com', writable: true})
  await adx.mockDb.addUser({name: 'bob.com', writable: true})
  await adx.mockDb.addUser({name: 'carla.com', writable: true})

  const alice = repo(adx, 'alice.com')
  const bob = repo(adx, 'bob.com')
  const carla = repo(adx, 'carla.com')
  const repos = [alice, bob, carla]

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

  // a set of posts and reposts
  const posts: {uri: string}[] = []
  for (let i = 0; i < postTexts.length; i++) {
    const author = picka(repos)
    posts.push(
      await author.collection('blueskyweb.xyz:Posts').create('Post', {
        $type: 'blueskyweb.xyz:Post',
        text: postTexts[i],
        createdAt: date.next().value,
      }),
    )
    if (rand(10) === 0) {
      await picka(repos)
        .collection('blueskyweb.xyz:Posts')
        .create('Repost', {
          $type: 'blueskyweb.xyz:Repost',
          subject: picka(posts).uri,
          createdAt: date.next().value,
        })
    }
  }

  // a set of replies
  for (let i = 0; i < 100; i++) {
    const targetUri = picka(posts).uri
    const urip = new AdxUri(targetUri)
    const target = await adx.mainPds
      .repo(urip.host, true)
      .collection(urip.collection)
      .get('Post', urip.recordKey)
    const targetRecord = target.value as bsky.Post.Record
    const author = picka(repos)
    posts.push(
      await author.collection('blueskyweb.xyz:Posts').create('Post', {
        $type: 'blueskyweb.xyz:Post',
        text: picka(replyTexts),
        reply: {
          root: targetRecord.reply ? targetRecord.reply.root : target.uri,
          parent: target.uri,
        },
        createdAt: date.next().value,
      }),
    )
  }

  // a set of likes
  for (const post of posts) {
    for (const repo of repos) {
      if (rand(3) === 0) {
        await repo.collection('blueskyweb.xyz:Likes').create('Like', {
          $type: 'blueskyweb.xyz:Like',
          subject: post.uri,
          createdAt: date.next().value,
        })
      }
    }
  }

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
