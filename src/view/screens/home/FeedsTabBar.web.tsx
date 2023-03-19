import React from 'react'
import {observer} from 'mobx-react-lite'
import {TabBar} from 'view/com/util/TabBar'
import {CenteredView} from 'view/com/util/Views'
import {RenderTabBarFnProps} from 'view/com/util/pager/Pager'
import {usePalette} from 'lib/hooks/usePalette'

export const FeedsTabBar = observer(
  (props: RenderTabBarFnProps & {onPressSelected: () => void}) => {
    const pal = usePalette('default')
    return (
      <CenteredView>
        <TabBar
          {...props}
          items={['Following', "What's hot"]}
          indicatorPosition="bottom"
          indicatorColor={pal.colors.link}
        />
      </CenteredView>
    )
  },
)
