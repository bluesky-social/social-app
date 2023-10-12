import React, {useMemo} from 'react'
import {StyleSheet, View, ActivityIndicator} from 'react-native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
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
import {TextLink} from 'view/com/util/Link'
import {ProfileScreenHeader} from 'view/com/profile-screen/ProfileScreenHeader'
import {ProfileScreenFeedPage} from 'view/com/profile-screen/ProfileScreenFeedPage'
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
import {useAnalytics} from 'lib/analytics/analytics'
import {DropdownItem} from 'view/com/util/forms/NativeDropdown'
import {resolveName} from 'lib/api'
import {makeCustomFeedLink} from 'lib/routes/links'
import {pluralize} from 'lib/strings/helpers'
import {CenteredView} from 'view/com/util/Views'
import {NavigationProp} from 'lib/routes/types'
import {isNative} from 'platform/detection'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFeed'>
export const ProfileFeedScreen = withAuthRequired(
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
    const {track} = useAnalytics()
    const {rkey, name: handleOrDid, view: viewMode} = route.params
    const minimalMode = viewMode === 'simple'
    const uri = useMemo(
      () => makeRecordUri(feedOwnerDid, 'app.bsky.feed.generator', rkey),
      [rkey, feedOwnerDid],
    )
    const feedInfo = useCustomFeed(uri)
    const algoFeed: PostsFeedModel = useMemo(() => {
      const feed = new PostsFeedModel(store, 'custom', {
        feed: uri,
      })
      feed.setup()
      return feed
    }, [store, uri])
    const isPinned = store.me.savedFeeds.isPinned(uri)
    useSetTitle(feedInfo?.displayName)

    // events
    // =

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
      navigation.push('ProfileFeed', {name: handleOrDid, rkey})
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

    const onPressSelectedTab = React.useCallback(() => {
      store.emitScreenSoftReset()
    }, [store])

    // render
    // =

    const renderTabBar = React.useCallback(
      (props: RenderTabBarFnProps) => {
        return (
          <CenteredView sideBorders>
            <TabBar
              {...props}
              items={['Posts', 'About']}
              onPressSelected={onPressSelectedTab}
            />
          </CenteredView>
        )
      },
      [onPressSelectedTab],
    )

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
            feedOwnerDid={feedOwnerDid}
            feedRkey={rkey}
            feedInfo={feedInfo}
            dropdownItems={dropdownItems}
            isPinned={isPinned}
            minimalMode={minimalMode}
            onTogglePinned={onTogglePinned}
            onToggleSaved={onToggleSaved}
          />
          <ProfileScreenFeedPage feed={algoFeed} minimalMode />
        </View>
      )
    }
    return (
      <View style={s.hContentRegion}>
        <Header
          feedOwnerDid={feedOwnerDid}
          feedRkey={rkey}
          feedInfo={feedInfo}
          dropdownItems={dropdownItems}
          isPinned={isPinned}
          minimalMode={minimalMode}
          onTogglePinned={onTogglePinned}
          onToggleSaved={onToggleSaved}
        />
        <Pager renderTabBar={renderTabBar} tabBarPosition="top">
          <ProfileScreenFeedPage key="1" feed={algoFeed} />
          <AboutPage
            key="2"
            feedOwnerDid={feedOwnerDid}
            feedRkey={rkey}
            feedInfo={feedInfo}
            onToggleLiked={onToggleLiked}
          />
        </Pager>
      </View>
    )
  },
)

const Header = observer(function HeaderImpl({
  feedOwnerDid,
  feedRkey,
  feedInfo,
  dropdownItems,
  isPinned,
  minimalMode,
  onTogglePinned,
  onToggleSaved,
}: {
  feedOwnerDid: string
  feedRkey: string
  feedInfo: CustomFeedModel | undefined
  dropdownItems: DropdownItem[]
  isPinned: boolean
  minimalMode: boolean
  onTogglePinned: () => void
  onToggleSaved: () => void
}) {
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')

  const info = feedInfo
    ? {
        href: makeCustomFeedLink(feedOwnerDid, feedRkey),
        title: feedInfo.displayName,
        avatar: feedInfo.data.avatar,
        isOwner: feedInfo.isOwner,
        creator: feedInfo.data.creator,
      }
    : undefined

  return (
    <ProfileScreenHeader
      info={info}
      objectLabel="Feed"
      avatarType="algo"
      minimalMode={minimalMode}
      dropdownItems={dropdownItems}>
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
    </ProfileScreenHeader>
  )
})

const AboutPage = observer(function AboutPageImpl({
  feedOwnerDid,
  feedRkey,
  feedInfo,
  onToggleLiked,
}: {
  feedOwnerDid: string
  feedRkey: string
  feedInfo: CustomFeedModel | undefined
  onToggleLiked: () => void
}) {
  const pal = usePalette('default')

  if (!feedInfo) {
    return <View />
  }
  return (
    <CenteredView
      sideBorders
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
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
          <Button
            type="default"
            testID="toggleLikeBtn"
            accessibilityLabel="Like this feed"
            accessibilityHint=""
            onPress={onToggleLiked}
            style={{paddingHorizontal: 10}}>
            {feedInfo?.isLiked ? (
              <HeartIconSolid size={19} style={styles.liked} />
            ) : (
              <HeartIcon strokeWidth={3} size={19} style={pal.textLight} />
            )}
          </Button>
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
        <Text type="md" style={[pal.textLight]} numberOfLines={1}>
          Created by{' '}
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
    </CenteredView>
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
