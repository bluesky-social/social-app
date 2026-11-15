import {useMemo} from 'react'
import {useMediaQuery} from 'react-responsive'

import {type Breakpoint, BREAKPOINTS} from '#/alf/breakpoints.shared'

export {type Breakpoint, BreakpointWidthContext} from '#/alf/breakpoints.shared'

export function useBreakpoints(): Record<Breakpoint, boolean> & {
  activeBreakpoint: Breakpoint | undefined
} {
  const gtPhone = useMediaQuery({minWidth: BREAKPOINTS.phone})
  const gtMobile = useMediaQuery({minWidth: BREAKPOINTS.mobile})
  const gtTablet = useMediaQuery({minWidth: BREAKPOINTS.tablet})
  return useMemo(() => {
    let active: Breakpoint | undefined
    if (gtTablet) {
      active = 'gtTablet'
    } else if (gtMobile) {
      active = 'gtMobile'
    } else if (gtPhone) {
      active = 'gtPhone'
    }
    return {
      activeBreakpoint: active,
      gtPhone,
      gtMobile,
      gtTablet,
    }
  }, [gtPhone, gtMobile, gtTablet])
}

/**
 * Fine-tuned breakpoints for the shell layout
 */
export function useLayoutBreakpoints() {
  const rightNavVisible = useMediaQuery({minWidth: BREAKPOINTS.rightNav})
  const centerColumnOffset = useMediaQuery({
    minWidth: BREAKPOINTS.rightNav,
    maxWidth: BREAKPOINTS.tablet,
  })
  const leftNavMinimal = useMediaQuery({maxWidth: BREAKPOINTS.tablet})

  return {
    rightNavVisible,
    centerColumnOffset,
    leftNavMinimal,
  }
}
