// import {MicroblogDelegator, MicroblogReader, auth} from '@adx/common'
// import * as ucan from 'ucans'

class MicroblogReader {
  constructor(public url: string, public did: any) {}
}
class MicroblogDelegator {
  constructor(
    public url: string,
    public did: any,
    public keypair: any,
    public ucanStore: any,
  ) {}
}
const auth = {
  async claimFull(_one: any, _two: any) {
    return {
      encoded() {
        return 'todo'
      },
    }
  },
}

export class API {
  userCfg?: UserConfig
  reader?: MicroblogReader
  writer?: MicroblogDelegator

  setUserCfg(cfg: UserConfig) {
    this.userCfg = cfg
    this.createReader()
    this.createWriter()
  }

  private createReader() {
    if (!this.userCfg?.serverUrl) {
      this.reader = undefined
    } else {
      this.reader = new MicroblogReader(
        this.userCfg.serverUrl,
        this.userCfg.did,
      )
    }
  }

  private createWriter() {
    if (
      this.userCfg?.serverUrl &&
      this.userCfg?.did &&
      this.userCfg?.keypair &&
      this.userCfg?.ucanStore
    ) {
      this.writer = new MicroblogDelegator(
        this.userCfg.serverUrl,
        this.userCfg.did,
        this.userCfg.keypair,
        this.userCfg.ucanStore,
      )
    } else {
      this.writer = undefined
    }
  }
}

export interface SerializedUserConfig {
  serverUrl?: string
  secretKeyStr?: string
  rootAuthToken?: string
}

export class UserConfig {
  serverUrl?: string
  did?: string
  keypair?: any //ucan.EdKeypair
  rootAuthToken?: string
  ucanStore?: any //ucan.Store

  get hasWriteCaps() {
    return Boolean(this.did && this.keypair && this.ucanStore)
  }

  static async createTest(serverUrl: string) {
    const cfg = new UserConfig()
    cfg.serverUrl = serverUrl
    cfg.keypair = true //await ucan.EdKeypair.create()
    cfg.did = cfg.keypair.did()
    cfg.rootAuthToken = (await auth.claimFull(cfg.did, cfg.keypair)).encoded()
    cfg.ucanStore = true // await ucan.Store.fromTokens([cfg.rootAuthToken])
    return cfg
  }

  static async hydrate(state: SerializedUserConfig) {
    const cfg = new UserConfig()
    await cfg.hydrate(state)
    return cfg
  }

  async serialize(): Promise<SerializedUserConfig> {
    return {
      serverUrl: this.serverUrl,
      secretKeyStr: this.keypair
        ? await this.keypair.export('base64')
        : undefined,
      rootAuthToken: this.rootAuthToken,
    }
  }

  async hydrate(state: SerializedUserConfig) {
    this.serverUrl = state.serverUrl
    if (state.secretKeyStr && state.rootAuthToken) {
      this.keypair = true // ucan.EdKeypair.fromSecretKey(state.secretKeyStr)
      this.did = this.keypair.did()
      this.rootAuthToken = state.rootAuthToken
      this.ucanStore = true // await ucan.Store.fromTokens([this.rootAuthToken])
    }
  }
}
