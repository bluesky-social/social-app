import React from 'react'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {TabBar} from '../com/pager/TabBar'
import {Pager, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {MyListsEmptyState} from 'view/com/lists/MyListsEmptyState'
import {SubscribedBlocklistsEmptyState} from 'view/com/lists/SubscribedBlocklistsEmptyState'
import {useStores} from 'state/index'
import {ListsListModel} from 'state/models/lists/lists-list'
import {ListsList} from 'view/com/lists/ListsList'
import {usePalette} from 'lib/hooks/usePalette'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Lists'>
export const ListsScreen = withAuthRequired(({route}: Props) => {
  const pal = usePalette('default')
  const store = useStores()
  const [selectedPage, setSelectedPage] = React.useState(0)

  const mine: ListsListModel = React.useMemo(() => {
    const list = new ListsListModel(store, store.me.did)
    list.loadMore()
    return list
  }, [store])

  const blocklists: ListsListModel = React.useMemo(() => {
    const list = new ListsListModel(store, 'blocklists')
    list.loadMore()
    return list
  }, [store])

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
    }, [store, selectedPage]),
  )

  const onPageSelected = React.useCallback(
    (index: number) => {
      setSelectedPage(index)
    },
    [store, setSelectedPage],
  )

  const renderTabBar = React.useCallback((props: RenderTabBarFnProps) => {
    return (
      <TabBar
        {...props}
        items={['My Lists', 'Blocklists']}
        indicatorColor={pal.colors.link}
        indicatorPosition="bottom"
        testID="tabs"
      />
    )
  }, [])

  const renderMineEmptyState = React.useCallback(() => {
    return <MyListsEmptyState />
  }, [])

  const renderBlockliststEmptyState = React.useCallback(() => {
    return <SubscribedBlocklistsEmptyState />
  }, [])

  return (
    <Pager
      testID="listsScreen"
      onPageSelected={onPageSelected}
      renderTabBar={renderTabBar}
      tabBarPosition="top">
      <ListsList
        key="1"
        testID="minePage"
        listsList={mine}
        renderEmptyState={renderMineEmptyState}
      />
      <ListsList
        key="2"
        testID="blocklistsPage"
        listsList={blocklists}
        renderEmptyState={renderBlockliststEmptyState}
      />
    </Pager>
  )
})
