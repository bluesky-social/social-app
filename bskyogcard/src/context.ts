import {AtpAgent} from '@atproto/api'

import {type Config} from './config.js'
import {createRenderer} from './render/client.js'
import {loadFontMetadata, type FontMetadata} from './render/fonts.js'
import {type Renderer} from './render/protocol.js'

export type AppContextOptions = {
  cfg: Config
  appviewAgent: AtpAgent
  chatAgent: AtpAgent
  fontMetadata: FontMetadata[]
  renderer: Renderer
}

export class AppContext {
  cfg: Config
  appviewAgent: AtpAgent
  chatAgent: AtpAgent
  fontMetadata: FontMetadata[]
  renderer: Renderer
  abortController = new AbortController()

  private opts: AppContextOptions

  constructor(opts: AppContextOptions) {
    this.opts = opts
    this.cfg = opts.cfg
    this.appviewAgent = opts.appviewAgent
    this.chatAgent = opts.chatAgent
    this.fontMetadata = opts.fontMetadata
    this.renderer = opts.renderer
  }

  static async fromConfig(cfg: Config, overrides?: Partial<AppContextOptions>) {
    const appviewAgent = new AtpAgent({service: cfg.service.appviewUrl})
    const chatAgent = new AtpAgent({service: cfg.service.chatUrl})
    return new AppContext({
      cfg,
      appviewAgent,
      chatAgent,
      fontMetadata: loadFontMetadata(),
      renderer: overrides?.renderer ?? createRenderer(),
      ...overrides,
    })
  }
}
