import React from 'react'
import {act, renderHook} from '@testing-library/react-native'

import * as persisted from '#/state/persisted'
import {
  Provider as DmImageBlurProvider,
  useDmImageAlwaysBlur,
  useDmImageBlurFromNonFollows,
  useSetDmImageAlwaysBlur,
  useSetDmImageBlurFromNonFollows,
} from '#/state/preferences/dm-image-blur'

// Mock the persisted module
jest.mock('#/state/persisted', () => ({
  defaults: {
    dmImageBlurFromNonFollows: false,
    dmImageAlwaysBlur: false,
  },
  get: jest.fn((key: string) => {
    if (key === 'dmImageBlurFromNonFollows') return false
    if (key === 'dmImageAlwaysBlur') return false
    return undefined
  }),
  write: jest.fn(),
  onUpdate: jest.fn(() => () => {}),
}))

const wrapper = ({children}: {children: React.ReactNode}) => (
  <DmImageBlurProvider>{children}</DmImageBlurProvider>
)

describe('DM Image Blur Preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Default Values', () => {
    it('should return false for dmImageBlurFromNonFollows by default', () => {
      const {result} = renderHook(() => useDmImageBlurFromNonFollows(), {
        wrapper,
      })
      expect(result.current).toBe(false)
    })

    it('should return false for dmImageAlwaysBlur by default', () => {
      const {result} = renderHook(() => useDmImageAlwaysBlur(), {wrapper})
      expect(result.current).toBe(false)
    })
  })

  describe('Persisted Values', () => {
    it('should read initial value from persisted storage for blurFromNonFollows', () => {
      ;(persisted.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'dmImageBlurFromNonFollows') return true
        return false
      })

      const {result} = renderHook(() => useDmImageBlurFromNonFollows(), {
        wrapper,
      })
      expect(persisted.get).toHaveBeenCalledWith('dmImageBlurFromNonFollows')
      expect(result.current).toBe(true)
    })

    it('should read initial value from persisted storage for alwaysBlur', () => {
      ;(persisted.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'dmImageAlwaysBlur') return true
        return false
      })

      const {result} = renderHook(() => useDmImageAlwaysBlur(), {wrapper})
      expect(persisted.get).toHaveBeenCalledWith('dmImageAlwaysBlur')
      expect(result.current).toBe(true)
    })
  })

  describe('Setting Values', () => {
    it('should update blurFromNonFollows and call persisted.write', () => {
      const {result: setter} = renderHook(
        () => useSetDmImageBlurFromNonFollows(),
        {wrapper},
      )

      act(() => {
        setter.current(true)
      })

      expect(persisted.write).toHaveBeenCalledWith(
        'dmImageBlurFromNonFollows',
        true,
      )
    })

    it('should update alwaysBlur and call persisted.write', () => {
      const {result: setter} = renderHook(() => useSetDmImageAlwaysBlur(), {
        wrapper,
      })

      act(() => {
        setter.current(true)
      })

      expect(persisted.write).toHaveBeenCalledWith('dmImageAlwaysBlur', true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined values from persisted storage', () => {
      ;(persisted.get as jest.Mock).mockReturnValue(undefined)

      const {result: blurFromNonFollows} = renderHook(
        () => useDmImageBlurFromNonFollows(),
        {wrapper},
      )
      const {result: alwaysBlur} = renderHook(() => useDmImageAlwaysBlur(), {
        wrapper,
      })

      expect(blurFromNonFollows.current).toBe(false)
      expect(alwaysBlur.current).toBe(false)
    })

    it('should coerce truthy values to boolean true', () => {
      ;(persisted.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'dmImageBlurFromNonFollows') return 1 // truthy non-boolean
        if (key === 'dmImageAlwaysBlur') return 'yes' // truthy non-boolean
        return false
      })

      const {result: blurFromNonFollows} = renderHook(
        () => useDmImageBlurFromNonFollows(),
        {wrapper},
      )
      const {result: alwaysBlur} = renderHook(() => useDmImageAlwaysBlur(), {
        wrapper,
      })

      expect(blurFromNonFollows.current).toBe(true)
      expect(alwaysBlur.current).toBe(true)
    })

    it('should register onUpdate listeners', () => {
      renderHook(() => useDmImageBlurFromNonFollows(), {wrapper})
      renderHook(() => useDmImageAlwaysBlur(), {wrapper})

      expect(persisted.onUpdate).toHaveBeenCalledWith(
        'dmImageBlurFromNonFollows',
        expect.any(Function),
      )
      expect(persisted.onUpdate).toHaveBeenCalledWith(
        'dmImageAlwaysBlur',
        expect.any(Function),
      )
    })
  })

  describe('Multiple Hook Instances', () => {
    it('should share state across multiple hook instances', () => {
      const {result: getter1} = renderHook(
        () => useDmImageBlurFromNonFollows(),
        {
          wrapper,
        },
      )
      const {result: getter2} = renderHook(
        () => useDmImageBlurFromNonFollows(),
        {
          wrapper,
        },
      )
      const {result: setter} = renderHook(
        () => useSetDmImageBlurFromNonFollows(),
        {wrapper},
      )

      expect(getter1.current).toBe(getter2.current)

      act(() => {
        setter.current(true)
      })

      expect(getter1.current).toBe(getter2.current)
    })
  })
})
