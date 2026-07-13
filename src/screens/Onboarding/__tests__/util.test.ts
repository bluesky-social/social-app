import {describe, expect, it, jest} from '@jest/globals'

import {generateComputedConfig} from '#/lib/community/configGenerator'
import {type RawCommunityConfig} from '#/lib/community/types'
import {saveLabelers} from '#/state/session/agent-config'
import {
  resolveFollowDids,
  resolveModerationServiceDids,
  resolveStarterPackUri,
  subscribeToBrandModerationServices,
} from '../util'

jest.mock('#/state/session/agent-config', () => ({
  saveLabelers: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(
  overrides: Partial<RawCommunityConfig['onboarding']> = {},
  moderation: string[] = [],
) {
  const raw: RawCommunityConfig = {
    metadata: {name: 'Test', displayName: 'Test', slug: 'test'},
    branding: {assets: {}, messages: {}},
    theme: {colors: {primary: '#F2973B'}},
    services: {pds: {url: 'https://test.example.com'}, moderation},
    onboarding: overrides,
  }
  return generateComputedConfig(raw)
}

const HARDCODED = ['did:plc:bsky-app', 'did:plc:blacksky']

// ---------------------------------------------------------------------------
// resolveStarterPackUri
// ---------------------------------------------------------------------------

describe('resolveStarterPackUri', () => {
  it('returns the active starter pack URI when present', () => {
    const brand = makeConfig({
      starterPack: 'at://did:plc:config/app.bsky.graph.starterpack/default',
    })
    const result = resolveStarterPackUri(
      'at://did:plc:link/app.bsky.graph.starterpack/fromlink',
      brand,
    )
    expect(result).toBe('at://did:plc:link/app.bsky.graph.starterpack/fromlink')
  })

  it('falls back to brand config starter pack when no active URI', () => {
    const brand = makeConfig({
      starterPack: 'at://did:plc:config/app.bsky.graph.starterpack/default',
    })
    const result = resolveStarterPackUri(undefined, brand)
    expect(result).toBe(
      'at://did:plc:config/app.bsky.graph.starterpack/default',
    )
  })

  it('returns undefined when neither active nor config has a starter pack', () => {
    const brand = makeConfig({})
    const result = resolveStarterPackUri(undefined, brand)
    expect(result).toBeUndefined()
  })

  it('returns undefined when config starter pack is empty string', () => {
    const brand = makeConfig({starterPack: ''})
    const result = resolveStarterPackUri(undefined, brand)
    expect(result).toBeUndefined()
  })

  it('falls back to config when active URI is empty string', () => {
    const brand = makeConfig({
      starterPack: 'at://did:plc:config/app.bsky.graph.starterpack/default',
    })
    const result = resolveStarterPackUri('', brand)
    expect(result).toBe(
      'at://did:plc:config/app.bsky.graph.starterpack/default',
    )
  })
})

// ---------------------------------------------------------------------------
// resolveFollowDids
// ---------------------------------------------------------------------------

describe('resolveFollowDids', () => {
  it('returns empty array when all inputs are empty', () => {
    const brand = makeConfig({})
    const result = resolveFollowDids([], brand, [])
    expect(result).toEqual([])
  })

  it('includes hardcoded DIDs when no config or starter pack DIDs', () => {
    const brand = makeConfig({})
    const result = resolveFollowDids(HARDCODED, brand, [])
    expect(result).toEqual(HARDCODED)
  })

  it('includes auto-follow DIDs from brand config', () => {
    const brand = makeConfig({
      autoFollowDids: ['did:plc:auto1', 'did:plc:auto2'],
    })
    const result = resolveFollowDids(HARDCODED, brand, [])
    expect(result).toEqual([...HARDCODED, 'did:plc:auto1', 'did:plc:auto2'])
  })

  it('includes starter pack member DIDs', () => {
    const brand = makeConfig({})
    const result = resolveFollowDids(HARDCODED, brand, [
      'did:plc:sp1',
      'did:plc:sp2',
    ])
    expect(result).toEqual([...HARDCODED, 'did:plc:sp1', 'did:plc:sp2'])
  })

  it('merges all sources and includes config + starter pack DIDs', () => {
    const brand = makeConfig({
      autoFollowDids: ['did:plc:auto1'],
    })
    const result = resolveFollowDids(HARDCODED, brand, ['did:plc:sp1'])
    expect(result).toEqual([...HARDCODED, 'did:plc:auto1', 'did:plc:sp1'])
  })

  it('deduplicates DIDs across all sources', () => {
    const brand = makeConfig({
      autoFollowDids: ['did:plc:blacksky', 'did:plc:auto1'],
    })
    const result = resolveFollowDids(HARDCODED, brand, [
      'did:plc:auto1',
      'did:plc:sp1',
    ])
    // did:plc:blacksky appears in both hardcoded and config
    // did:plc:auto1 appears in both config and starter pack
    expect(result).toEqual([
      'did:plc:bsky-app',
      'did:plc:blacksky',
      'did:plc:auto1',
      'did:plc:sp1',
    ])
  })

  it('preserves order: hardcoded first, then config, then starter pack', () => {
    const brand = makeConfig({
      autoFollowDids: ['did:plc:config'],
    })
    const result = resolveFollowDids(['did:plc:hard'], brand, [
      'did:plc:starter',
    ])
    expect(result).toEqual([
      'did:plc:hard',
      'did:plc:config',
      'did:plc:starter',
    ])
  })
})

// ---------------------------------------------------------------------------
// Brand moderation services
// ---------------------------------------------------------------------------

describe('resolveModerationServiceDids', () => {
  it('returns empty array when no moderation services are configured', () => {
    const brand = makeConfig({})
    expect(resolveModerationServiceDids(brand)).toEqual([])
  })

  it('deduplicates and removes empty moderation service DIDs', () => {
    const brand = makeConfig({}, [
      'did:plc:mod1',
      '',
      'did:plc:mod1',
      'did:plc:mod2',
    ])
    expect(resolveModerationServiceDids(brand)).toEqual([
      'did:plc:mod1',
      'did:plc:mod2',
    ])
  })
})

describe('subscribeToBrandModerationServices', () => {
  it('subscribes to each resolved moderation service and caches labelers', async () => {
    const brand = makeConfig({}, ['did:plc:mod1', 'did:plc:mod1'])
    const agent = {
      labelers: [] as string[],
      addLabeler: jest.fn((did: string) => {
        agent.labelers.push(did)
      }),
    }

    await subscribeToBrandModerationServices(
      agent as unknown as Parameters<
        typeof subscribeToBrandModerationServices
      >[0],
      'did:plc:user',
      brand,
    )

    expect(agent.addLabeler).toHaveBeenCalledTimes(1)
    expect(agent.addLabeler).toHaveBeenCalledWith('did:plc:mod1')
    expect(saveLabelers).toHaveBeenCalledWith('did:plc:user', ['did:plc:mod1'])
  })

  it('keeps onboarding best-effort when a moderation service fails', async () => {
    const brand = makeConfig({}, ['did:plc:good', 'did:plc:bad'])
    const agent = {
      labelers: [] as string[],
      addLabeler: jest.fn((did: string) => {
        if (did === 'did:plc:bad') {
          throw new Error('failed')
        }
        agent.labelers.push(did)
      }),
    }

    await expect(
      subscribeToBrandModerationServices(
        agent as unknown as Parameters<
          typeof subscribeToBrandModerationServices
        >[0],
        'did:plc:user',
        brand,
      ),
    ).resolves.toBeUndefined()

    expect(agent.addLabeler).toHaveBeenCalledTimes(2)
    expect(saveLabelers).toHaveBeenCalledWith('did:plc:user', ['did:plc:good'])
  })
})
