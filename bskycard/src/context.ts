import {readFileSync} from 'node:fs'

import {AtpAgent} from '@atproto/api'
import * as path from 'path'
import {fileURLToPath} from 'url'

import {Config} from './config.js'

const __DIRNAME = path.dirname(fileURLToPath(import.meta.url))

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
    const fonts = [
      {
        name: 'Inter',
        data: readFileSync(path.join(__DIRNAME, 'assets', 'Inter-Bold.ttf')),
      },
    ]
    return new AppContext({
      cfg,
      appviewAgent,
      fonts,
      ...overrides,
    })
  }
}
