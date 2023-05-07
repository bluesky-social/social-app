import React from 'react'
import {StyleSheet} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {ListItems} from 'view/com/lists/ListItems'
import {EmptyState} from 'view/com/util/EmptyState'
import {ListModel} from 'state/models/content/list'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileList'>
export const ProfileListScreen = withAuthRequired(
  observer(({route}: Props) => {
    const store = useStores()
    const pal = usePalette('default')
    const {name, rkey} = route.params

    const list: ListModel = React.useMemo(() => {
      const model = new ListModel(
        store,
        `at://${name}/app.bsky.graph.list/${rkey}`,
      )
      return model
    }, [store, name, rkey])

    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(false)
        list.loadMore(true)
      }, [store]),
    )

    const renderEmptyState = React.useCallback(() => {
      return <EmptyState icon="users-slash" message="This list is empty!" />
    }, [])

    console.log('render')
    return (
      <CenteredView
        style={[
          styles.container,
          isDesktopWeb && styles.containerDesktop,
          pal.view,
          pal.border,
        ]}
        testID="moderationMutelistsScreen">
        <ViewHeader
          title={`List by ${list.list?.creator.handle}`}
          showOnDesktop
        />
        <ListItems list={list} renderEmptyState={renderEmptyState} />
      </CenteredView>
    )
  }),
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isDesktopWeb ? 0 : 100,
  },
  containerDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
})
