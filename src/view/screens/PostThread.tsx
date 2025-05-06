import {useCallback, useMemo, useRef, useState} from 'react'
import {StyleSheet, useWindowDimensions, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {AppBskyFeedDefs} from '@atproto/api'

import {isNative} from '#/platform/detection'
import {cleanError} from '#/lib/strings/errors'
import {HITSLOP_10} from '#/lib/constants'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {useSetMinimalShellMode} from '#/state/shell'
import {PostThread as PostThreadComponent} from '#/view/com/post-thread/PostThread'
import * as Layout from '#/components/Layout'
import {useSession} from '#/state/session'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {useGetPostThreadV2, Slice} from '#/state/queries/useGetPostThreadV2'
import * as Menu from '#/components/Menu'
import {Button, ButtonIcon} from '#/components/Button'
import {SettingsSliderVertical_Stroke2_Corner0_Rounded as SettingsSlider} from '#/components/icons/SettingsSlider'
import {Text} from '#/components/Typography'
import {ScrollProvider} from '#/lib/ScrollContext'
import {List, ListMethods} from '#/view/com/util/List'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {PostThreadItem} from '#/view/com/post-thread/PostThreadItem'
import {PostThreadComposePrompt} from '#/view/com/post-thread/PostThreadComposePrompt'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useComposerControls} from '#/state/shell'

const MAINTAIN_VISIBLE_CONTENT_POSITION = {
  // We don't insert any elements before the root row while loading.
  // So the row we want to use as the scroll anchor is the first row.
  minIndexForVisible: 1,
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export function PostThreadScreen({route}: Props) {
  const setMinimalShellMode = useSetMinimalShellMode()

  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <Layout.Screen testID="postThreadScreen">
      {/* <PostThreadComponent uri={uri} /> */}
      <Inner uri={uri} />
    </Layout.Screen>
  )
}

function useThreadPreferences() {
  const {data: preferences} = usePreferencesQuery()
  const nextThreadPreferences = preferences?.threadViewPrefs

  /*
   * Create local state representations of server state
   */
  const [sortReplies, setSortReplies] = useState(
    nextThreadPreferences?.sort ?? 'hotness',
  )
  const [prioritizeFollowedUsers, setPrioritizeFollowedUsers] = useState(
    !!nextThreadPreferences?.prioritizeFollowedUsers,
  )
  const [treeViewEnabled, setTreeViewEnabled] = useState(
    !!nextThreadPreferences?.lab_treeViewEnabled,
  )

  /**
   * Cache existing and if we get a server update, reset local state
   */
  const [prevServerPrefs, setPrevServerPrefs] = useState(nextThreadPreferences)
  if (nextThreadPreferences && prevServerPrefs !== nextThreadPreferences) {
    setPrevServerPrefs(nextThreadPreferences)

    /*
     * Reset
     */
    setSortReplies(nextThreadPreferences.sort)
    setPrioritizeFollowedUsers(nextThreadPreferences.prioritizeFollowedUsers)
    setTreeViewEnabled(!!nextThreadPreferences.lab_treeViewEnabled)
  }

  const isLoaded = !!prevServerPrefs

  return useMemo(() => ({
    isLoaded,
    sortReplies,
    setSortReplies,
    prioritizeFollowedUsers,
    setPrioritizeFollowedUsers,
    treeViewEnabled,
    setTreeViewEnabled,
  }), [
    isLoaded,
    sortReplies,
    setSortReplies,
    prioritizeFollowedUsers,
    setPrioritizeFollowedUsers,
    treeViewEnabled,
    setTreeViewEnabled,
  ])
}

export function Inner({uri}: {uri: string | undefined}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtPhone} = useBreakpoints()
  // const {hasSession, currentAccount} = useSession()
  const initialNumToRender = useInitialNumToRender()
  const {height: windowHeight} = useWindowDimensions()

  const {
    isLoaded: isThreadPreferencesLoaded,
    sortReplies,
    setSortReplies,
    prioritizeFollowedUsers,
    treeViewEnabled,
    setTreeViewEnabled,
  } = useThreadPreferences()

  const {isFetching, isPlaceholderData, error, data, refetch} = useGetPostThreadV2({
    uri,
    enabled: isThreadPreferencesLoaded,
    options: {
      sort: sortReplies,
      view: treeViewEnabled ? 'tree' : 'linear',
      prioritizeFollows: prioritizeFollowedUsers,
    },
  })

  const ref = useRef<ListMethods>(null)
  const layoutHeaderRef = useRef<View | null>(null)
  const anchorPostRef = useRef<View | null>(null)
  // TODO
  const [justPostedUris, setJustPostedUris] = useState(
    () => new Set<string>(),
  )

  const onPostReply = useCallback(
    (postUri: string | undefined) => {
      refetch()
      if (postUri) {
        setJustPostedUris(set => {
          const nextSet = new Set(set)
          nextSet.add(postUri)
          return nextSet
        })
      }
    },
    [refetch],
  )

  const {openComposer} = useComposerControls()
  const onReplyToAnchor = () => {
    const anchorPost = data?.slices.find(slice => slice.type === 'threadSlice' && slice.ui.isAnchor)
    if (anchorPost?.type !== 'threadSlice') {
      return
    }
    const post = anchorPost.slice.post
    openComposer({
      replyTo: {
        uri: anchorPost.slice.uri,
        cid: post.cid,
        text: post.record.text,
        author: post.author,
        embed: post.embed,
        moderation: anchorPost.moderation,
      },
      onPost: onPostReply,
    })
  }

  const renderItem = ({item, index}: {item: Slice; index: number}) => {
    if (item.type === 'threadSlice') {
      return (
        <View ref={item.ui.isAnchor ? anchorPostRef : undefined}>
          <PostThreadItem
            post={item.slice.post}
            record={item.slice.post.record}
            threadgateRecord={data?.threadgate?.record ?? undefined}
            moderation={item.moderation}
            treeView={treeViewEnabled}
            depth={item.slice.depth}
            // TODO
            // prevPost={prev}
            // nextPost={next}
            isHighlightedPost={item.ui.isAnchor}
            hasMore={item.slice.hasUnhydratedReplies}
            showChildReplyLine={item.ui.showChildReplyLine}
            showParentReplyLine={item.ui.showParentReplyLine}
            hasPrecedingItem={
              item.ui.showParentReplyLine || !!item.slice.hasUnhydratedParents
            } // !!hasUnrevealedParents // TODO
            // overrideBlur={
            //  hiddenRepliesState ===
            //    HiddenRepliesState.ShowAndOverridePostHider &&
            //  item.ctx.depth > 0
            // }
            onPostReply={onPostReply}
            hideTopBorder={index === 0} // && !item.slice.isParentLoading} // TODO
          />
        </View>
      )
    } else if (item.type === 'replyComposer') {
      return (
        <View>
          {gtPhone && <PostThreadComposePrompt onPressCompose={onReplyToAnchor} />}
        </View>
      )
    }
    return null
  }

  /*
   * This is only used on the web to keep the post in view when its parents
   * load. On native, we rely on `maintainVisibleContentPosition` instead.
   *
   * This runs synchronously before layout, meaning by the time the page
   * paints, we've already measured and adjusted the scroll position of the
   * list.
   */
  const didAdjustScrollWeb = useRef<boolean>(false)
  const onContentSizeChangeWeb = () => {
    // only run once
    if (didAdjustScrollWeb.current) return
    if (!isPlaceholderData) {
      // Measure synchronously to avoid a layout jump.
      const anchorPost = anchorPostRef.current as any as Element
      const headerNode = layoutHeaderRef.current as any as Element
      if (anchorPost && headerNode) {
        // get new scroll position
        let pageY = anchorPost.getBoundingClientRect().top
        // subtract header height
        pageY -= headerNode.getBoundingClientRect().height
        // don't scroll past 0
        pageY = Math.max(0, pageY)
        ref.current?.scrollToOffset({
          animated: false,
          offset: pageY,
        })
        didAdjustScrollWeb.current = true
      }
    }
  }

  return (
    <>
      <Layout.Header.Outer headerRef={layoutHeaderRef}>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans context="description">Post</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          <ThreadMenu
            sortReplies={sortReplies}
            treeViewEnabled={treeViewEnabled}
            setSortReplies={setSortReplies}
            setTreeViewEnabled={setTreeViewEnabled}
          />
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      {error ? (
        <PostThreadError error={error} />
      ) : (
        <ScrollProvider
        // onMomentumEnd={onMomentumEnd}
        >
          <List
            ref={ref}
            data={data?.slices ?? []}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onContentSizeChange={isNative ? undefined : onContentSizeChangeWeb}
            // onStartReached={onStartReached}
            // onEndReached={onEndReached}
            onEndReachedThreshold={2}
            // onScrollToTop={onScrollToTop}
            /**
             * @see https://reactnative.dev/docs/scrollview#maintainvisiblecontentposition
             */
            maintainVisibleContentPosition={
             isNative // && hasParents // TODO not sure we need this
               ? MAINTAIN_VISIBLE_CONTENT_POSITION
               : undefined
            }
            desktopFixedHeight
            // removeClippedSubviews={isAndroid ? false : undefined}
            ListFooterComponent={
              <ListFooter
                /*
                 * Using `isFetching` over `isFetchingNextPage` is done on
                 * purpose here so we get the loader on initial render
                 */
                isFetchingNextPage={isFetching}
                error={cleanError(error)}
                onRetry={refetch}
                /*
                 * 200 is based on the minimum height of a post. This is enough
                 * extra height for the `maintainVisPos` to work without
                 * causing weird jumps on web or glitches on native
                 */
                height={windowHeight - 200}
              />
            }
            initialNumToRender={initialNumToRender}
            windowSize={11}
            sideBorders={false}
          />
        </ScrollProvider>
      )}
    </>
  )
}

function PostThreadError({error}: {error: Error}) {
  const {_} = useLingui()

  // TODO use new cleanError hook
  const {title, message} = useMemo(() => {
    let title = _(msg`An error occurred`)
    let message = cleanError(error)

    if (error.message.startsWith('Post not found')) {
      title = _(msg`Post not found`)
      message = _(msg`The post may have been deleted.`)
    }
    return {title, message}
  }, [_, error])

  return <View />
}

function ThreadMenu({
  sortReplies,
  treeViewEnabled,
  setSortReplies,
  setTreeViewEnabled,
}: {
  sortReplies: string
  treeViewEnabled: boolean
  setSortReplies: (newValue: string) => void
  setTreeViewEnabled: (newValue: boolean) => void
}): React.ReactNode {
  const {_} = useLingui()
  return (
    <Menu.Root>
      <Menu.Trigger label={_(msg`Thread options`)}>
        {({props}) => (
          <Button
            label={_(msg`Thread options`)}
            size="small"
            variant="ghost"
            color="secondary"
            shape="round"
            hitSlop={HITSLOP_10}
            {...props}>
            <ButtonIcon icon={SettingsSlider} size="md" />
          </Button>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.LabelText>
          <Trans>Show replies as</Trans>
        </Menu.LabelText>
        <Menu.Group>
          <Menu.Item
            label={_(msg`Linear`)}
            onPress={() => {
              setTreeViewEnabled(false)
            }}>
            <Menu.ItemText>
              <Trans>Linear</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={!treeViewEnabled} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Threaded`)}
            onPress={() => {
              setTreeViewEnabled(true)
            }}>
            <Menu.ItemText>
              <Trans>Threaded</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={treeViewEnabled} />
          </Menu.Item>
        </Menu.Group>
        <Menu.Divider />
        <Menu.LabelText>
          <Trans>Reply sorting</Trans>
        </Menu.LabelText>
        <Menu.Group>
          <Menu.Item
            label={_(msg`Hot replies first`)}
            onPress={() => {
              setSortReplies('hotness')
            }}>
            <Menu.ItemText>
              <Trans>Hot replies first</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sortReplies === 'hotness'} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Oldest replies first`)}
            onPress={() => {
              setSortReplies('oldest')
            }}>
            <Menu.ItemText>
              <Trans>Oldest replies first</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sortReplies === 'oldest'} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Newest replies first`)}
            onPress={() => {
              setSortReplies('newest')
            }}>
            <Menu.ItemText>
              <Trans>Newest replies first</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sortReplies === 'newest'} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Most-liked replies first`)}
            onPress={() => {
              setSortReplies('most-likes')
            }}>
            <Menu.ItemText>
              <Trans>Most-liked replies first</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sortReplies === 'most-likes'} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Random (aka "Poster's Roulette")`)}
            onPress={() => {
              setSortReplies('random')
            }}>
            <Menu.ItemText>
              <Trans>Random (aka "Poster's Roulette")</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sortReplies === 'random'} />
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}

const keyExtractor = (item: Slice) => {
  return item.key
}
