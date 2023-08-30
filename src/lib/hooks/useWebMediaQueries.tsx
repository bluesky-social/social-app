import {useMediaQuery} from 'react-responsive'
import {isNative} from 'platform/detection'

export function useWebMediaQueries() {
  const isDesktop = useMediaQuery({
    query: '(min-width: 1224px)',
  })
  const isTabletOrMobile = useMediaQuery({query: '(max-width: 1224px)'})
  const isMobile = useMediaQuery({query: '(max-width: 800px)'})
  if (isNative) {
    return {isMobile: true, isTabletOrMobile: true, isDesktop: false}
  }
  return {isMobile, isTabletOrMobile, isDesktop}
}
