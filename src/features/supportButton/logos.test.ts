import {getProviderLogo, PROVIDER_LOGOS} from './logos'
import {SUPPORT_PROVIDERS} from './providers'

/*
 * The icon template drags in the whole component tree (and native modules)
 * which can't load under Jest. We only care about the map's keys here.
 */
jest.mock('#/components/icons/TEMPLATE', () => ({
  createSinglePathSVG: () => () => null,
}))

describe('provider logos', () => {
  it('only defines logos for providers that exist', () => {
    const ids = new Set(SUPPORT_PROVIDERS.map(p => p.id))
    for (const id of Object.keys(PROVIDER_LOGOS)) {
      expect(ids.has(id)).toBe(true)
    }
  })

  it('falls back to null for providers without a logo', () => {
    expect(getProviderLogo('kofi')).not.toBeNull()
    expect(getProviderLogo('throne')).toBeNull()
    expect(getProviderLogo(undefined)).toBeNull()
  })
})
