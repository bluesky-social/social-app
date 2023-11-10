import React, {useCallback, useMemo} from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {useNavigation} from '@react-navigation/native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {observer} from 'mobx-react-lite'
import {RichText as RichTextAPI} from '@atproto/api'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {PagerWithHeader} from 'view/com/pager/PagerWithHeader'
import {ProfileSubpageHeader} from 'view/com/profile/ProfileSubpageHeader'
import {Feed} from 'view/com/posts/Feed'
import {Text} from 'view/com/util/text/Text'
import {NativeDropdown, DropdownItem} from 'view/com/util/forms/NativeDropdown'
import {CenteredView} from 'view/com/util/Views'
import {EmptyState} from 'view/com/util/EmptyState'
import {RichText} from 'view/com/util/text/RichText'
import {Button} from 'view/com/util/forms/Button'
import {TextLink} from 'view/com/util/Link'
import * as Toast from 'view/com/util/Toast'
import {LoadLatestBtn} from 'view/com/util/load-latest/LoadLatestBtn'
import {FAB} from 'view/com/util/fab/FAB'
import {Haptics} from 'lib/haptics'
import {ListModel} from 'state/models/content/list'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {OnScrollHandler} from 'lib/hooks/useOnMainScroll'
import {NavigationProp} from 'lib/routes/types'
import {toShareUrl} from 'lib/strings/url-helpers'
import {shareUrl} from 'lib/sharing'
import {resolveName} from 'lib/api'
import {s} from 'lib/styles'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink, makeListLink} from 'lib/routes/links'
import {ComposeIcon2} from 'lib/icons'
import {ListItems} from 'view/com/lists/ListItems'
import {logger} from '#/logger'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSetMinimalShellMode} from '#/state/shell'
import {useModalControls} from '#/state/modals'

const SECTION_TITLES_CURATE = ['Posts', 'About']
const SECTION_TITLES_MOD = ['About']

interface SectionRef {
  scrollToTop: () => void
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileList'>
export const ProfileListScreen = withAuthRequired(
  observer(function ProfileListScreenImpl(props: Props) {
    const store = useStores()
    const {name: handleOrDid} = props.route.params
    const [listOwnerDid, setListOwnerDid] = React.useState<string | undefined>()
    const [error, setError] = React.useState<string | undefined>()

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
          <ErrorScreen error={error} />
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
    const {_} = useLingui()
    const setMinimalShellMode = useSetMinimalShellMode()
    const {rkey} = route.params
    const feedSectionRef = React.useRef<SectionRef>(null)
    const aboutSectionRef = React.useRef<SectionRef>(null)
    const {openModal} = useModalControls()

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

    useFocusEffect(
      useCallback(() => {
        setMinimalShellMode(false)
        list.loadMore(true).then(() => {
          if (list.isCuratelist) {
            feed.setup()
          }
        })
      }, [setMinimalShellMode, list, feed]),
    )

    const onPressAddUser = useCallback(() => {
      openModal({
        name: 'list-add-user',
        list,
        onAdd() {
          if (list.isCuratelist) {
            feed.refresh()
          }
        },
      })
    }, [openModal, list, feed])

    const onCurrentPageSelected = React.useCallback(
      (index: number) => {
        if (index === 0) {
          feedSectionRef.current?.scrollToTop()
        }
        if (index === 1) {
          aboutSectionRef.current?.scrollToTop()
        }
      },
      [feedSectionRef],
    )

    const renderHeader = useCallback(() => {
      return <Header rkey={rkey} list={list} />
    }, [rkey, list])

    if (list.isCuratelist) {
      return (
        <View style={s.hContentRegion}>
          <PagerWithHeader
            items={SECTION_TITLES_CURATE}
            isHeaderReady={list.hasLoaded}
            renderHeader={renderHeader}
            onCurrentPageSelected={onCurrentPageSelected}>
            {({onScroll, headerHeight, isScrolledDown, scrollElRef}) => (
              <FeedSection
                ref={feedSectionRef}
                scrollElRef={
                  scrollElRef as React.MutableRefObject<FlatList<any> | null>
                }
                feed={feed}
                onScroll={onScroll}
                headerHeight={headerHeight}
                isScrolledDown={isScrolledDown}
              />
            )}
            {({onScroll, headerHeight, isScrolledDown, scrollElRef}) => (
              <AboutSection
                ref={aboutSectionRef}
                scrollElRef={
                  scrollElRef as React.MutableRefObject<FlatList<any> | null>
                }
                list={list}
                descriptionRT={list.descriptionRT}
                creator={list.data ? list.data.creator : undefined}
                isCurateList={list.isCuratelist}
                isOwner={list.isOwner}
                onPressAddUser={onPressAddUser}
                onScroll={onScroll}
                headerHeight={headerHeight}
                isScrolledDown={isScrolledDown}
              />
            )}
          </PagerWithHeader>
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
            accessibilityLabel={_(msg`New post`)}
            accessibilityHint=""
          />
        </View>
      )
    }
    if (list.isModlist) {
      return (
        <View style={s.hContentRegion}>
          <PagerWithHeader
            items={SECTION_TITLES_MOD}
            isHeaderReady={list.hasLoaded}
            renderHeader={renderHeader}>
            {({onScroll, headerHeight, isScrolledDown, scrollElRef}) => (
              <AboutSection
                list={list}
                scrollElRef={
                  scrollElRef as React.MutableRefObject<FlatList<any> | null>
                }
                descriptionRT={list.descriptionRT}
                creator={list.data ? list.data.creator : undefined}
                isCurateList={list.isCuratelist}
                isOwner={list.isOwner}
                onPressAddUser={onPressAddUser}
                onScroll={onScroll}
                headerHeight={headerHeight}
                isScrolledDown={isScrolledDown}
              />
            )}
          </PagerWithHeader>
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
            accessibilityLabel={_(msg`New post`)}
            accessibilityHint=""
          />
        </View>
      )
    }
    return (
      <CenteredView sideBorders style={s.hContentRegion}>
        <Header rkey={rkey} list={list} />
        {list.error ? <ErrorScreen error={list.error} /> : null}
      </CenteredView>
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
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const {openModal, closeModal} = useModalControls()

  const onTogglePinned = useCallback(async () => {
    Haptics.default()
    list.togglePin().catch(e => {
      Toast.show('There was an issue contacting the server')
      logger.error('Failed to toggle pinned list', {error: e})
    })
  }, [list])

  const onSubscribeMute = useCallback(() => {
    openModal({
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
        closeModal()
      },
    })
  }, [openModal, closeModal, list])

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
    openModal({
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
        closeModal()
      },
    })
  }, [openModal, closeModal, list])

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
    openModal({
      name: 'create-or-edit-list',
      list,
      onSave() {
        list.refresh()
      },
    })
  }, [openModal, list])

  const onPressDelete = useCallback(() => {
    openModal({
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
  }, [openModal, list, navigation])

  const onPressReport = useCallback(() => {
    if (!list.data) return
    openModal({
      name: 'report',
      uri: list.uri,
      cid: list.data.cid,
    })
  }, [openModal, list])

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
      href={makeListLink(
        list.data?.creator.handle || list.data?.creator.did || '',
        rkey,
      )}
      title={list.data?.name || 'User list'}
      avatar={list.data?.avatar}
      isOwner={list.isOwner}
      creator={list.data?.creator}
      avatarType="list">
      {list.isCuratelist || list.isPinned ? (
        <Button
          testID={list.isPinned ? 'unpinBtn' : 'pinBtn'}
          type={list.isPinned ? 'default' : 'inverted'}
          label={list.isPinned ? 'Unpin' : 'Pin to home'}
          onPress={onTogglePinned}
        />
      ) : list.isModlist ? (
        list.isBlocking ? (
          <Button
            testID="unblockBtn"
            type="default"
            label="Unblock"
            onPress={onUnsubscribeBlock}
          />
        ) : list.isMuting ? (
          <Button
            testID="unmuteBtn"
            type="default"
            label="Unmute"
            onPress={onUnsubscribeMute}
          />
        ) : (
          <NativeDropdown
            testID="subscribeBtn"
            items={subscribeDropdownItems}
            accessibilityLabel={_(msg`Subscribe to this list`)}
            accessibilityHint="">
            <View style={[palInverted.view, styles.btn]}>
              <Text style={palInverted.text}>
                <Trans>Subscribe</Trans>
              </Text>
            </View>
          </NativeDropdown>
        )
      ) : null}
      <NativeDropdown
        testID="headerDropdownBtn"
        items={dropdownItems}
        accessibilityLabel={_(msg`More options`)}
        accessibilityHint="">
        <View style={[pal.viewLight, styles.btn]}>
          <FontAwesomeIcon icon="ellipsis" size={20} color={pal.colors.text} />
        </View>
      </NativeDropdown>
    </ProfileSubpageHeader>
  )
})

interface FeedSectionProps {
  feed: PostsFeedModel
  onScroll: OnScrollHandler
  headerHeight: number
  isScrolledDown: boolean
  scrollElRef: React.MutableRefObject<FlatList<any> | null>
}
const FeedSection = React.forwardRef<SectionRef, FeedSectionProps>(
  function FeedSectionImpl(
    {feed, scrollElRef, onScroll, headerHeight, isScrolledDown},
    ref,
  ) {
    const hasNew = feed.hasNewLatest && !feed.isRefreshing

    const onScrollToTop = useCallback(() => {
      scrollElRef.current?.scrollToOffset({offset: -headerHeight})
      feed.refresh()
    }, [feed, scrollElRef, headerHeight])
    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    const renderPostsEmpty = useCallback(() => {
      return <EmptyState icon="feed" message="This feed is empty!" />
    }, [])

    return (
      <View>
        <Feed
          testID="listFeed"
          feed={feed}
          scrollElRef={scrollElRef}
          onScroll={onScroll}
          scrollEventThrottle={1}
          renderEmptyState={renderPostsEmpty}
          headerOffset={headerHeight}
        />
        {(isScrolledDown || hasNew) && (
          <LoadLatestBtn
            onPress={onScrollToTop}
            label="Load new posts"
            showIndicator={hasNew}
          />
        )}
      </View>
    )
  },
)

interface AboutSectionProps {
  list: ListModel
  descriptionRT: RichTextAPI | null
  creator: {did: string; handle: string} | undefined
  isCurateList: boolean | undefined
  isOwner: boolean | undefined
  onPressAddUser: () => void
  onScroll: OnScrollHandler
  headerHeight: number
  isScrolledDown: boolean
  scrollElRef: React.MutableRefObject<FlatList<any> | null>
}
const AboutSection = React.forwardRef<SectionRef, AboutSectionProps>(
  function AboutSectionImpl(
    {
      list,
      descriptionRT,
      creator,
      isCurateList,
      isOwner,
      onPressAddUser,
      onScroll,
      headerHeight,
      isScrolledDown,
      scrollElRef,
    },
    ref,
  ) {
    const pal = usePalette('default')
    const {_} = useLingui()
    const {isMobile} = useWebMediaQueries()

    const onScrollToTop = useCallback(() => {
      scrollElRef.current?.scrollToOffset({offset: -headerHeight})
    }, [scrollElRef, headerHeight])

    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    const renderHeader = React.useCallback(() => {
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
            {descriptionRT ? (
              <RichText
                testID="listDescription"
                type="lg"
                style={pal.text}
                richText={descriptionRT}
              />
            ) : (
              <Text
                testID="listDescriptionEmpty"
                type="lg"
                style={[{fontStyle: 'italic'}, pal.textLight]}>
                <Trans>No description</Trans>
              </Text>
            )}
            <Text type="md" style={[pal.textLight]} numberOfLines={1}>
              {isCurateList ? 'User list' : 'Moderation list'} by{' '}
              {isOwner ? (
                'you'
              ) : (
                <TextLink
                  text={sanitizeHandle(creator?.handle || '', '@')}
                  href={creator ? makeProfileLink(creator) : ''}
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
            <Text type="lg-bold">
              <Trans>Users</Trans>
            </Text>
            {isOwner && (
              <Pressable
                testID="addUserBtn"
                accessibilityRole="button"
                accessibilityLabel={_(msg`Add a user to this list`)}
                accessibilityHint=""
                onPress={onPressAddUser}
                style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <FontAwesomeIcon
                  icon="user-plus"
                  color={pal.colors.link}
                  size={16}
                />
                <Text style={pal.link}>
                  <Trans>Add</Trans>
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )
    }, [
      pal,
      list.data,
      isMobile,
      descriptionRT,
      creator,
      isCurateList,
      isOwner,
      onPressAddUser,
      _,
    ])

    const renderEmptyState = useCallback(() => {
      return (
        <EmptyState
          icon="users-slash"
          message="This list is empty!"
          style={{paddingTop: 40}}
        />
      )
    }, [])

    return (
      <View>
        <ListItems
          testID="listItems"
          scrollElRef={scrollElRef}
          renderHeader={renderHeader}
          renderEmptyState={renderEmptyState}
          list={list}
          headerOffset={headerHeight}
          onScroll={onScroll}
          scrollEventThrottle={1}
        />
        {isScrolledDown && (
          <LoadLatestBtn
            onPress={onScrollToTop}
            label="Scroll to top"
            showIndicator={false}
          />
        )}
      </View>
    )
  },
)

function ErrorScreen({error}: {error: string}) {
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const onPressBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  return (
    <View
      style={[
        pal.view,
        pal.border,
        {
          marginTop: 10,
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderTopWidth: 1,
        },
      ]}>
      <Text type="title-lg" style={[pal.text, s.mb10]}>
        <Trans>Could not load list</Trans>
      </Text>
      <Text type="md" style={[pal.text, s.mb20]}>
        {error}
      </Text>

      <View style={{flexDirection: 'row'}}>
        <Button
          type="default"
          accessibilityLabel={_(msg`Go Back`)}
          accessibilityHint="Return to previous page"
          onPress={onPressBack}
          style={{flexShrink: 1}}>
          <Text type="button" style={pal.text}>
            <Trans>Go Back</Trans>
          </Text>
        </Button>
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
