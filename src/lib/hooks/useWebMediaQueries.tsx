import {useBreakpoints} from '#/alf/breakpoints'

/**
 * @deprecated use `useBreakpoints` from `#/alf` instead
 */
export function useWebMediaQueries() {
  const {gtMobile, gtTablet} = useBreakpoints()
  const isDesktop = gtTablet
  const isTablet = gtMobile && !gtTablet
  const isMobile = !gtMobile
  const isTabletOrMobile = isMobile || isTablet
  const isTabletOrDesktop = isDesktop || isTablet
  return {isMobile, isTablet, isTabletOrMobile, isTabletOrDesktop, isDesktop}
}
