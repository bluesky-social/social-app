import {type WithSpringConfig} from 'react-native-reanimated'

/**
 * Spring used for showing and hiding shell UI (header, bottom bar, and things
 * attached to them). This is Reanimated 4's default critically damped curve,
 * whose perceptual duration is 550ms, sped up a little.
 */
export const SHELL_SPRING_CONFIG = {
  duration: 400,
  dampingRatio: 1,
} as const satisfies WithSpringConfig
