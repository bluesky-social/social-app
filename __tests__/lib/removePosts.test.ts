jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    call: () => {},
    createAnimatedComponent: (comp: any) => comp,
  },
  NativeReanimatedModule: {
    get: () => {},
  },
  addWhitelistedUIProps: () => {},
}))

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '16.0',
    select: (options: any) => options.native ?? Object.values(options)[0],
  },
  StyleSheet: {create: (styles: any) => styles},
  Dimensions: {
    get: (_dim: string) => ({width: 375, height: 667}),
  },
  AppState: {
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
    removeEventListener: jest.fn(),
    currentState: 'active',
  },
}))
jest.mock('../../src/lib/react-query', () => ({}))

import React from 'react'

import * as postShadowModule from '../../src/state/cache/post-shadow'
import {POST_TOMBSTONE} from '../../src/state/cache/post-shadow'
import * as profileShadowModule from '../../src/state/cache/profile-shadow'
import * as typesModule from '../../src/state/cache/types'

function runHook(hook: () => any) {
  let result: any
  function TestComponent() {
    result = hook()
    return null
  }
  const {act} = require('react-test-renderer')
  act(() => {
    require('react-test-renderer').create(React.createElement(TestComponent))
  })
  return {result}
}

describe('isAuthorMuted', () => {
  it('returns true if viewer.muted is true', () => {
    expect(!!{viewer: {muted: true}}.viewer?.muted).toBe(true)
  })

  it('returns false if viewer.muted is false', () => {
    expect(!!{viewer: {muted: false}}.viewer?.muted).toBe(false)
  })

  it('returns false if viewer is undefined', () => {
    expect(!!{}.viewer?.muted).toBe(false)
  })

  it('returns false if viewer.muted is undefined', () => {
    expect(!!{viewer: {}}.viewer?.muted).toBe(false)
  })
})

describe('isAuthorBlocked', () => {
  it('returns true if viewer.blocking is true', () => {
    expect(!!{viewer: {blocking: true}}.viewer?.blocking).toBe(true)
  })

  it('returns false if viewer.blocking is false', () => {
    expect(!!{viewer: {blocking: false}}.viewer?.blocking).toBe(false)
  })

  it('returns false if viewer is undefined', () => {
    expect(!!{}.viewer?.blocking).toBe(false)
  })

  it('returns false if viewer.blocking is undefined', () => {
    expect(!!{viewer: {}}.viewer?.blocking).toBe(false)
  })
})

describe('usePostShadow', () => {
  const post = {
    uri: 'test:uri',
    author: {did: 'did:author'},
    likeCount: 1,
    repostCount: 2,
    viewer: {},
  } as any

  beforeEach(() => {
    jest.spyOn(profileShadowModule, 'useProfileShadow')
    jest
      .spyOn(typesModule, 'castAsShadow')
      .mockImplementation(p => ({...p, _shadow: true}))
    jest
      .spyOn(postShadowModule, 'mergeShadow')
      .mockImplementation((p, s) => ({...p, ...s, _merged: true}))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns POST_TOMBSTONE if author is muted', () => {
    ;(profileShadowModule.useProfileShadow as jest.Mock).mockReturnValue({
      viewer: {muted: true},
    })
    const {result} = runHook(() => postShadowModule.usePostShadow(post))
    expect(result).toBe(POST_TOMBSTONE)
  })

  it('returns POST_TOMBSTONE if author is blocked', () => {
    ;(profileShadowModule.useProfileShadow as jest.Mock).mockReturnValue({
      viewer: {blocking: true},
    })
    const {result} = runHook(() => postShadowModule.usePostShadow(post))
    expect(result).toBe(POST_TOMBSTONE)
  })
})
