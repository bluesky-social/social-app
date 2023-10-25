import React, {useCallback, useMemo} from 'react'
import {ActivityIndicator, Pressable, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {AppBskyGraphDefs, AppBskyActorDefs} from '@atproto/api'
import {useNavigation} from '@react-navigation/native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {observer} from 'mobx-react-lite'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {TabsContainer, Tab, TabsContainerHandle} from 'view/com/tabs/Tabs'
import {ProfileScreenHeaderBtn} from 'view/com/profile-screen/types'
import {ProfileScreenFullHeader} from 'view/com/profile-screen/FullHeader'
import {Text} from 'view/com/util/text/Text'
import {DropdownItem} from 'view/com/util/forms/NativeDropdown'
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
    const navigation = useNavigation<NavigationProp>()
    const pal = usePalette('default')
    const palInverted = usePalette('inverted')
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

    /*const onToggleSubscribed = useCallback(async () => {
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
          if (navigation.canGoBack()) {
            navigation.goBack()
          } else {
            navigation.navigate('Home')
          }
        },
      })
    }, [store, list, navigation])

    const onTogglePinned = useCallback(async () => {
      Haptics.default()
      list.togglePin().catch(e => {
        Toast.show('There was an issue contacting the server')
        store.log.error('Failed to toggle pinned list', {e})
      })
    }, [store, list])

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

    const headerBtns: ProfileScreenHeaderBtn[] = useMemo(() => {
      if (!list.hasLoaded) {
        return []
      }
      let items: ProfileScreenHeaderBtn[] = []
      items.push({
        icon: {
          icon: ['far', 'bookmark'],
          size: 15,
          color: pal.colors.text,
        },
        accessibilityLabel: 'Bookmark this list',
        onPress: () => {}, // TODO
      })
      if (list.isCuratelist) {
        items.push({
          inverted: !list.isPinned,
          label: list.isPinned ? 'Unpin from home' : 'Pin to home',
          accessibilityLabel: list.isPinned ? 'Unpin from home' : 'Pin to home',
          onPress: onTogglePinned,
        })
      } else if (list.isModlist) {
        if (list.isBlocking) {
          items.push({
            icon: {
              icon: 'check',
              size: 14,
              color: pal.colors.text,
            },
            label: 'Blocking',
            accessibilityLabel: 'Unblock this list',
            onPress: onTogglePinned,
          })
        } else if (list.isMuting) {
          items.push({
            icon: {
              icon: 'check',
              size: 14,
              color: pal.colors.text,
            },
            label: 'Muting',
            accessibilityLabel: 'Unmute this list',
            onPress: onTogglePinned,
          })
        } else {
          items.push({
            inverted: true,
            icon: {
              icon: 'user-slash',
              size: 14,
              color: palInverted.colors.text,
            },
            label: 'Block',
            accessibilityLabel: 'Block this list',
            onPress: onTogglePinned,
          })
          items.push({
            inverted: true,
            icon: {
              icon: 'comment-slash',
              size: 14,
              color: palInverted.colors.text,
            },
            label: 'Mute',
            accessibilityLabel: 'Mute this list',
            onPress: onTogglePinned,
          })
        }
      }
      return items
    }, [
      pal,
      palInverted,
      list.hasLoaded,
      list.isCuratelist,
      list.isModlist,
      list.isPinned,
      list.isMuting,
      list.isBlocking,
      onTogglePinned,
    ])

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
          label: 'Edit List Profile',
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

    const renderHeader = useCallback(() => {
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
        <ProfileScreenFullHeader
          info={info}
          avatarType="list"
          dropdownItems={dropdownItems}
          buttons={headerBtns}
        />
      )
    }, [list, dropdownItems, headerBtns])

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
          renderButton={renderAboutItemMemberButton}
          style={{paddingHorizontal: isMobile ? 8 : 14, paddingVertical: 4}}
        />
      ),
      [renderAboutItemMemberButton, isMobile],
    )

    return (
      <View style={s.hContentRegion}>
        <TabsContainer
          ref={tabsContainerRef}
          renderHeader={renderHeader}
          onSelectTab={onScrollToTop}
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
