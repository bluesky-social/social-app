import {useMediaQuery} from 'react-responsive'

import {isNative} from '#/platform/detection'

export function useWebMediaQueries() {
  const isDesktop = useMediaQuery({query: '(width >= 1300px)'})
  const isTablet = useMediaQuery({query: '(800px <= width < 1300px)'})
  const isMobile = useMediaQuery({query: '(width < 800px)'})
  const isTabletOrMobile = isMobile || isTablet
  const isTabletOrDesktop = isDesktop || isTablet
  if (isNative) {
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
