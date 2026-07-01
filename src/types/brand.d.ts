import {type ComputedBrandConfig} from '#/lib/community/types'

declare global {
  interface Window {
    __BRAND_CONFIG__?: ComputedBrandConfig
  }
}

export {}
