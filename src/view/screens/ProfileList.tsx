import React from 'react'
import {StyleSheet} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {useNavigation} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {ListItems} from 'view/com/lists/ListItems'
import {EmptyState} from 'view/com/util/EmptyState'
import * as Toast from 'view/com/util/Toast'
import {ListModel} from 'state/models/content/list'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {toShareUrl} from 'lib/strings/url-helpers'
import {shareUrl} from 'lib/sharing'
import {ListActions} from 'view/com/lists/ListActions'
import {s} from 'lib/styles'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileList'>
export const ProfileListScreen = withAuthRequired(
  observer(({route}: Props) => {
    const store = useStores()
    const navigation = useNavigation<NavigationProp>()
    const {isTabletOrDesktop} = useWebMediaQueries()
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

    const onPressReportList = React.useCallback(() => {
      if (!list.list) return
      store.shell.openModal({
        name: 'report',
        uri: list.uri,
        cid: list.list.cid,
      })
    }, [store, list])

    const onPressShareList = React.useCallback(() => {
      const url = toShareUrl(`/profile/${name}/lists/${rkey}`)
      shareUrl(url)
    }, [name, rkey])

    const renderEmptyState = React.useCallback(() => {
      return <EmptyState icon="users-slash" message="This list is empty!" />
    }, [])

    const renderHeaderBtns = React.useCallback(() => {
      return (
        <ListActions
          muted={list.list?.viewer?.muted}
          isOwner={list.isOwner}
          onPressDeleteList={onPressDeleteList}
          onPressEditList={onPressEditList}
          onToggleSubscribed={onToggleSubscribed}
          onPressShareList={onPressShareList}
          onPressReportList={onPressReportList}
          reversed={true}
        />
      )
    }, [
      list.isOwner,
      list.list?.viewer?.muted,
      onPressDeleteList,
      onPressEditList,
      onPressShareList,
      onToggleSubscribed,
      onPressReportList,
    ])

    return (
      <CenteredView
        style={[
          styles.container,
          isTabletOrDesktop && styles.containerDesktop,
          pal.view,
          pal.border,
        ]}
        testID="moderationMutelistsScreen">
        <ViewHeader title="" renderButton={renderHeaderBtns} />
        <ListItems
          list={list}
          renderEmptyState={renderEmptyState}
          onToggleSubscribed={onToggleSubscribed}
          onPressEditList={onPressEditList}
          onPressDeleteList={onPressDeleteList}
          onPressReportList={onPressReportList}
          onPressShareList={onPressShareList}
          style={[s.flex1]}
        />
      </CenteredView>
    )
  }),
)

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
})
