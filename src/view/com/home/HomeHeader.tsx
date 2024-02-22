import React from 'react'
import {RenderTabBarFnProps} from 'view/com/pager/Pager'
import {FeedsTabBar} from './FeedsTabBar'

export function HomeHeader(
  props: RenderTabBarFnProps & {testID?: string; onPressSelected: () => void},
) {
  return <FeedsTabBar {...props} />
}
