import {useMediaQuery} from 'react-responsive'

import {IS_NATIVE} from '#/env'

/**
 * @deprecated use `useBreakpoints` from `#/alf` instead
 */
export function useWebMediaQueries() {
  const isDesktop = useMediaQuery({minWidth: 1300})
  const isTablet = useMediaQuery({minWidth: 800, maxWidth: 1300 - 1})
  const isMobile = useMediaQuery({maxWidth: 800 - 1})
  const isTabletOrMobile = isMobile || isTablet
  const isTabletOrDesktop = isDesktop || isTablet
  if (IS_NATIVE) {
    return {
      isMobile: true,
      isTablet: false,
      isTabletOrMobile: true,
      isTabletOrDesktop: false,
      isDesktop: false,
    }
  }
  return {isMobile, isTablet, isTabletOrMobile, isTabletOrDesktop, isDesktop}
}
