import React from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {useNavigation} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {SimpleViewHeader} from 'view/com/util/SimpleViewHeader'
import {Text} from 'view/com/util/text/Text'
import {TextLink} from 'view/com/util/Link'
import {NativeDropdown, DropdownItem} from 'view/com/util/forms/NativeDropdown'
import {CenteredView} from 'view/com/util/Views'
import {ListItems} from 'view/com/lists/ListItems'
import {LoadLatestBtn} from 'view/com/util/load-latest/LoadLatestBtn'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {EmptyState} from 'view/com/util/EmptyState'
import {RichText} from 'view/com/util/text/RichText'
import {Feed} from 'view/com/posts/Feed'
import {Pager, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {TabBar} from 'view/com/pager/TabBar'
import {Button} from 'view/com/util/forms/Button'
// import * as Toast from 'view/com/util/Toast'
import {ListModel} from 'state/models/content/list'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {NavigationProp} from 'lib/routes/types'
import {toShareUrl} from 'lib/strings/url-helpers'
import {shareUrl} from 'lib/sharing'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {resolveName} from 'lib/api'
import {s} from 'lib/styles'
import {isNative} from 'platform/detection'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileList'>
export const ProfileListScreen = withAuthRequired(
  observer(function ProfileListScreenImpl(props: Props) {
    const pal = usePalette('default')
    const store = useStores()
    const navigation = useNavigation<NavigationProp>()

    const {name: handleOrDid} = props.route.params

    const [listOwnerDid, setListOwnerDid] = React.useState<string | undefined>()
    const [error, setError] = React.useState<string | undefined>()

    const onPressBack = React.useCallback(() => {
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        navigation.navigate('Home')
      }
    }, [navigation])

    React.useEffect(() => {
      /*
       * We must resolve the DID of the list owner before we can fetch the list.
       */
      async function fetchDid() {
        try {
          const did = await resolveName(store, handleOrDid)
          setListOwnerDid(did)
        } catch (e) {
          setError(
            `We're sorry, but we were unable to resolve this list. If this persists, please contact the list creator, @${handleOrDid}.`,
          )
        }
      }

      fetchDid()
    }, [store, handleOrDid, setListOwnerDid])

    if (error) {
      return (
        <CenteredView>
          <View
            style={[
              pal.view,
              pal.border,
              {
                margin: 10,
                paddingHorizontal: 18,
                paddingVertical: 14,
                borderRadius: 6,
              },
            ]}>
            <Text type="title-lg" style={[pal.text, s.mb10]}>
              Could not load list
            </Text>
            <Text type="md" style={[pal.text, s.mb20]}>
              {error}
            </Text>

            <View style={{flexDirection: 'row'}}>
              <Button
                type="default"
                accessibilityLabel="Go Back"
                accessibilityHint="Return to previous page"
                onPress={onPressBack}
                style={{flexShrink: 1}}>
                <Text type="button" style={pal.text}>
                  Go Back
                </Text>
              </Button>
            </View>
          </View>
        </CenteredView>
      )
    }

    return listOwnerDid ? (
      <ProfileListScreenInner {...props} listOwnerDid={listOwnerDid} />
    ) : (
      <CenteredView>
        <View style={s.p20}>
          <ActivityIndicator size="large" />
        </View>
      </CenteredView>
    )
  }),
)

export const ProfileListScreenInner = observer(
  function ProfileListScreenInnerImpl({
    route,
    listOwnerDid,
  }: Props & {listOwnerDid: string}) {
    const store = useStores()
    const navigation = useNavigation<NavigationProp>()
    const pal = usePalette('default')
    const {rkey} = route.params

    const list: ListModel = React.useMemo(() => {
      const model = new ListModel(
        store,
        `at://${listOwnerDid}/app.bsky.graph.list/${rkey}`,
      )
      return model
    }, [store, listOwnerDid, rkey])
    const feed = React.useMemo(
      () => new PostsFeedModel(store, 'list', {list: list.uri}),
      [store, list],
    )
    useSetTitle(list.data?.name)

    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(false)
        list.loadMore(true)
      }, [store, list]),
    )

    /*const onToggleSubscribed = React.useCallback(async () => {
      try {
        if (list.data?.viewer?.muted) {
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
    }, [store, list])*/

    const onPressEdit = React.useCallback(() => {
      store.shell.openModal({
        name: 'create-or-edit-list',
        list,
        onSave() {
          list.refresh()
        },
      })
    }, [store, list])

    const onPressDelete = React.useCallback(() => {
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

    const onPressReport = React.useCallback(() => {
      if (!list.data) return
      store.shell.openModal({
        name: 'report',
        uri: list.uri,
        cid: list.data.cid,
      })
    }, [store, list])

    const onPressShare = React.useCallback(() => {
      const url = toShareUrl(`/profile/${list.creatorDid}/lists/${rkey}`)
      shareUrl(url)
    }, [list.creatorDid, rkey])

    const onPressAddUser = React.useCallback(() => {
      store.shell.openModal({
        name: 'list-add-user',
        list,
        onAdd() {
          if (list.isCuratelist) {
            feed.refresh()
          }
        },
      })
    }, [store, list, feed])

    const dropdownItems: DropdownItem[] = React.useMemo(() => {
      if (!list.hasLoaded) {
        return []
      }
      let items: DropdownItem[] = [
        {
          testID: 'listHeaderDropdownShareBtn',
          label: 'Share',
          onPress: onPressShare,
          icon: {
            ios: {
              name: 'square.and.arrow.up', // TODO
            },
            android: '',
            web: 'share',
          },
        },
      ]
      if (list.isOwner) {
        items.push({label: 'separator'})
        items.push({
          testID: 'listHeaderDropdownEditBtn',
          label: 'Edit List',
          onPress: onPressEdit,
          icon: {
            ios: {
              name: 'exclamationmark.triangle', // TODO
            },
            android: '',
            web: 'pen',
          },
        })
        items.push({
          testID: 'listHeaderDropdownDeleteBtn',
          label: 'Delete List',
          onPress: onPressDelete,
          icon: {
            ios: {
              name: 'trash', // TODO
            },
            android: '',
            web: ['far', 'trash-can'],
          },
        })
      } else {
        items.push({label: 'separator'})
        items.push({
          testID: 'listHeaderDropdownReportBtn',
          label: 'Report List',
          onPress: onPressReport,
          icon: {
            ios: {
              name: 'exclamationmark.triangle', // TODO
            },
            android: '',
            web: 'circle-exclamation',
          },
        })
      }
      return items
    }, [
      list.hasLoaded,
      list.isOwner,
      onPressShare,
      onPressEdit,
      onPressDelete,
      onPressReport,
    ])

    const onPressSelected = React.useCallback(() => {
      // TODO
      store.emitScreenSoftReset()
    }, [store])

    const renderTabBar = React.useCallback(
      (props: RenderTabBarFnProps) => {
        return (
          <Container>
            <TabBar
              {...props}
              items={list.isCuratelist ? ['Posts', 'About'] : ['About']}
              indicatorColor={pal.colors.link}
              onPressSelected={onPressSelected}
            />
          </Container>
        )
      },
      [list.isCuratelist, onPressSelected, pal.colors.link],
    )

    if (list.isCuratelist) {
      return (
        <View style={s.hContentRegion}>
          <Header list={list} dropdownItems={dropdownItems} />
          <Pager renderTabBar={renderTabBar} tabBarPosition="top">
            <FeedPage key="1" feed={feed} />
            <AboutPage key="2" list={list} onPressAddUser={onPressAddUser} />
          </Pager>
        </View>
      )
    }
    return (
      <View style={s.hContentRegion}>
        <Header list={list} dropdownItems={dropdownItems} />
        <Pager renderTabBar={renderTabBar} tabBarPosition="top">
          <AboutPage key="1" list={list} onPressAddUser={onPressAddUser} />
        </Pager>
      </View>
    )
  },
)

function Container({
  children,
  style,
}: React.PropsWithChildren<{style?: StyleProp<ViewStyle>}>) {
  const pal = usePalette('default')
  return (
    <CenteredView
      style={[
        {
          borderLeftWidth: 1,
          borderRightWidth: 1,
        },
        pal.border,
        style,
      ]}>
      {children}
    </CenteredView>
  )
}

const Header = observer(function HeaderImpl({
  list,
  dropdownItems,
}: {
  list: ListModel
  dropdownItems: DropdownItem[]
}) {
  const store = useStores()
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')

  if (list.hasError || !list.data) {
    return (
      <SimpleViewHeader
        showBackButton={isMobile}
        style={
          !isMobile && [pal.border, {borderLeftWidth: 1, borderRightWidth: 1}]
        }>
        <Text
          type="title-lg"
          style={{flex: 1, fontWeight: 'bold'}}
          numberOfLines={1}>
          {list.isLoading ? 'Loading...' : 'Failed to load'}
        </Text>
      </SimpleViewHeader>
    )
  }
  return (
    <SimpleViewHeader
      showBackButton={isMobile}
      style={
        !isMobile && [pal.border, {borderLeftWidth: 1, borderRightWidth: 1}]
      }>
      <View
        style={{flex: 1, gap: 12, flexDirection: 'row', alignItems: 'center'}}>
        <UserAvatar type="list" avatar={list.data.avatar} size={48} />
        <View style={{flex: 1}}>
          <Text
            type="title-lg"
            style={{flex: 1, fontWeight: 'bold'}}
            numberOfLines={1}>
            <TextLink
              type="title-lg"
              href="/"
              style={[pal.text, {fontWeight: 'bold'}]}
              text={list.data?.name || ''}
              onPress={() => store.emitScreenSoftReset()}
            />
          </Text>

          <Text type="md" style={[pal.textLight]} numberOfLines={1}>
            {list.isModlist && 'Moderation list '}
            by{' '}
            {list.isOwner ? (
              'you'
            ) : (
              <TextLink
                text={sanitizeHandle(list.data.creator.handle, '@')}
                href={makeProfileLink(list.data.creator)}
                style={pal.textLight}
              />
            )}
          </Text>
        </View>
        <NativeDropdown
          testID="listHeaderDropdownBtn"
          items={dropdownItems}
          accessibilityLabel="More options"
          accessibilityHint="">
          <View
            style={{
              paddingLeft: 12,
              paddingRight: isMobile ? 12 : 0,
            }}>
            <FontAwesomeIcon
              icon="ellipsis"
              size={20}
              color={pal.colors.textLight}
            />
          </View>
        </NativeDropdown>
      </View>
    </SimpleViewHeader>
  )
})

const AboutPage = observer(function AboutPageImpl({
  list,
  onPressAddUser,
}: {
  list: ListModel
  onPressAddUser: () => void
}) {
  const pal = usePalette('default')

  const renderEmptyState = React.useCallback(() => {
    return (
      <EmptyState
        icon="users-slash"
        message="This list is empty!"
        style={{paddingTop: 40}}
      />
    )
  }, [])

  if (list.error && !list.data) {
    return <View />
  }
  if (!list.data) {
    return (
      <Container style={[{borderTopWidth: 1, padding: 12}, pal.border]}>
        <ActivityIndicator />
      </Container>
    )
  }
  return (
    <Container
      style={[
        // @ts-ignore web only -prf
        !isNative && {minHeight: '100vh'},
      ]}>
      <View
        style={[
          {
            borderTopWidth: 1,
            paddingVertical: 20,
            paddingHorizontal: 20,
            gap: 12,
          },
          pal.border,
        ]}>
        {list.descriptionRT ? (
          <RichText
            testID="listDescription"
            type="lg"
            style={pal.text}
            richText={list.descriptionRT}
          />
        ) : (
          <Text type="lg" style={[{fontStyle: 'italic'}, pal.textLight]}>
            No description
          </Text>
        )}
        {list.isOwner && (
          <View style={{flexDirection: 'row'}}>
            <Button type="default" label="Add user" onPress={onPressAddUser} />
          </View>
        )}
      </View>
      <ListItems
        list={list}
        renderEmptyState={renderEmptyState}
        style={s.flex1}
      />
    </Container>
  )
})

const FeedPage = observer(function FeedPageImpl({
  feed,
}: {
  feed: PostsFeedModel
}) {
  const pal = usePalette('default')
  const store = useStores()

  const [onMainScroll, isScrolledDown, resetMainScroll] = useOnMainScroll(store)
  const scrollElRef = React.useRef<FlatList>(null)
  const hasNew = feed.hasNewLatest && !feed.isRefreshing

  React.useEffect(() => {
    // called on first load
    if (!feed.hasLoaded) {
      feed.setup()
    }
  }, [feed])

  const scrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToIndex({index: 0})
    resetMainScroll()
  }, [resetMainScroll])

  const onPressTryAgain = React.useCallback(() => {
    feed.refresh()
  }, [feed])

  const onPressLoadLatest = React.useCallback(() => {
    scrollToTop()
    feed.refresh()
  }, [feed, scrollToTop])

  const renderEmptyState = React.useCallback(() => {
    return (
      <EmptyState
        icon="feed"
        message="This feed is empty!"
        style={[pal.border, {borderTopWidth: 1, paddingTop: 40}]}
      />
    )
  }, [pal.border])

  return (
    <View>
      <Feed
        feed={feed}
        scrollElRef={scrollElRef}
        onPressTryAgain={onPressTryAgain}
        onScroll={onMainScroll}
        scrollEventThrottle={100}
        renderEmptyState={renderEmptyState}
        desktopFixedHeightOffset={120}
      />
      {(isScrolledDown || hasNew) && (
        <LoadLatestBtn
          onPress={onPressLoadLatest}
          label="Load new posts"
          showIndicator={hasNew}
          minimalShellMode={store.shell.minimalShellMode}
        />
      )}
    </View>
  )
})
