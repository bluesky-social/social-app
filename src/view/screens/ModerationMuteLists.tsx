import React from 'react'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {TabBar} from '../com/pager/TabBar'
import {Pager, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {MyListsEmptyState} from 'view/com/lists/MyListsEmptyState'
import {SubscribedMutelistsEmptyState} from 'view/com/lists/SubscribedMutelistsEmptyState'
import {useStores} from 'state/index'
import {ListsListModel} from 'state/models/lists/lists-list'
import {ListsList} from 'view/com/lists/ListsList'
import {usePalette} from 'lib/hooks/usePalette'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ModerationMuteLists'
>
export const ModerationMuteListsScreen = withAuthRequired(({route}: Props) => {
  const pal = usePalette('default')
  const store = useStores()
  const [selectedPage, setSelectedPage] = React.useState(0)

  const mine: ListsListModel = React.useMemo(() => {
    const list = new ListsListModel(store, store.me.did)
    list.loadMore()
    return list
  }, [store])

  const mutelists: ListsListModel = React.useMemo(() => {
    const list = new ListsListModel(store, 'mutelists')
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
        items={['My Lists', 'Mutelists']}
        indicatorColor={pal.colors.link}
        indicatorPosition="bottom"
        testID="tabs"
      />
    )
  }, [])

  const renderMineEmptyState = React.useCallback(() => {
    return <MyListsEmptyState />
  }, [])

  const renderMutelistsEmptyState = React.useCallback(() => {
    return <SubscribedMutelistsEmptyState />
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
        testID="mutelistsPage"
        listsList={mutelists}
        renderEmptyState={renderMutelistsEmptyState}
      />
    </Pager>
  )
})
