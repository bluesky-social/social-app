import {useMediaQuery} from 'react-responsive'

export function useWebMediaQueries() {
  const isDesktop = useMediaQuery({query: '(width >= 1300px)'})
  const isTablet = useMediaQuery({query: '(800px <= width < 1300px)'})
  const isMobile = useMediaQuery({query: '(width < 800px)'})
  const isTabletOrMobile = isMobile || isTablet
  const isTabletOrDesktop = isDesktop || isTablet
  return {isMobile, isTablet, isTabletOrMobile, isTabletOrDesktop, isDesktop}
}
