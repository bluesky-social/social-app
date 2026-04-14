/*
 * Thin wrapper over react-native-reanimated's useReducedMotion, for parity
 * with existing custom-animations usage (see src/lib/custom-animations/).
 */

import {useReducedMotion as useReducedMotionRN} from 'react-native-reanimated'

export function useReducedMotion(): boolean {
  return useReducedMotionRN()
}
