import React from 'react'
import {StyleSheet} from 'react-native'
import {
  useFocusEffect,
  useNavigation,
  StackActions,
} from '@react-navigation/native'
import {AtUri} from '@atproto/api'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {EmptyStateWithButton} from 'view/com/util/EmptyStateWithButton'
import {useStores} from 'state/index'
import {ListsListModel} from 'state/models/lists/lists-list'
import {ListsList} from 'view/com/lists/ListsList'
import {NavigationProp} from 'lib/routes/types'
import {usePalette} from 'lib/hooks/usePalette'
import {CenteredView} from 'view/com/util/Views'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {isDesktopWeb} from 'platform/detection'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ModerationMuteLists'
>
export const ModerationMuteListsScreen = withAuthRequired(({route}: Props) => {
  const pal = usePalette('default')
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()

  const mutelists: ListsListModel = React.useMemo(() => {
    const list = new ListsListModel(store, 'my-modlists')
    list.loadMore()
    return list
  }, [store])

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
    }, [store]),
  )

  const onPressNewMuteList = React.useCallback(() => {
    store.shell.openModal({
      name: 'create-mute-list',
      onCreate: (uri: string) => {
        try {
          const urip = new AtUri(uri)
          navigation.navigate('ProfileList', {
            name: urip.hostname,
            rkey: urip.rkey,
          })
        } catch {}
      },
    })
  }, [store])

  const renderEmptyState = React.useCallback(() => {
    return (
      <EmptyStateWithButton
        icon="users-slash"
        message="You can subscribe to mute-lists to automatically mute all of the users they include. Mute-lists are public but your subscription to a mute-list is private."
        buttonLabel="New Mute List"
        onPress={onPressNewMuteList}
      />
    )
  }, [onPressNewMuteList])

  return (
    <CenteredView
      style={[
        styles.container,
        isDesktopWeb && styles.containerDesktop,
        pal.view,
        pal.border,
      ]}
      testID="moderationMutelistsScreen">
      <ViewHeader title="Mute-list Subscriptions" showOnDesktop />
      <ListsList listsList={mutelists} renderEmptyState={renderEmptyState} />
    </CenteredView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isDesktopWeb ? 0 : 100,
  },
  containerDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  title: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 30,
    marginBottom: 14,
  },
  descriptionDesktop: {
    marginTop: 14,
  },

  flex1: {
    flex: 1,
  },
  empty: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
  },

  footer: {
    height: 200,
    paddingTop: 20,
  },
})
