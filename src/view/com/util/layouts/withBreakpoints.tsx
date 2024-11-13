import React from 'react'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

export const withBreakpoints = <P extends object>(
  Mobile: React.ComponentType<P>,
  Tablet: React.ComponentType<P>,
  Desktop: React.ComponentType<P>,
): React.FC<P> =>
  function WithBreakpoints(props: P) {
    const {isMobile, isTablet} = useWebMediaQueries()

    if (isMobile) {
      return <Mobile {...props} />
    }
    if (isTablet) {
      return <Tablet {...props} />
    }
    return <Desktop {...props} />
  }
