import React, {useMemo, useRef, MutableRefObject} from 'react'
import {
  FlatList,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  ActivityIndicator,
} from 'react-native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useNavigation, useIsFocused} from '@react-navigation/native'
import {usePalette} from 'lib/hooks/usePalette'
import {HeartIcon, HeartIconSolid} from 'lib/icons'
import {CommonNavigatorParams} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {colors, s} from 'lib/styles'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {CustomFeedModel} from 'state/models/feeds/custom-feed'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {useCustomFeed} from 'lib/hooks/useCustomFeed'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {Feed} from 'view/com/posts/Feed'
import {TextLink} from 'view/com/util/Link'
import {SimpleViewHeader} from 'view/com/util/SimpleViewHeader'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {Button} from 'view/com/util/forms/Button'
import {Text} from 'view/com/util/text/Text'
import {RichText} from 'view/com/util/text/RichText'
import {Pager, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {TabBar} from 'view/com/pager/TabBar'
import * as Toast from 'view/com/util/Toast'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {shareUrl} from 'lib/sharing'
import {toShareUrl} from 'lib/strings/url-helpers'
import {Haptics} from 'lib/haptics'
import {ComposeIcon2} from 'lib/icons'
import {FAB} from '../com/util/fab/FAB'
import {LoadLatestBtn} from 'view/com/util/load-latest/LoadLatestBtn'
import {useOnMainScroll, OnScrollCb} from 'lib/hooks/useOnMainScroll'
import {EmptyState} from 'view/com/util/EmptyState'
import {useAnalytics} from 'lib/analytics/analytics'
import {NativeDropdown, DropdownItem} from 'view/com/util/forms/NativeDropdown'
import {resolveName} from 'lib/api'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink, makeCustomFeedLink} from 'lib/routes/links'
import {pluralize} from 'lib/strings/helpers'
import {CenteredView} from 'view/com/util/Views'
import {NavigationProp} from 'lib/routes/types'
import {isNative} from 'platform/detection'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CustomFeed'>

export const CustomFeedScreen = withAuthRequired(
  observer(function CustomFeedScreenImpl(props: Props) {
    const pal = usePalette('default')
    const store = useStores()
    const navigation = useNavigation<NavigationProp>()

    const {name: handleOrDid} = props.route.params

    const [feedOwnerDid, setFeedOwnerDid] = React.useState<string | undefined>()
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
       * We must resolve the DID of the feed owner before we can fetch the feed.
       */
      async function fetchDid() {
        try {
          const did = await resolveName(store, handleOrDid)
          setFeedOwnerDid(did)
        } catch (e) {
          setError(
            `We're sorry, but we were unable to resolve this feed. If this persists, please contact the feed creator, @${handleOrDid}.`,
          )
        }
      }

      fetchDid()
    }, [store, handleOrDid, setFeedOwnerDid])

    if (error) {
      return (
        <CenteredView>
          <View style={[pal.view, pal.border, styles.notFoundContainer]}>
            <Text type="title-lg" style={[pal.text, s.mb10]}>
              Could not load feed
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

    return feedOwnerDid ? (
      <CustomFeedScreenInner {...props} feedOwnerDid={feedOwnerDid} />
    ) : (
      <CenteredView>
        <View style={s.p20}>
          <ActivityIndicator size="large" />
        </View>
      </CenteredView>
    )
  }),
)

export const CustomFeedScreenInner = observer(
  function CustomFeedScreenInnerImpl({
    route,
    feedOwnerDid,
  }: Props & {feedOwnerDid: string}) {
    const store = useStores()
    const navigation = useNavigation<NavigationProp>()
    const isScreenFocused = useIsFocused()
    const {track} = useAnalytics()
    const {rkey, name: handleOrDid, view: viewMode} = route.params
    const minimalMode = viewMode === 'home'
    const uri = useMemo(
      () => makeRecordUri(feedOwnerDid, 'app.bsky.feed.generator', rkey),
      [rkey, feedOwnerDid],
    )
    const scrollElRef = useRef<FlatList>(null)
    const feedInfo = useCustomFeed(uri)
    const algoFeed: PostsFeedModel = useMemo(() => {
      const feed = new PostsFeedModel(store, 'custom', {
        feed: uri,
      })
      feed.setup()
      return feed
    }, [store, uri])
    const isPinned = store.me.savedFeeds.isPinned(uri)
    const [onMainScroll, isScrolledDown, resetMainScroll] =
      useOnMainScroll(store)
    useSetTitle(feedInfo?.displayName)

    const onToggleSaved = React.useCallback(async () => {
      try {
        Haptics.default()
        if (feedInfo?.isSaved) {
          await feedInfo?.unsave()
        } else {
          await feedInfo?.save()
        }
      } catch (err) {
        Toast.show(
          'There was an an issue updating your feeds, please check your internet connection and try again.',
        )
        store.log.error('Failed up update feeds', {err})
      }
    }, [store, feedInfo])

    const onToggleLiked = React.useCallback(async () => {
      Haptics.default()
      try {
        if (feedInfo?.isLiked) {
          await feedInfo?.unlike()
        } else {
          await feedInfo?.like()
        }
      } catch (err) {
        Toast.show(
          'There was an an issue contacting the server, please check your internet connection and try again.',
        )
        store.log.error('Failed up toggle like', {err})
      }
    }, [store, feedInfo])

    const onTogglePinned = React.useCallback(async () => {
      Haptics.default()
      store.me.savedFeeds.togglePinnedFeed(feedInfo!).catch(e => {
        Toast.show('There was an issue contacting the server')
        store.log.error('Failed to toggle pinned feed', {e})
      })
    }, [store, feedInfo])

    const onPressViewFeedPage = React.useCallback(() => {
      navigation.push('CustomFeed', {name: handleOrDid, rkey})
    }, [handleOrDid, rkey, navigation])

    const onPressShare = React.useCallback(() => {
      const url = toShareUrl(`/profile/${handleOrDid}/feed/${rkey}`)
      shareUrl(url)
      track('CustomFeed:Share')
    }, [handleOrDid, rkey, track])

    const onPressReport = React.useCallback(() => {
      if (!feedInfo) return
      store.shell.openModal({
        name: 'report',
        uri: feedInfo.uri,
        cid: feedInfo.data.cid,
      })
    }, [store, feedInfo])

    const onScrollToTop = React.useCallback(() => {
      scrollElRef.current?.scrollToOffset({offset: 0, animated: true})
      resetMainScroll()
    }, [scrollElRef, resetMainScroll])

    const onPressCompose = React.useCallback(() => {
      store.shell.openComposer({})
    }, [store])

    const onSoftReset = React.useCallback(() => {
      if (isScreenFocused) {
        onScrollToTop()
        algoFeed.refresh()
      }
    }, [isScreenFocused, onScrollToTop, algoFeed])

    const renderTabBar = React.useCallback((props: RenderTabBarFnProps) => {
      return (
        <Container>
          <TabBar {...props} items={['Posts', 'About']} />
        </Container>
      )
    }, [])

    // fires when page within screen is activated/deactivated
    React.useEffect(() => {
      if (!isScreenFocused) {
        return
      }

      const softResetSub = store.onScreenSoftReset(onSoftReset)
      return () => {
        softResetSub.remove()
      }
    }, [store, onSoftReset, isScreenFocused])

    const dropdownItems: DropdownItem[] = React.useMemo(() => {
      return [
        minimalMode
          ? {
              testID: 'feedHeaderDropdownViewFeedBtn',
              label: 'View feed page',
              onPress: onPressViewFeedPage,
              icon: {
                ios: {
                  name: 'info.circle',
                },
                android: '',
                web: 'info',
              },
            }
          : undefined,
        {
          testID: 'feedHeaderDropdownToggleSavedBtn',
          label: feedInfo?.isSaved ? 'Remove from my feeds' : 'Add to my feeds',
          onPress: onToggleSaved,
          icon: feedInfo?.isSaved
            ? {
                ios: {
                  name: 'trash',
                },
                android: 'ic_delete',
                web: ['far', 'trash-can'],
              }
            : {
                ios: {
                  name: 'plus',
                },
                android: '',
                web: 'plus',
              },
        },
        {
          testID: 'feedHeaderDropdownReportBtn',
          label: 'Report feed',
          onPress: onPressReport,
          icon: {
            ios: {
              name: 'exclamationmark.triangle',
            },
            android: 'ic_menu_report_image',
            web: 'circle-exclamation',
          },
        },
        {
          testID: 'feedHeaderDropdownShareBtn',
          label: 'Share link',
          onPress: onPressShare,
          icon: {
            ios: {
              name: 'square.and.arrow.up',
            },
            android: 'ic_menu_share',
            web: 'share',
          },
        },
      ].filter(Boolean) as DropdownItem[]
    }, [
      feedInfo,
      minimalMode,
      onPressViewFeedPage,
      onToggleSaved,
      onPressReport,
      onPressShare,
    ])

    if (minimalMode) {
      return (
        <View style={s.hContentRegion}>
          <Header
            feedInfo={feedInfo}
            dropdownItems={dropdownItems}
            isPinned={isPinned}
            minimalMode={minimalMode}
            onToggleLiked={onToggleLiked}
            onTogglePinned={onTogglePinned}
            onToggleSaved={onToggleSaved}
          />
          <FeedPage
            scrollElRef={scrollElRef}
            algoFeed={algoFeed}
            uri={uri}
            isPinned={isPinned}
            isScrolledDown={isScrolledDown}
            onMainScroll={onMainScroll}
            onPressCompose={onPressCompose}
            onSoftReset={onSoftReset}
          />
        </View>
      )
    }
    return (
      <View style={s.hContentRegion}>
        <Header
          feedInfo={feedInfo}
          dropdownItems={dropdownItems}
          isPinned={isPinned}
          minimalMode={minimalMode}
          onToggleLiked={onToggleLiked}
          onTogglePinned={onTogglePinned}
          onToggleSaved={onToggleSaved}
        />
        <Pager renderTabBar={renderTabBar} tabBarPosition="top">
          <FeedPage
            key="1"
            scrollElRef={scrollElRef}
            algoFeed={algoFeed}
            uri={uri}
            isPinned={isPinned}
            isScrolledDown={isScrolledDown}
            onMainScroll={onMainScroll}
            onPressCompose={onPressCompose}
            onSoftReset={onSoftReset}
          />
          <AboutPage
            key="2"
            feedOwnerDid={feedOwnerDid}
            feedRkey={rkey}
            feedInfo={feedInfo}
          />
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
  feedInfo,
  dropdownItems,
  isPinned,
  minimalMode,
  onToggleLiked,
  onTogglePinned,
  onToggleSaved,
}: {
  feedInfo: CustomFeedModel | undefined
  dropdownItems: DropdownItem[]
  isPinned: boolean
  minimalMode: boolean
  onToggleLiked: () => void
  onTogglePinned: () => void
  onToggleSaved: () => void
}) {
  const store = useStores()
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')

  if (!feedInfo) {
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
          Loading...
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
      <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
        {minimalMode ? (
          <Text type="title-lg" style={styles.headerText} numberOfLines={1}>
            <TextLink
              type="title-lg"
              href="/"
              style={[pal.text, {fontWeight: 'bold'}]}
              text={feedInfo?.displayName || ''}
              onPress={() => store.emitScreenSoftReset()}
            />
          </Text>
        ) : (
          <>
            <View style={{marginRight: 12}}>
              <UserAvatar type="algo" avatar={feedInfo.data.avatar} size={48} />
            </View>
            <View style={{flex: 1}}>
              <Text
                type="title-lg"
                style={{flex: 1, fontWeight: 'bold'}}
                numberOfLines={1}>
                <TextLink
                  type="title-lg"
                  href="/"
                  style={[pal.text, {fontWeight: 'bold'}]}
                  text={feedInfo.data.displayName || ''}
                  onPress={() => store.emitScreenSoftReset()}
                />
              </Text>

              <Text type="md" style={[pal.textLight]} numberOfLines={1}>
                Feed by{' '}
                {feedInfo.isOwner ? (
                  'you'
                ) : (
                  <TextLink
                    text={sanitizeHandle(feedInfo.data.creator.handle, '@')}
                    href={makeProfileLink(feedInfo.data.creator)}
                    style={pal.textLight}
                  />
                )}
              </Text>
            </View>
          </>
        )}
        <Button
          type="default-light"
          testID="toggleLikeBtn"
          accessibilityLabel="Like this feed"
          accessibilityHint=""
          onPress={onToggleLiked}
          style={styles.headerBtn}>
          {feedInfo?.isLiked ? (
            <HeartIconSolid size={19} style={styles.liked} />
          ) : (
            <HeartIcon strokeWidth={3} size={19} style={pal.textLight} />
          )}
        </Button>
        {feedInfo?.isSaved ? (
          <Button
            type="default-light"
            accessibilityLabel={isPinned ? 'Unpin this feed' : 'Pin this feed'}
            accessibilityHint=""
            onPress={onTogglePinned}
            style={styles.headerBtn}>
            <FontAwesomeIcon
              icon="thumb-tack"
              size={17}
              color={isPinned ? colors.blue3 : pal.colors.textLight}
              style={styles.top1}
            />
          </Button>
        ) : (
          <Button
            type="inverted"
            onPress={onToggleSaved}
            accessibilityLabel="Add to my feeds"
            accessibilityHint=""
            style={styles.headerAddBtn}>
            <FontAwesomeIcon
              icon="plus"
              color={palInverted.colors.text}
              size={14}
            />
            <Text type="button" style={palInverted.text}>
              Add{!isMobile && ' to My Feeds'}
            </Text>
          </Button>
        )}
        <NativeDropdown
          testID="feedHeaderDropdownBtn"
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

const FeedPage = observer(function FeedPageImpl({
  scrollElRef,
  algoFeed,
  uri,
  isPinned,
  isScrolledDown,
  onMainScroll,
  onPressCompose,
  onSoftReset,
}: {
  scrollElRef: MutableRefObject<FlatList | null>
  algoFeed: PostsFeedModel
  uri: string
  isPinned: boolean
  isScrolledDown: boolean
  onMainScroll: OnScrollCb
  onPressCompose: () => void
  onSoftReset: () => void
}) {
  const pal = usePalette('default')
  const {isTabletOrDesktop} = useWebMediaQueries()

  const renderEmptyState = React.useCallback(() => {
    return (
      <View style={[pal.border, {borderTopWidth: 1, paddingTop: 20}]}>
        <EmptyState icon="feed" message="This feed is empty!" />
      </View>
    )
  }, [pal.border])

  return (
    <View style={s.hContentRegion}>
      <Feed
        scrollElRef={scrollElRef}
        feed={algoFeed}
        onScroll={onMainScroll}
        scrollEventThrottle={100}
        renderEmptyState={renderEmptyState}
        extraData={[uri, isPinned]}
        style={!isTabletOrDesktop ? {flex: 1} : undefined}
      />
      {isScrolledDown ? (
        <LoadLatestBtn
          onPress={onSoftReset}
          label="Scroll to top"
          showIndicator={false}
        />
      ) : null}
      <FAB
        testID="composeFAB"
        onPress={onPressCompose}
        icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
        accessibilityRole="button"
        accessibilityLabel="New post"
        accessibilityHint=""
      />
    </View>
  )
})

const AboutPage = observer(function AboutPageImpl({
  feedOwnerDid,
  feedRkey,
  feedInfo,
}: {
  feedOwnerDid: string
  feedRkey: string
  feedInfo: CustomFeedModel | undefined
}) {
  const pal = usePalette('default')

  if (!feedInfo) {
    return <View />
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
        {feedInfo.descriptionRT ? (
          <RichText
            testID="listDescription"
            type="lg"
            style={pal.text}
            richText={feedInfo.descriptionRT}
          />
        ) : (
          <Text type="lg" style={[{fontStyle: 'italic'}, pal.textLight]}>
            No description
          </Text>
        )}
        {typeof feedInfo.data.likeCount === 'number' && (
          <TextLink
            href={makeCustomFeedLink(feedOwnerDid, feedRkey, 'liked-by')}
            text={`Liked by ${feedInfo.data.likeCount} ${pluralize(
              feedInfo.data.likeCount,
              'user',
            )}`}
            style={[pal.textLight, s.semiBold]}
          />
        )}
      </View>
    </Container>
  )
})

const styles = StyleSheet.create({
  headerText: {
    flex: 1,
    fontWeight: 'bold',
  },
  headerBtn: {
    paddingVertical: 0,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingLeft: 10,
  },
  liked: {
    color: colors.red3,
  },
  top1: {
    position: 'relative',
    top: 1,
  },
  top2: {
    position: 'relative',
    top: 2,
  },
  notFoundContainer: {
    margin: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 6,
  },
})
