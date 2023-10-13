import React from 'react'
import {ActivityIndicator, FlatList, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {useNavigation} from '@react-navigation/native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {observer} from 'mobx-react-lite'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ProfileScreenHeader} from 'view/com/profile-screen/ProfileScreenHeader'
import {ProfileScreenFeedPage} from 'view/com/profile-screen/ProfileScreenFeedPage'
import {Text} from 'view/com/util/text/Text'
import {DropdownItem} from 'view/com/util/forms/NativeDropdown'
import {CenteredView} from 'view/com/util/Views'
import {ListItems} from 'view/com/lists/ListItems'
import {EmptyState} from 'view/com/util/EmptyState'
import {RichText} from 'view/com/util/text/RichText'
import {Pager, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {TabBar} from 'view/com/pager/TabBar'
import {Button} from 'view/com/util/forms/Button'
import {TextLink} from 'view/com/util/Link'
import * as Toast from 'view/com/util/Toast'
import {Haptics} from 'lib/haptics'
import {ListModel} from 'state/models/content/list'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {toShareUrl} from 'lib/strings/url-helpers'
import {shareUrl} from 'lib/sharing'
import {resolveName} from 'lib/api'
import {s, colors} from 'lib/styles'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'

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

    // init
    // =

    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(false)
        list.loadMore(true).then(() => {
          if (list.isCuratelist) {
            feed.setup()
          }
        })
      }, [store, list, feed]),
    )

    // events
    // =

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

    const onTogglePinned = React.useCallback(async () => {
      Haptics.default()
      list.togglePin().catch(e => {
        Toast.show('There was an issue contacting the server')
        store.log.error('Failed to toggle pinned list', {e})
      })
    }, [store, list])

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

    const onPressSelectedTab = React.useCallback(() => {
      store.emitScreenSoftReset()
    }, [store])

    // render
    // =

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

    const renderTabBar = React.useCallback(
      (props: RenderTabBarFnProps) => {
        return (
          <CenteredView sideBorders>
            <TabBar
              {...props}
              items={list.isCuratelist ? ['Posts', 'About'] : ['About']}
              indicatorColor={pal.colors.link}
              onPressSelected={onPressSelectedTab}
            />
          </CenteredView>
        )
      },
      [list.isCuratelist, onPressSelectedTab, pal.colors.link],
    )

    if (list.isCuratelist) {
      return (
        <View style={s.hContentRegion}>
          <Header
            list={list}
            dropdownItems={dropdownItems}
            onTogglePinned={onTogglePinned}
          />
          <Pager renderTabBar={renderTabBar} tabBarPosition="top">
            <ProfileScreenFeedPage key="1" feed={feed} />
            <AboutPage key="2" list={list} onPressAddUser={onPressAddUser} />
          </Pager>
        </View>
      )
    }
    return (
      <View style={s.hContentRegion}>
        <Header
          list={list}
          dropdownItems={dropdownItems}
          onTogglePinned={onTogglePinned}
        />
        <Pager renderTabBar={renderTabBar} tabBarPosition="top">
          <AboutPage key="1" list={list} onPressAddUser={onPressAddUser} />
        </Pager>
      </View>
    )
  },
)

const Header = observer(function HeaderImpl({
  list,
  dropdownItems,
  onTogglePinned,
}: {
  list: ListModel
  dropdownItems: DropdownItem[]
  onTogglePinned: () => void
}) {
  const pal = usePalette('default')
  const info = list.data
    ? {
        href: '', // TODO
        title: list.data.name,
        avatar: list.data.avatar,
        isOwner: list.isOwner,
        creator: list.data.creator,
      }
    : undefined

  return (
    <ProfileScreenHeader
      info={info}
      objectLabel={list.isCuratelist ? 'User List' : 'Moderation List'}
      avatarType="list"
      minimalMode={false /*TODO*/}
      dropdownItems={dropdownItems}>
      {list.isCuratelist && (
        <Button
          type="default-light"
          accessibilityLabel={
            list.isPinned ? 'Unpin this list' : 'Pin this list'
          }
          accessibilityHint=""
          onPress={onTogglePinned}
          style={{paddingVertical: 0}}>
          <FontAwesomeIcon
            icon="thumb-tack"
            size={17}
            color={list.isPinned ? colors.blue3 : pal.colors.textLight}
            style={{position: 'relative', top: 1}}
          />
        </Button>
      )}
    </ProfileScreenHeader>
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
  const store = useStores()
  const scrollElRef = React.useRef<FlatList>(null)

  // events
  // =

  const onScrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({offset: 0, animated: true})
  }, [scrollElRef])

  const onSoftReset = React.useCallback(() => {
    onScrollToTop()
    list.refresh()
  }, [onScrollToTop, list])

  // init
  // =

  React.useEffect(() => {
    const softResetSub = store.onScreenSoftReset(onSoftReset)
    return () => {
      softResetSub.remove()
    }
  }, [store, onSoftReset])

  // render
  // =

  const renderHeader = React.useCallback(() => {
    return <AboutSection list={list} onPressAddUser={onPressAddUser} />
  }, [list, onPressAddUser])

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
      <CenteredView
        sideBorders
        style={[{borderTopWidth: 1, padding: 12}, pal.border]}>
        <ActivityIndicator />
      </CenteredView>
    )
  }

  return (
    <ListItems
      scrollElRef={scrollElRef}
      list={list}
      renderHeader={renderHeader}
      renderEmptyState={renderEmptyState}
      style={s.flex1}
      desktopFixedHeightOffset={120}
    />
  )
})

function AboutSection({
  list,
  onPressAddUser,
}: {
  list: ListModel
  onPressAddUser: () => void
}) {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  if (!list.data) {
    return <View />
  }
  return (
    <View
      style={[
        {
          borderTopWidth: 1,
          padding: isMobile ? 14 : 20,
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
      <Text type="md" style={[pal.textLight]} numberOfLines={1}>
        Created by{' '}
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
      {list.isOwner && (
        <View style={{flexDirection: 'row'}}>
          <Button type="default" label="Add user" onPress={onPressAddUser} />
        </View>
      )}
    </View>
  )
}
