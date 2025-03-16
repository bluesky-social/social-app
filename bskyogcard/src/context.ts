import {AtpAgent} from '@atproto/api'

import {Config} from './config.js'
import {getFontFiles,readFonts} from './util/fonts.js'

export type AppContextOptions = {
  cfg: Config
  appviewAgent: AtpAgent
  fonts: {name: string; data: Buffer}[]
}

export class AppContext {
  cfg: Config
  appviewAgent: AtpAgent
  fonts: {name: string; data: Buffer}[]
  abortController = new AbortController()

  constructor(private opts: AppContextOptions) {
    this.cfg = this.opts.cfg
    this.appviewAgent = this.opts.appviewAgent
    this.fonts = this.opts.fonts
  }

  static async fromConfig(cfg: Config, overrides?: Partial<AppContextOptions>) {
    const appviewAgent = new AtpAgent({service: cfg.service.appviewUrl})
    const fontFiles = getFontFiles()
    const fonts = readFonts(fontFiles)
    return new AppContext({
      cfg,
      appviewAgent,
      fonts,
      ...overrides,
    })
  }
}
