import React, {useCallback, useMemo} from 'react'
import {ActivityIndicator, Pressable, StyleSheet, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {AppBskyGraphDefs, AppBskyActorDefs} from '@atproto/api'
import {useNavigation} from '@react-navigation/native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {observer} from 'mobx-react-lite'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {TabsContainer, Tab, TabsContainerHandle} from 'view/com/tabs/Tabs'
import {ProfileSubpageHeader} from 'view/com/profile/ProfileSubpageHeader'
import {Text} from 'view/com/util/text/Text'
import {NativeDropdown, DropdownItem} from 'view/com/util/forms/NativeDropdown'
import {CenteredView} from 'view/com/util/Views'
import {EmptyState} from 'view/com/util/EmptyState'
import {RichText} from 'view/com/util/text/RichText'
import {Button} from 'view/com/util/forms/Button'
import {TextLink} from 'view/com/util/Link'
import * as Toast from 'view/com/util/Toast'
import {FeedSlice} from 'view/com/posts/FeedSlice'
import {ProfileCard} from 'view/com/profile/ProfileCard'
import {
  PostFeedLoadingPlaceholder,
  ProfileCardFeedLoadingPlaceholder,
} from 'view/com/util/LoadingPlaceholder'
import {LoadLatestBtn} from 'view/com/util/load-latest/LoadLatestBtn'
import {FAB} from 'view/com/util/fab/FAB'
import {Haptics} from 'lib/haptics'
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
import {resolveName} from 'lib/api'
import {s} from 'lib/styles'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {ComposeIcon2} from 'lib/icons'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileList'>
export const ProfileListScreen = withAuthRequired(
  observer(function ProfileListScreenImpl(props: Props) {
    const pal = usePalette('default')
    const store = useStores()
    const navigation = useNavigation<NavigationProp>()

    const {name: handleOrDid} = props.route.params

    const [listOwnerDid, setListOwnerDid] = React.useState<string | undefined>()
    const [error, setError] = React.useState<string | undefined>()

    const onPressBack = useCallback(() => {
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
    const {isMobile} = useWebMediaQueries()
    const [onMainScroll, isScrolledDown, resetMainScroll] =
      useOnMainScroll(store)
    const tabsContainerRef = React.useRef<TabsContainerHandle>(null)
    const {rkey} = route.params

    const list: ListModel = useMemo(() => {
      const model = new ListModel(
        store,
        `at://${listOwnerDid}/app.bsky.graph.list/${rkey}`,
      )
      return model
    }, [store, listOwnerDid, rkey])
    const feed = useMemo(
      () => new PostsFeedModel(store, 'list', {list: list.uri}),
      [store, list],
    )
    const isOwner = list.isOwner
    useSetTitle(list.data?.name)

    // init
    // =

    useFocusEffect(
      useCallback(() => {
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

    const onScrollToTop = useCallback(() => {
      tabsContainerRef.current?.scrollToTop()
      resetMainScroll()
    }, [tabsContainerRef, resetMainScroll])

    const onSelectTab = useCallback(
      (tab: number) => {
        if (tab === 0 && list.isCuratelist) {
          feed.refresh()
        }
        onScrollToTop()
      },
      [feed, list, onScrollToTop],
    )

    const onPressAddUser = useCallback(() => {
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

    const onPressEditMembership = useCallback(
      (profile: AppBskyActorDefs.ProfileViewBasic) => {
        store.shell.openModal({
          name: 'user-add-remove-lists',
          subject: profile.did,
          displayName: profile.displayName || profile.handle,
          onAdd(listUri: string) {
            if (listUri === list.uri) {
              list.cacheAddMember(profile)
            }
          },
          onRemove(listUri: string) {
            if (listUri === list.uri) {
              list.cacheRemoveMember(profile)
            }
          },
        })
      },
      [store, list],
    )

    const onPostsRefresh = useCallback(() => feed.refresh(), [feed])
    const onPostsEndReached = useCallback(() => feed.loadMore(), [feed])
    const onPostsRetryLoadMore = useCallback(() => feed.retryLoadMore(), [feed])
    const onAboutRefresh = useCallback(() => list.refresh(), [list])
    const onAboutEndReached = useCallback(() => list.loadMore(), [list])
    const onAboutRetryLoadMore = useCallback(() => list.retryLoadMore(), [list])

    // render
    // =

    const renderHeader = useCallback(() => {
      return <Header rkey={rkey} list={list} />
    }, [rkey, list])

    const renderPostsPlaceholder = useCallback(() => {
      return <PostFeedLoadingPlaceholder />
    }, [])

    const renderPostsEmpty = useCallback(() => {
      return <EmptyState icon="feed" message="This feed is empty!" />
    }, [])

    const renderPostsItem = useCallback(
      (item: any) => <FeedSlice slice={item} />,
      [],
    )

    const renderAboutHeader = useCallback(() => {
      return <AboutSection list={list} onPressAddUser={onPressAddUser} />
    }, [list, onPressAddUser])

    const renderAboutPlaceholder = useCallback(() => {
      return <ProfileCardFeedLoadingPlaceholder />
    }, [])

    const renderAboutEmpty = useCallback(() => {
      return (
        <EmptyState
          icon="users-slash"
          message="This list is empty!"
          style={{paddingTop: 40}}
        />
      )
    }, [])

    const renderAboutItemMemberButton = useCallback(
      (profile: AppBskyActorDefs.ProfileViewBasic) => {
        return (
          <Button
            type="default"
            label="Edit"
            onPress={() => onPressEditMembership(profile)}
          />
        )
      },
      [onPressEditMembership],
    )

    const renderAboutItem = useCallback(
      (item: any) => (
        <ProfileCard
          testID={`user-${
            (item as AppBskyGraphDefs.ListItemView).subject.handle
          }`}
          profile={(item as AppBskyGraphDefs.ListItemView).subject}
          renderButton={isOwner ? renderAboutItemMemberButton : undefined}
          style={{paddingHorizontal: isMobile ? 8 : 14, paddingVertical: 4}}
        />
      ),
      [renderAboutItemMemberButton, isOwner, isMobile],
    )

    return (
      <View style={s.hContentRegion}>
        <TabsContainer
          ref={tabsContainerRef}
          renderHeader={renderHeader}
          onSelectTab={onSelectTab}
          onScroll={onMainScroll}>
          {list.isCuratelist ? (
            <Tab
              name="Posts"
              items={feed.slices}
              isLoading={feed.isLoading}
              hasLoaded={feed.hasLoaded}
              isRefreshing={feed.isRefreshing}
              isEmpty={feed.isEmpty}
              hasMore={feed.hasMore}
              error={feed.error}
              loadMoreError={feed.loadMoreError}
              renderItem={renderPostsItem}
              renderPlaceholder={renderPostsPlaceholder}
              renderEmpty={renderPostsEmpty}
              onRefresh={onPostsRefresh}
              onEndReached={onPostsEndReached}
              onRetryLoadMore={onPostsRetryLoadMore}
            />
          ) : null}
          <Tab
            name="About"
            items={list.items}
            isLoading={list.isLoading}
            hasLoaded={list.hasLoaded}
            isRefreshing={list.isRefreshing}
            isEmpty={list.isEmpty}
            hasMore={list.hasMore}
            error={list.error}
            loadMoreError={list.loadMoreError}
            renderHeader={renderAboutHeader}
            renderItem={renderAboutItem}
            renderPlaceholder={renderAboutPlaceholder}
            renderEmpty={renderAboutEmpty}
            onRefresh={onAboutRefresh}
            onEndReached={onAboutEndReached}
            onRetryLoadMore={onAboutRetryLoadMore}
          />
        </TabsContainer>
        {isScrolledDown ? (
          <LoadLatestBtn
            onPress={onScrollToTop}
            label="Scroll to top"
            showIndicator={false}
          />
        ) : null}
        <FAB
          testID="composeFAB"
          onPress={() => store.shell.openComposer({})}
          icon={
            <ComposeIcon2
              strokeWidth={1.5}
              size={29}
              style={{color: 'white'}}
            />
          }
          accessibilityRole="button"
          accessibilityLabel="New post"
          accessibilityHint=""
        />
      </View>
    )
  },
)

const Header = observer(function HeaderImpl({
  rkey,
  list,
}: {
  rkey: string
  list: ListModel
}) {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()

  const onTogglePinned = useCallback(async () => {
    Haptics.default()
    list.togglePin().catch(e => {
      Toast.show('There was an issue contacting the server')
      store.log.error('Failed to toggle pinned list', {e})
    })
  }, [store, list])

  const onSubscribeMute = useCallback(() => {
    store.shell.openModal({
      name: 'confirm',
      title: 'Mute these accounts?',
      message:
        'Muting is private. Muted accounts can interact with you, but you will not see their posts or receive notifications from them.',
      confirmBtnText: 'Mute this List',
      async onPressConfirm() {
        try {
          await list.mute()
          Toast.show('List muted')
        } catch {
          Toast.show(
            'There was an issue. Please check your internet connection and try again.',
          )
        }
      },
      onPressCancel() {
        store.shell.closeModal()
      },
    })
  }, [store, list])

  const onUnsubscribeMute = useCallback(async () => {
    try {
      await list.unmute()
      Toast.show('List unmuted')
    } catch {
      Toast.show(
        'There was an issue. Please check your internet connection and try again.',
      )
    }
  }, [list])

  const onSubscribeBlock = useCallback(() => {
    store.shell.openModal({
      name: 'confirm',
      title: 'Block these accounts?',
      message:
        'Blocking is public. Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.',
      confirmBtnText: 'Block this List',
      async onPressConfirm() {
        try {
          await list.block()
          Toast.show('List blocked')
        } catch {
          Toast.show(
            'There was an issue. Please check your internet connection and try again.',
          )
        }
      },
      onPressCancel() {
        store.shell.closeModal()
      },
    })
  }, [store, list])

  const onUnsubscribeBlock = useCallback(async () => {
    try {
      await list.unblock()
      Toast.show('List unblocked')
    } catch {
      Toast.show(
        'There was an issue. Please check your internet connection and try again.',
      )
    }
  }, [list])

  const onPressEdit = useCallback(() => {
    store.shell.openModal({
      name: 'create-or-edit-list',
      list,
      onSave() {
        list.refresh()
      },
    })
  }, [store, list])

  const onPressDelete = useCallback(() => {
    store.shell.openModal({
      name: 'confirm',
      title: 'Delete List',
      message: 'Are you sure?',
      async onPressConfirm() {
        await list.delete()
        Toast.show('List deleted')
        if (navigation.canGoBack()) {
          navigation.goBack()
        } else {
          navigation.navigate('Home')
        }
      },
    })
  }, [store, list, navigation])

  const onPressReport = useCallback(() => {
    if (!list.data) return
    store.shell.openModal({
      name: 'report',
      uri: list.uri,
      cid: list.data.cid,
    })
  }, [store, list])

  const onPressShare = useCallback(() => {
    const url = toShareUrl(`/profile/${list.creatorDid}/lists/${rkey}`)
    shareUrl(url)
  }, [list.creatorDid, rkey])

  const dropdownItems: DropdownItem[] = useMemo(() => {
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
            name: 'square.and.arrow.up',
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
        label: 'Edit List Details',
        onPress: onPressEdit,
        icon: {
          ios: {
            name: 'pencil',
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
            name: 'trash',
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
            name: 'exclamationmark.triangle',
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

  const subscribeDropdownItems: DropdownItem[] = useMemo(() => {
    return [
      {
        testID: 'subscribeDropdownMuteBtn',
        label: 'Mute accounts',
        onPress: onSubscribeMute,
        icon: {
          ios: {
            name: 'speaker.slash',
          },
          android: '',
          web: 'user-slash',
        },
      },
      {
        testID: 'subscribeDropdownBlockBtn',
        label: 'Block accounts',
        onPress: onSubscribeBlock,
        icon: {
          ios: {
            name: 'person.fill.xmark',
          },
          android: '',
          web: 'ban',
        },
      },
    ]
  }, [onSubscribeMute, onSubscribeBlock])

  return (
    <ProfileSubpageHeader
      isLoading={!list.hasLoaded}
      href={'' /* TODO*/}
      title={list.data?.name || 'User list'}
      avatar={list.data?.avatar}
      isOwner={list.isOwner}
      creator={list.data?.creator}
      avatarType="list">
      {list.isCuratelist ? (
        <Button
          type={list.isPinned ? 'default' : 'inverted'}
          label={list.isPinned ? 'Unpin' : 'Pin to home'}
          onPress={onTogglePinned}
        />
      ) : list.isModlist ? (
        list.isBlocking ? (
          <Button type="default" label="Unblock" onPress={onUnsubscribeBlock} />
        ) : list.isMuting ? (
          <Button type="default" label="Unmute" onPress={onUnsubscribeMute} />
        ) : (
          <NativeDropdown
            testID="subscribeBtn"
            items={subscribeDropdownItems}
            accessibilityLabel="Subscribe to this list"
            accessibilityHint="">
            <View style={[palInverted.view, styles.btn]}>
              <Text style={palInverted.text}>Subscribe</Text>
            </View>
          </NativeDropdown>
        )
      ) : null}
      <NativeDropdown
        testID="headerDropdownBtn"
        items={dropdownItems}
        accessibilityLabel="More options"
        accessibilityHint="">
        <View style={[pal.viewLight, styles.btn]}>
          <FontAwesomeIcon icon="ellipsis" size={20} color={pal.colors.text} />
        </View>
      </NativeDropdown>
    </ProfileSubpageHeader>
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
    <View>
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
          {list.isCuratelist ? 'User list' : 'Moderation list'} by{' '}
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
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: isMobile ? 14 : 20,
            paddingBottom: isMobile ? 14 : 18,
          },
        ]}>
        <Text type="lg-bold">Users</Text>
        {list.isOwner && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a user to this list"
            accessibilityHint=""
            onPress={onPressAddUser}
            style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <FontAwesomeIcon
              icon="user-plus"
              color={pal.colors.link}
              size={16}
            />
            <Text style={pal.link}>Add</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 50,
    marginLeft: 6,
  },
})
