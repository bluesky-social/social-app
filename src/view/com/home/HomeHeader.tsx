import React from 'react'
import {RenderTabBarFnProps} from 'view/com/pager/Pager'
import {FeedsTabBar} from './FeedsTabBar'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

export function HomeHeader(
  props: RenderTabBarFnProps & {testID?: string; onPressSelected: () => void},
) {
  const {isDesktop} = useWebMediaQueries()
  if (isDesktop) {
    return null
  }
  return <FeedsTabBar {...props} />
}
