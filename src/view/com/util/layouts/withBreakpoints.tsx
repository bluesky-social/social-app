import {ComponentType, FC} from 'react'

import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {isNative} from 'platform/detection'

export const withBreakpoints = <P extends object>(
  Mobile: ComponentType<P>,
  Tablet: ComponentType<P>,
  Desktop: ComponentType<P>,
): FC<P> =>
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
