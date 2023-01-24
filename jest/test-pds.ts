import {AddressInfo} from 'net'
import os from 'os'
import path from 'path'
import * as crypto from '@atproto/crypto'
import PDSServer, {
  Database as PDSDatabase,
  MemoryBlobStore,
  ServerConfig as PDSServerConfig,
} from '@atproto/pds'
import * as plc from '@atproto/plc'
import AtpApi, {ServiceClient} from '@atproto/api'

export interface TestUser {
  email: string
  did: string
  declarationCid: string
  handle: string
  password: string
  api: ServiceClient
}

export interface TestUsers {
  alice: TestUser
  bob: TestUser
  carla: TestUser
}

export interface TestPDS {
  pdsUrl: string
  users: TestUsers
  close: () => Promise<void>
}

// NOTE
// deterministic date generator
// we use this to ensure the mock dataset is always the same
// which is very useful when testing
function* dateGen() {
  let start = 1657846031914
  while (true) {
    yield new Date(start).toISOString()
    start += 1e3
  }
  return ''
}

export async function createServer(): Promise<TestPDS> {
  const keypair = await crypto.EcdsaKeypair.create()

  // run plc server
  const plcDb = plc.Database.memory()
  await plcDb.migrateToLatestOrThrow()
  const plcServer = plc.PlcServer.create({db: plcDb})
  const plcListener = await plcServer.start()
  const plcPort = (plcListener.address() as AddressInfo).port
  const plcUrl = `http://localhost:${plcPort}`

  const recoveryKey = (await crypto.EcdsaKeypair.create()).did()

  const plcClient = new plc.PlcClient(plcUrl)
  const serverDid = await plcClient.createDid(
    keypair,
    recoveryKey,
    'localhost',
    'https://pds.public.url',
  )

  const blobstoreLoc = path.join(os.tmpdir(), crypto.randomStr(5, 'base32'))

  const cfg = new PDSServerConfig({
    debugMode: true,
    version: '0.0.0',
    scheme: 'http',
    hostname: 'localhost',
    serverDid,
    recoveryKey,
    adminPassword: 'admin-pass',
    inviteRequired: false,
    didPlcUrl: plcUrl,
    jwtSecret: 'jwt-secret',
    availableUserDomains: ['.test'],
    appUrlPasswordReset: 'app://forgot-password',
    emailNoReplyAddress: 'noreply@blueskyweb.xyz',
    publicUrl: 'https://pds.public.url',
    imgUriSalt: '9dd04221f5755bce5f55f47464c27e1e',
    imgUriKey:
      'f23ecd142835025f42c3db2cf25dd813956c178392760256211f9d315f8ab4d8',
    dbPostgresUrl: process.env.DB_POSTGRES_URL,
    blobstoreLocation: `${blobstoreLoc}/blobs`,
    blobstoreTmp: `${blobstoreLoc}/tmp`,
  })

  const db = PDSDatabase.memory()
  await db.migrateToLatestOrThrow()
  const blobstore = new MemoryBlobStore()

  const pds = PDSServer.create({db, blobstore, keypair, config: cfg})
  const pdsServer = await pds.start()
  const pdsPort = (pdsServer.address() as AddressInfo).port
  const pdsUrl = `http://localhost:${pdsPort}`
  const testUsers = await genMockData(pdsUrl)

  return {
    pdsUrl,
    users: testUsers,
    async close() {
      await pds.destroy()
      await plcServer.destroy()
    },
  }
}

async function genMockData(pdsUrl: string): Promise<TestUsers> {
  const date = dateGen()

  const clients = {
    loggedout: AtpApi.service(pdsUrl),
    alice: AtpApi.service(pdsUrl),
    bob: AtpApi.service(pdsUrl),
    carla: AtpApi.service(pdsUrl),
  }
  const users: TestUser[] = [
    {
      email: 'alice@test.com',
      did: '',
      declarationCid: '',
      handle: 'alice.test',
      password: 'hunter2',
      api: clients.alice,
    },
    {
      email: 'bob@test.com',
      did: '',
      declarationCid: '',
      handle: 'bob.test',
      password: 'hunter2',
      api: clients.bob,
    },
    {
      email: 'carla@test.com',
      did: '',
      declarationCid: '',
      handle: 'carla.test',
      password: 'hunter2',
      api: clients.carla,
    },
  ]
  const alice = users[0]
  const bob = users[1]
  const carla = users[2]

  let _i = 1
  for (const user of users) {
    const res = await clients.loggedout.com.atproto.account.create({
      email: user.email,
      handle: user.handle,
      password: user.password,
    })
    user.api.setHeader('Authorization', `Bearer ${res.data.accessJwt}`)
    const {data: profile} = await user.api.app.bsky.actor.getProfile({
      actor: user.handle,
    })
    user.did = res.data.did
    user.declarationCid = profile.declaration.cid
    await user.api.app.bsky.actor.profile.create(
      {did: user.did},
      {
        displayName: ucfirst(user.handle).slice(0, -5),
        description: `Test user ${_i++}`,
      },
    )
  }

  // everybody follows everybody
  const follow = async (author: TestUser, subject: TestUser) => {
    await author.api.app.bsky.graph.follow.create(
      {did: author.did},
      {
        subject: {
          did: subject.did,
          declarationCid: subject.declarationCid,
        },
        createdAt: date.next().value,
      },
    )
  }
  await follow(alice, bob)
  await follow(alice, carla)
  await follow(bob, alice)
  await follow(bob, carla)
  await follow(carla, alice)
  await follow(carla, bob)

  return {alice, bob, carla}
}

function ucfirst(str: string): string {
  return str.at(0)?.toUpperCase() + str.slice(1)
}
