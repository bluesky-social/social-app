import React from 'react'
import {StyleSheet, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {useNavigation} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {ListItems} from 'view/com/lists/ListItems'
import {EmptyState} from 'view/com/util/EmptyState'
import {Button} from 'view/com/util/forms/Button'
import * as Toast from 'view/com/util/Toast'
import {ListModel} from 'state/models/content/list'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {NavigationProp} from 'lib/routes/types'
import {isDesktopWeb} from 'platform/detection'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileList'>
export const ProfileListScreen = withAuthRequired(
  observer(({route}: Props) => {
    const store = useStores()
    const navigation = useNavigation<NavigationProp>()
    const pal = usePalette('default')
    const {name, rkey} = route.params

    const list: ListModel = React.useMemo(() => {
      const model = new ListModel(
        store,
        `at://${name}/app.bsky.graph.list/${rkey}`,
      )
      return model
    }, [store, name, rkey])
    useSetTitle(list.list?.name)

    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(false)
        list.loadMore(true)
      }, [store, list]),
    )

    const onToggleSubscribed = React.useCallback(async () => {
      try {
        if (list.list?.viewer?.muted) {
          await list.unsubscribe()
        } else {
          await list.subscribe()
        }
      } catch (err) {
        Toast.show(
          'There was an an issue updating your subscription, please check your internet connection and try again.',
        )
        store.log.error('Failed up update subscription', {err})
      }
    }, [store, list])

    const onPressEditList = React.useCallback(() => {
      store.shell.openModal({
        name: 'create-or-edit-mute-list',
        list,
        onSave() {
          list.refresh()
        },
      })
    }, [store, list])

    const onPressDeleteList = React.useCallback(() => {
      store.shell.openModal({
        name: 'confirm',
        title: 'Delete List',
        message: 'Are you sure?',
        async onPressConfirm() {
          await list.delete()
          if (navigation.canGoBack()) {
            navigation.goBack()
          } else {
            navigation.navigate('Home')
          }
        },
      })
    }, [store, list, navigation])

    const renderEmptyState = React.useCallback(() => {
      return <EmptyState icon="users-slash" message="This list is empty!" />
    }, [])

    const renderHeaderBtn = React.useCallback(() => {
      return (
        <View style={styles.headerBtns}>
          {list?.isOwner && (
            <Button
              type="default"
              label="Delete List"
              testID="deleteListBtn"
              accessibilityLabel="Delete list"
              accessibilityHint=""
              onPress={onPressDeleteList}
            />
          )}
          {list?.isOwner && (
            <Button
              type="default"
              label="Edit List"
              testID="editListBtn"
              accessibilityLabel="Edit list"
              accessibilityHint=""
              onPress={onPressEditList}
            />
          )}
          {list.list?.viewer?.muted ? (
            <Button
              type="inverted"
              label="Unsubscribe"
              testID="unsubscribeListBtn"
              accessibilityLabel="Unsubscribe from list"
              accessibilityHint=""
              onPress={onToggleSubscribed}
            />
          ) : (
            <Button
              type="primary"
              label="Subscribe & Mute"
              testID="subscribeListBtn"
              accessibilityLabel="Subscribe to this list"
              accessibilityHint="Mutes the users included in this list"
              onPress={onToggleSubscribed}
            />
          )}
        </View>
      )
    }, [
      list?.isOwner,
      list.list?.viewer?.muted,
      onPressDeleteList,
      onPressEditList,
      onToggleSubscribed,
    ])

    return (
      <CenteredView
        style={[
          styles.container,
          isDesktopWeb && styles.containerDesktop,
          pal.view,
          pal.border,
        ]}
        testID="moderationMutelistsScreen">
        <ViewHeader title="" renderButton={renderHeaderBtn} />
        <ListItems
          list={list}
          renderEmptyState={renderEmptyState}
          onToggleSubscribed={onToggleSubscribed}
          onPressEditList={onPressEditList}
          onPressDeleteList={onPressDeleteList}
        />
      </CenteredView>
    )
  }),
)

const styles = StyleSheet.create({
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  container: {
    flex: 1,
    paddingBottom: isDesktopWeb ? 0 : 100,
  },
  containerDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
})
