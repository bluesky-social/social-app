/**
 * @deprecated use `useBreakpoints` from `#/alf` instead
 */
export function useWebMediaQueries() {
  return {
    isMobile: true,
    isTablet: false,
    isTabletOrMobile: true,
    isTabletOrDesktop: false,
    isDesktop: false,
  }
}
