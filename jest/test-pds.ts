import {AddressInfo} from 'net'
import os from 'os'
import net from 'net'
import path from 'path'
import fs from 'fs'
import * as crypto from '@atproto/crypto'
import {PDS, ServerConfig, Database, MemoryBlobStore} from '@atproto/pds'
import * as plc from '@did-plc/lib'
import {PlcServer, Database as PlcDatabase} from '@did-plc/server'
import {BskyAgent} from '@atproto/api'

const ADMIN_PASSWORD = 'admin-pass'
const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60

export interface TestUser {
  email: string
  did: string
  handle: string
  password: string
  agent: BskyAgent
}

export interface TestPDS {
  pdsUrl: string
  mocker: Mocker
  close: () => Promise<void>
}

export async function createServer(
  {inviteRequired}: {inviteRequired: boolean} = {inviteRequired: false},
): Promise<TestPDS> {
  const repoSigningKey = await crypto.Secp256k1Keypair.create()
  const plcRotationKey = await crypto.Secp256k1Keypair.create()
  const port = await getPort()

  const plcDb = PlcDatabase.mock()

  const plcServer = PlcServer.create({db: plcDb})
  const plcListener = await plcServer.start()
  const plcPort = (plcListener.address() as AddressInfo).port
  const plcUrl = `http://localhost:${plcPort}`

  const recoveryKey = (await crypto.Secp256k1Keypair.create()).did()

  const plcClient = new plc.Client(plcUrl)
  const serverDid = await plcClient.createDid({
    signingKey: repoSigningKey.did(),
    rotationKeys: [recoveryKey, plcRotationKey.did()],
    handle: 'localhost',
    pds: `http://localhost:${port}`,
    signer: plcRotationKey,
  })

  const blobstoreLoc = path.join(os.tmpdir(), crypto.randomStr(5, 'base32'))

  const cfg = new ServerConfig({
    debugMode: true,
    version: '0.0.0',
    scheme: 'http',
    hostname: 'localhost',
    port,
    serverDid,
    recoveryKey,
    adminPassword: ADMIN_PASSWORD,
    inviteRequired,
    didPlcUrl: plcUrl,
    jwtSecret: 'jwt-secret',
    availableUserDomains: ['.test'],
    appUrlPasswordReset: 'app://forgot-password',
    emailNoReplyAddress: 'noreply@blueskyweb.xyz',
    publicUrl: `http://localhost:${port}`,
    imgUriSalt: '9dd04221f5755bce5f55f47464c27e1e',
    imgUriKey:
      'f23ecd142835025f42c3db2cf25dd813956c178392760256211f9d315f8ab4d8',
    dbPostgresUrl: process.env.DB_POSTGRES_URL,
    blobstoreLocation: `${blobstoreLoc}/blobs`,
    blobstoreTmp: `${blobstoreLoc}/tmp`,
    maxSubscriptionBuffer: 200,
    repoBackfillLimitMs: HOUR,
    userInviteInterval: 1,
    labelerDid: 'did:example:labeler',
    labelerKeywords: {},
  })

  const db =
    cfg.dbPostgresUrl !== undefined
      ? Database.postgres({
          url: cfg.dbPostgresUrl,
          schema: cfg.dbPostgresSchema,
        })
      : Database.memory()
  await db.migrateToLatestOrThrow()

  const blobstore = new MemoryBlobStore()

  const pds = PDS.create({
    db,
    blobstore,
    repoSigningKey,
    plcRotationKey,
    config: cfg,
  })
  await pds.start()
  const pdsUrl = `http://localhost:${port}`

  const profilePic = fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'default-avatar.jpg'),
  )

  return {
    pdsUrl,
    mocker: new Mocker(pds, pdsUrl, profilePic),
    async close() {
      await pds.destroy()
      await plcServer.destroy()
    },
  }
}

class Mocker {
  agent: BskyAgent
  users: Record<string, TestUser> = {}

  constructor(
    public pds: PDS,
    public service: string,
    public profilePic: Uint8Array,
  ) {
    this.agent = new BskyAgent({service})
  }

  // NOTE
  // deterministic date generator
  // we use this to ensure the mock dataset is always the same
  // which is very useful when testing
  *dateGen() {
    let start = 1657846031914
    while (true) {
      yield new Date(start).toISOString()
      start += 1e3
    }
  }

  async createUser(name: string) {
    const agent = new BskyAgent({service: this.agent.service})

    const inviteRes = await agent.api.com.atproto.server.createInviteCode(
      {useCount: 1},
      {
        headers: {authorization: `Basic ${btoa(`admin:${ADMIN_PASSWORD}`)}`},
        encoding: 'application/json',
      },
    )

    const email = `fake${Object.keys(this.users).length + 1}@fake.com`
    const res = await agent.createAccount({
      inviteCode: inviteRes.data.code,
      email,
      handle: name + '.test',
      password: 'hunter2',
    })
    await agent.upsertProfile(async () => {
      const blob = await agent.uploadBlob(this.profilePic, {
        encoding: 'image/jpeg',
      })
      return {
        displayName: name,
        avatar: blob.data.blob,
      }
    })
    this.users[name] = {
      did: res.data.did,
      email,
      handle: name + '.test',
      password: 'hunter2',
      agent: agent,
    }
  }

  async follow(a: string, b: string) {
    await this.users[a].agent.follow(this.users[b].did)
  }

  async generateStandardGraph() {
    await this.createUser('alice')
    await this.createUser('bob')
    await this.createUser('carla')

    await this.users.alice.agent.upsertProfile(() => ({
      displayName: 'Alice',
      description: 'Test user 1',
    }))

    await this.users.bob.agent.upsertProfile(() => ({
      displayName: 'Bob',
      description: 'Test user 2',
    }))

    await this.users.carla.agent.upsertProfile(() => ({
      displayName: 'Carla',
      description: 'Test user 3',
    }))

    await this.follow('alice', 'bob')
    await this.follow('alice', 'carla')
    await this.follow('bob', 'alice')
    await this.follow('bob', 'carla')
    await this.follow('carla', 'alice')
    await this.follow('carla', 'bob')
  }

  async createPost(user: string, text: string) {
    const agent = this.users[user]?.agent
    if (!agent) {
      throw new Error(`Not a user: ${user}`)
    }
    return await agent.post({
      text,
      createdAt: new Date().toISOString(),
    })
  }

  async createQuotePost(
    user: string,
    text: string,
    {uri, cid}: {uri: string; cid: string},
  ) {
    const agent = this.users[user]?.agent
    if (!agent) {
      throw new Error(`Not a user: ${user}`)
    }
    return await agent.post({
      text,
      embed: {$type: 'app.bsky.embed.record', record: {uri, cid}},
      createdAt: new Date().toISOString(),
    })
  }

  async createReply(
    user: string,
    text: string,
    {uri, cid}: {uri: string; cid: string},
  ) {
    const agent = this.users[user]?.agent
    if (!agent) {
      throw new Error(`Not a user: ${user}`)
    }
    return await agent.post({
      text,
      reply: {root: {uri, cid}, parent: {uri, cid}},
      createdAt: new Date().toISOString(),
    })
  }

  async like(user: string, {uri, cid}: {uri: string; cid: string}) {
    const agent = this.users[user]?.agent
    if (!agent) {
      throw new Error(`Not a user: ${user}`)
    }
    return await agent.like(uri, cid)
  }

  async labelAccount(label: string, user: string) {
    const did = this.users[user]?.did
    if (!did) {
      throw new Error(`Invalid user: ${user}`)
    }
    const ctx = this.pds.ctx
    if (!ctx) {
      throw new Error('Invalid PDS')
    }

    await ctx.db.db
      .insertInto('label')
      .values([
        {
          src: ctx.cfg.labelerDid,
          uri: did,
          cid: '',
          val: label,
          neg: 0,
          cts: new Date().toISOString(),
        },
      ])
      .execute()
  }

  async labelProfile(label: string, user: string) {
    const agent = this.users[user]?.agent
    const did = this.users[user]?.did
    if (!did) {
      throw new Error(`Invalid user: ${user}`)
    }

    const profile = await agent.app.bsky.actor.profile.get({
      repo: user + '.test',
      rkey: 'self',
    })

    const ctx = this.pds.ctx
    if (!ctx) {
      throw new Error('Invalid PDS')
    }
    await ctx.db.db
      .insertInto('label')
      .values([
        {
          src: ctx.cfg.labelerDid,
          uri: profile.uri,
          cid: profile.cid,
          val: label,
          neg: 0,
          cts: new Date().toISOString(),
        },
      ])
      .execute()
  }

  async labelPost(label: string, {uri, cid}: {uri: string; cid: string}) {
    const ctx = this.pds.ctx
    if (!ctx) {
      throw new Error('Invalid PDS')
    }
    await ctx.db.db
      .insertInto('label')
      .values([
        {
          src: ctx.cfg.labelerDid,
          uri,
          cid,
          val: label,
          neg: 0,
          cts: new Date().toISOString(),
        },
      ])
      .execute()
  }
}

const checkAvailablePort = (port: number) =>
  new Promise(resolve => {
    const server = net.createServer()
    server.unref()
    server.on('error', () => resolve(false))
    server.listen({port}, () => {
      server.close(() => {
        resolve(true)
      })
    })
  })

async function getPort() {
  for (let i = 3000; i < 65000; i++) {
    if (await checkAvailablePort(i)) {
      return i
    }
  }
  throw new Error('Unable to find an available port')
}
