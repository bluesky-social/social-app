import React from 'react'
import {useMediaQuery} from 'react-responsive'
import {isNative} from 'platform/detection'

export const withBreakpoints =
  <P extends object>(
    Mobile: React.ComponentType<P>,
    Tablet: React.ComponentType<P>,
    Desktop: React.ComponentType<P>,
  ): React.FC<P> =>
  (props: P) => {
    const isTabletOrMobile = useMediaQuery({query: '(max-width: 1224px)'})
    const isMobile = useMediaQuery({query: '(max-width: 800px)'})

    if (isMobile || isNative) {
      return <Mobile {...props} />
    }
    if (isTabletOrMobile) {
      return <Tablet {...props} />
    }
    return <Desktop {...props} />
  }
