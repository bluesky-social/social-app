import {AtpAgent} from '@atproto/api'

export type AppContext = {
  appviewAgent: AtpAgent
  fonts: {name: string; data: Buffer}[]
}
