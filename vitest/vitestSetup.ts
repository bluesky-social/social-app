import {vi} from 'vitest'

/*
 * The only place `react-native` enters the test module graph is a single
 * transitive import in src/lib/media/manip.ts (`import {Image} from
 * 'react-native'`). react-native's entry is Flow-typed, which esbuild cannot
 * parse, so we stub it. manip.ts only touches RNImage.getSize; Platform is
 * included for any other incidental use.
 */
vi.mock('react-native', () => ({
  Image: {getSize: vi.fn()},
  Platform: {
    OS: 'ios',
    select: (o: Record<string, unknown>) => o.ios ?? o.default,
  },
}))
