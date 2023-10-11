import React from 'react'
import {StyleSheet} from 'react-native'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {AtUri} from '@atproto/api'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {useStores} from 'state/index'
import {ListsListModel} from 'state/models/lists/lists-list'
import {ListsList} from 'view/com/lists/ListsList'
import {NavigationProp} from 'lib/routes/types'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {CenteredView} from 'view/com/util/Views'
import {ViewHeader} from 'view/com/util/ViewHeader'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ModerationModlists'>
export const ModerationModlistsScreen = withAuthRequired(({}: Props) => {
  const pal = usePalette('default')
  const store = useStores()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const navigation = useNavigation<NavigationProp>()

  const mutelists: ListsListModel = React.useMemo(
    () => new ListsListModel(store, 'mine'),
    [store],
  )

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
      mutelists.refresh()
    }, [store, mutelists]),
  )

  const onPressNewList = React.useCallback(
    (purpose: string) => {
      store.shell.openModal({
        name: 'create-or-edit-list',
        purpose,
        onSave: (uri: string) => {
          try {
            const urip = new AtUri(uri)
            navigation.navigate('ProfileList', {
              name: urip.hostname,
              rkey: urip.rkey,
            })
          } catch {}
        },
      })
    },
    [store, navigation],
  )

  return (
    <CenteredView
      style={[
        styles.container,
        pal.view,
        pal.border,
        isTabletOrDesktop && styles.containerDesktop,
      ]}
      testID="ModerationModlistsScreen">
      <ViewHeader title="Moderation Lists" showOnDesktop />
      <ListsList
        listsList={mutelists}
        purpose="mod"
        onPressCreateNew={onPressNewList}
      />
    </CenteredView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
  },
  containerDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: 0,
  },
  createBtn: {
    width: 40,
  },
})
