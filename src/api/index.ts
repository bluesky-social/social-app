import {MicroblogDelegator, MicroblogReader, auth} from '@adx/common'
import * as ucan from 'ucans'

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
  keypair?: ucan.EdKeypair
  rootAuthToken?: string
  ucanStore?: ucan.Store

  get hasWriteCaps() {
    return Boolean(this.did && this.keypair && this.ucanStore)
  }

  static async createTest(serverUrl: string) {
    const cfg = new UserConfig()
    cfg.serverUrl = serverUrl
    cfg.keypair = await ucan.EdKeypair.create()
    cfg.did = cfg.keypair.did()
    cfg.rootAuthToken = (await auth.claimFull(cfg.did, cfg.keypair)).encoded()
    cfg.ucanStore = await ucan.Store.fromTokens([cfg.rootAuthToken])
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
      this.keypair = ucan.EdKeypair.fromSecretKey(state.secretKeyStr)
      this.did = this.keypair.did()
      this.rootAuthToken = state.rootAuthToken
      this.ucanStore = await ucan.Store.fromTokens([this.rootAuthToken])
    }
  }
}
