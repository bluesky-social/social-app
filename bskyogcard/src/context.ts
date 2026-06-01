import {readdirSync, readFileSync} from 'node:fs'
import * as path from 'node:path'
import {fileURLToPath} from 'node:url'

import {AtpAgent} from '@atproto/api'
import {type FontWeight} from 'satori'

import {type Config} from './config.js'

const __DIRNAME = path.dirname(fileURLToPath(import.meta.url))

export type AppContextOptions = {
  cfg: Config
  appviewAgent: AtpAgent
  chatAgent: AtpAgent
  fonts: {name: string; data: Buffer; weight?: FontWeight}[]
}

export class AppContext {
  cfg: Config
  appviewAgent: AtpAgent
  chatAgent: AtpAgent
  fonts: {name: string; data: Buffer; weight?: FontWeight}[]
  abortController = new AbortController()

  private opts: AppContextOptions

  constructor(opts: AppContextOptions) {
    this.opts = opts
    this.cfg = opts.cfg
    this.appviewAgent = opts.appviewAgent
    this.chatAgent = opts.chatAgent
    this.fonts = opts.fonts
  }

  static async fromConfig(cfg: Config, overrides?: Partial<AppContextOptions>) {
    const appviewAgent = new AtpAgent({service: cfg.service.appviewUrl})
    const chatAgent = new AtpAgent({service: cfg.service.chatUrl})
    const fontDirectory = path.join(__DIRNAME, 'assets', 'fonts')
    const fontFiles = readdirSync(fontDirectory)
    const fonts = fontFiles.map(file => {
      return {
        name: getName(file),
        data: readFileSync(path.join(fontDirectory, file)),
        weight: getWeight(file),
      }
    })
    return new AppContext({
      cfg,
      appviewAgent,
      chatAgent,
      fonts,
      ...overrides,
    })
  }
}

function getName(file: string): string {
  const base = path.basename(file, path.extname(file))
  if (base.startsWith('Inter-')) return 'Inter'
  return base
}

function getWeight(file: string): FontWeight {
  switch (path.basename(file, path.extname(file))) {
    case 'Inter-Regular':
      return 400
    case 'Inter-SemiBold':
      return 600
    case 'Inter-Bold':
    default:
      return 700
  }
}
