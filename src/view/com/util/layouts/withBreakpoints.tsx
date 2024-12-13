import React from 'react'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {isNative} from '#/platform/detection'

export const withBreakpoints = <P extends object>(
  Mobile: React.ComponentType<P>,
  Tablet: React.ComponentType<P>,
  Desktop: React.ComponentType<P>,
): React.FC<P> =>
  function WithBreakpoints(props: P) {
    const {isMobile, isTabletOrMobile} = useWebMediaQueries()

    if (isMobile || isNative) {
      return <Mobile {...props} />
    }
    if (isTabletOrMobile) {
      return <Tablet {...props} />
    }
    return <Desktop {...props} />
  }
