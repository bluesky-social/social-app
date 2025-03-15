import React, {useCallback, useMemo} from 'react'
import {StyleSheet, View} from 'react-native'
import {useAnimatedRef} from 'react-native-reanimated'
import {
  AppBskyGraphDefs,
  AtUri,
  moderateUserList,
  ModerationOpts,
  RichText as RichTextAPI,
} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useHaptics} from '#/lib/haptics'
import {usePalette} from '#/lib/hooks/usePalette'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {ComposeIcon2} from '#/lib/icons'
import {makeListLink} from '#/lib/routes/links'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {NavigationProp} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {cleanError} from '#/lib/strings/errors'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {s} from '#/lib/styles'
import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {useModalControls} from '#/state/modals'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  useListBlockMutation,
  useListDeleteMutation,
  useListMuteMutation,
  useListQuery,
} from '#/state/queries/list'
import {FeedDescriptor} from '#/state/queries/post-feed'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {
  useAddSavedFeedsMutation,
  usePreferencesQuery,
  UsePreferencesQueryResponse,
  useRemoveFeedMutation,
  useUpdateSavedFeedsMutation,
} from '#/state/queries/preferences'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useComposerControls} from '#/state/shell/composer'
import {ListMembers} from '#/view/com/lists/ListMembers'
import {PagerWithHeader} from '#/view/com/pager/PagerWithHeader'
import {PostFeed} from '#/view/com/posts/PostFeed'
import {ProfileSubpageHeader} from '#/view/com/profile/ProfileSubpageHeader'
import {EmptyState} from '#/view/com/util/EmptyState'
import {FAB} from '#/view/com/util/fab/FAB'
import {Button} from '#/view/com/util/forms/Button'
import {
  DropdownItem,
  NativeDropdown,
} from '#/view/com/util/forms/NativeDropdown'
import {ListRef} from '#/view/com/util/List'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {LoadingScreen} from '#/view/com/util/LoadingScreen'
import {Text} from '#/view/com/util/text/Text'
import * as Toast from '#/view/com/util/Toast'
import {ListHiddenScreen} from '#/screens/List/ListHiddenScreen'
import {atoms as a} from '#/alf'
import {Button as NewButton, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import * as Layout from '#/components/Layout'
import * as Hider from '#/components/moderation/Hider'
import {
  ReportDialog,
  useReportDialogControl,
} from '#/components/moderation/ReportDialog'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'

interface SectionRef {
  scrollToTop: () => void
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileList'>
export function ProfileListScreen(props: Props) {
  return (
    <Layout.Screen testID="profileListScreen">
      <ProfileListScreenInner {...props} />
    </Layout.Screen>
  )
}

function ProfileListScreenInner(props: Props) {
  const {_} = useLingui()
  const {name: handleOrDid, rkey} = props.route.params
  const {data: resolvedUri, error: resolveError} = useResolveUriQuery(
    AtUri.make(handleOrDid, 'app.bsky.graph.list', rkey).toString(),
  )
  const {data: preferences} = usePreferencesQuery()
  const {data: list, error: listError} = useListQuery(resolvedUri?.uri)
  const moderationOpts = useModerationOpts()

  if (resolveError) {
    return (
      <Layout.Content>
        <ErrorScreen
          error={_(
            msg`We're sorry, but we were unable to resolve this list. If this persists, please contact the list creator, @${handleOrDid}.`,
          )}
        />
      </Layout.Content>
    )
  }
  if (listError) {
    return (
      <Layout.Content>
        <ErrorScreen error={cleanError(listError)} />
      </Layout.Content>
    )
  }

  return resolvedUri && list && moderationOpts && preferences ? (
    <ProfileListScreenLoaded
      {...props}
      uri={resolvedUri.uri}
      list={list}
      moderationOpts={moderationOpts}
      preferences={preferences}
    />
  ) : (
    <LoadingScreen />
  )
}

function ProfileListScreenLoaded({
  route,
  uri,
  list,
  moderationOpts,
  preferences,
}: Props & {
  uri: string
  list: AppBskyGraphDefs.ListView
  moderationOpts: ModerationOpts
  preferences: UsePreferencesQueryResponse
}) {
  const {_} = useLingui()
  const queryClient = useQueryClient()
  const {openComposer} = useComposerControls()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {currentAccount} = useSession()
  const {rkey} = route.params
  const feedSectionRef = React.useRef<SectionRef>(null)
  const aboutSectionRef = React.useRef<SectionRef>(null)
  const {openModal} = useModalControls()
  const isCurateList = list.purpose === AppBskyGraphDefs.CURATELIST
  const isScreenFocused = useIsFocused()
  const isHidden = list.labels?.findIndex(l => l.val === '!hide') !== -1
  const isOwner = currentAccount?.did === list.creator.did
  const scrollElRef = useAnimatedRef()
  const sectionTitlesCurate = [_(msg`Posts`), _(msg`People`)]

  const moderation = React.useMemo(() => {
    return moderateUserList(list, moderationOpts)
  }, [list, moderationOpts])

  useSetTitle(isHidden ? _(msg`List Hidden`) : list.name)

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onPressAddUser = useCallback(() => {
    openModal({
      name: 'list-add-remove-users',
      list,
      onChange() {
        if (isCurateList) {
          truncateAndInvalidate(queryClient, FEED_RQKEY(`list|${list.uri}`))
        }
      },
    })
  }, [openModal, list, isCurateList, queryClient])

  const onCurrentPageSelected = React.useCallback(
    (index: number) => {
      if (index === 0) {
        feedSectionRef.current?.scrollToTop()
      } else if (index === 1) {
        aboutSectionRef.current?.scrollToTop()
      }
    },
    [feedSectionRef],
  )

  const renderHeader = useCallback(() => {
    return <Header rkey={rkey} list={list} preferences={preferences} />
  }, [rkey, list, preferences])

  if (isCurateList) {
    return (
      <Hider.Outer modui={moderation.ui('contentView')} allowOverride={isOwner}>
        <Hider.Mask>
          <ListHiddenScreen list={list} preferences={preferences} />
        </Hider.Mask>
        <Hider.Content>
          <View style={s.hContentRegion}>
            <PagerWithHeader
              items={sectionTitlesCurate}
              isHeaderReady={true}
              renderHeader={renderHeader}
              onCurrentPageSelected={onCurrentPageSelected}>
              {({headerHeight, scrollElRef, isFocused}) => (
                <FeedSection
                  ref={feedSectionRef}
                  feed={`list|${uri}`}
                  scrollElRef={scrollElRef as ListRef}
                  headerHeight={headerHeight}
                  isFocused={isScreenFocused && isFocused}
                  isOwner={isOwner}
                  onPressAddUser={onPressAddUser}
                />
              )}
              {({headerHeight, scrollElRef}) => (
                <AboutSection
                  ref={aboutSectionRef}
                  scrollElRef={scrollElRef as ListRef}
                  list={list}
                  onPressAddUser={onPressAddUser}
                  headerHeight={headerHeight}
                />
              )}
            </PagerWithHeader>
            <FAB
              testID="composeFAB"
              onPress={() => openComposer({})}
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
        </Hider.Content>
      </Hider.Outer>
    )
  }
  return (
    <Hider.Outer modui={moderation.ui('contentView')} allowOverride={isOwner}>
      <Hider.Mask>
        <ListHiddenScreen list={list} preferences={preferences} />
      </Hider.Mask>
      <Hider.Content>
        <View style={s.hContentRegion}>
          <Layout.Center>{renderHeader()}</Layout.Center>
          <AboutSection
            list={list}
            scrollElRef={scrollElRef as ListRef}
            onPressAddUser={onPressAddUser}
            headerHeight={0}
          />
          <FAB
            testID="composeFAB"
            onPress={() => openComposer({})}
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
      </Hider.Content>
    </Hider.Outer>
  )
}

function Header({
  rkey,
  list,
  preferences,
}: {
  rkey: string
  list: AppBskyGraphDefs.ListView
  preferences: UsePreferencesQueryResponse
}) {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const {currentAccount} = useSession()
  const reportDialogControl = useReportDialogControl()
  const {openModal} = useModalControls()
  const listMuteMutation = useListMuteMutation()
  const listBlockMutation = useListBlockMutation()
  const listDeleteMutation = useListDeleteMutation()
  const isCurateList = list.purpose === 'app.bsky.graph.defs#curatelist'
  const isModList = list.purpose === 'app.bsky.graph.defs#modlist'
  const isBlocking = !!list.viewer?.blocked
  const isMuting = !!list.viewer?.muted
  const isOwner = list.creator.did === currentAccount?.did
  const playHaptic = useHaptics()

  const {mutateAsync: addSavedFeeds, isPending: isAddSavedFeedPending} =
    useAddSavedFeedsMutation()
  const {mutateAsync: removeSavedFeed, isPending: isRemovePending} =
    useRemoveFeedMutation()
  const {mutateAsync: updateSavedFeeds, isPending: isUpdatingSavedFeeds} =
    useUpdateSavedFeedsMutation()

  const isPending =
    isAddSavedFeedPending || isRemovePending || isUpdatingSavedFeeds

  const deleteListPromptControl = useDialogControl()
  const subscribeMutePromptControl = useDialogControl()
  const subscribeBlockPromptControl = useDialogControl()

  const savedFeedConfig = preferences?.savedFeeds?.find(
    f => f.value === list.uri,
  )
  const isPinned = Boolean(savedFeedConfig?.pinned)

  const onTogglePinned = React.useCallback(async () => {
    playHaptic()

    try {
      if (savedFeedConfig) {
        const pinned = !savedFeedConfig.pinned
        await updateSavedFeeds([
          {
            ...savedFeedConfig,
            pinned,
          },
        ])
        Toast.show(
          pinned
            ? _(msg`Pinned to your feeds`)
            : _(msg`Unpinned from your feeds`),
        )
      } else {
        await addSavedFeeds([
          {
            type: 'list',
            value: list.uri,
            pinned: true,
          },
        ])
        Toast.show(_(msg`Saved to your feeds`))
      }
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), 'xmark')
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }, [
    playHaptic,
    addSavedFeeds,
    updateSavedFeeds,
    list.uri,
    _,
    savedFeedConfig,
  ])

  const onRemoveFromSavedFeeds = React.useCallback(async () => {
    playHaptic()
    if (!savedFeedConfig) return
    try {
      await removeSavedFeed(savedFeedConfig)
      Toast.show(_(msg`Removed from your feeds`))
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), 'xmark')
      logger.error('Failed to remove pinned list', {message: e})
    }
  }, [playHaptic, removeSavedFeed, _, savedFeedConfig])

  const onSubscribeMute = useCallback(async () => {
    try {
      await listMuteMutation.mutateAsync({uri: list.uri, mute: true})
      Toast.show(_(msg({message: 'List muted', context: 'toast'})))
      logger.metric(
        'moderation:subscribedToList',
        {listType: 'mute'},
        {statsig: true},
      )
    } catch {
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
      )
    }
  }, [list, listMuteMutation, _])

  const onUnsubscribeMute = useCallback(async () => {
    try {
      await listMuteMutation.mutateAsync({uri: list.uri, mute: false})
      Toast.show(_(msg({message: 'List unmuted', context: 'toast'})))
      logger.metric(
        'moderation:unsubscribedFromList',
        {listType: 'mute'},
        {statsig: true},
      )
    } catch {
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
      )
    }
  }, [list, listMuteMutation, _])

  const onSubscribeBlock = useCallback(async () => {
    try {
      await listBlockMutation.mutateAsync({uri: list.uri, block: true})
      Toast.show(_(msg({message: 'List blocked', context: 'toast'})))
      logger.metric(
        'moderation:subscribedToList',
        {listType: 'block'},
        {statsig: true},
      )
    } catch {
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
      )
    }
  }, [list, listBlockMutation, _])

  const onUnsubscribeBlock = useCallback(async () => {
    try {
      await listBlockMutation.mutateAsync({uri: list.uri, block: false})
      Toast.show(_(msg({message: 'List unblocked', context: 'toast'})))
      logger.metric(
        'moderation:unsubscribedFromList',
        {listType: 'block'},
        {statsig: true},
      )
    } catch {
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
      )
    }
  }, [list, listBlockMutation, _])

  const onPressEdit = useCallback(() => {
    openModal({
      name: 'create-or-edit-list',
      list,
    })
  }, [openModal, list])

  const onPressDelete = useCallback(async () => {
    await listDeleteMutation.mutateAsync({uri: list.uri})

    if (savedFeedConfig) {
      await removeSavedFeed(savedFeedConfig)
    }

    Toast.show(_(msg({message: 'List deleted', context: 'toast'})))
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [
    list,
    listDeleteMutation,
    navigation,
    _,
    removeSavedFeed,
    savedFeedConfig,
  ])

  const onPressReport = useCallback(() => {
    reportDialogControl.open()
  }, [reportDialogControl])

  const onPressShare = useCallback(() => {
    const url = toShareUrl(`/profile/${list.creator.did}/lists/${rkey}`)
    shareUrl(url)
  }, [list, rkey])

  const dropdownItems: DropdownItem[] = useMemo(() => {
    let items: DropdownItem[] = [
      {
        testID: 'listHeaderDropdownShareBtn',
        label: isWeb ? _(msg`Copy link to list`) : _(msg`Share`),
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

    if (savedFeedConfig) {
      items.push({
        testID: 'listHeaderDropdownRemoveFromFeedsBtn',
        label: _(msg`Remove from my feeds`),
        onPress: onRemoveFromSavedFeeds,
        icon: {
          ios: {
            name: 'trash',
          },
          android: '',
          web: ['far', 'trash-can'],
        },
      })
    }

    if (isOwner) {
      items.push({label: 'separator'})
      items.push({
        testID: 'listHeaderDropdownEditBtn',
        label: _(msg`Edit list details`),
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
        label: _(msg`Delete List`),
        onPress: deleteListPromptControl.open,
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
        label: _(msg`Report List`),
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
    if (isModList && isPinned) {
      items.push({label: 'separator'})
      items.push({
        testID: 'listHeaderDropdownUnpinBtn',
        label: _(msg`Unpin moderation list`),
        onPress:
          isPending || !savedFeedConfig
            ? undefined
            : () => removeSavedFeed(savedFeedConfig),
        icon: {
          ios: {
            name: 'pin',
          },
          android: '',
          web: 'thumbtack',
        },
      })
    }
    if (isCurateList && (isBlocking || isMuting)) {
      items.push({label: 'separator'})

      if (isMuting) {
        items.push({
          testID: 'listHeaderDropdownMuteBtn',
          label: _(msg`Un-mute list`),
          onPress: onUnsubscribeMute,
          icon: {
            ios: {
              name: 'eye',
            },
            android: '',
            web: 'eye',
          },
        })
      }

      if (isBlocking) {
        items.push({
          testID: 'listHeaderDropdownBlockBtn',
          label: _(msg`Un-block list`),
          onPress: onUnsubscribeBlock,
          icon: {
            ios: {
              name: 'person.fill.xmark',
            },
            android: '',
            web: 'user-slash',
          },
        })
      }
    }
    return items
  }, [
    _,
    onPressShare,
    isOwner,
    isModList,
    isPinned,
    isCurateList,
    onPressEdit,
    deleteListPromptControl.open,
    onPressReport,
    isPending,
    isBlocking,
    isMuting,
    onUnsubscribeMute,
    onUnsubscribeBlock,
    removeSavedFeed,
    savedFeedConfig,
    onRemoveFromSavedFeeds,
  ])

  const subscribeDropdownItems: DropdownItem[] = useMemo(() => {
    return [
      {
        testID: 'subscribeDropdownMuteBtn',
        label: _(msg`Mute accounts`),
        onPress: subscribeMutePromptControl.open,
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
        label: _(msg`Block accounts`),
        onPress: subscribeBlockPromptControl.open,
        icon: {
          ios: {
            name: 'person.fill.xmark',
          },
          android: '',
          web: 'ban',
        },
      },
    ]
  }, [_, subscribeMutePromptControl.open, subscribeBlockPromptControl.open])

  const descriptionRT = useMemo(
    () =>
      list.description
        ? new RichTextAPI({
            text: list.description,
            facets: list.descriptionFacets,
          })
        : undefined,
    [list],
  )

  return (
    <>
      <ProfileSubpageHeader
        href={makeListLink(list.creator.handle || list.creator.did || '', rkey)}
        title={list.name}
        avatar={list.avatar}
        isOwner={list.creator.did === currentAccount?.did}
        creator={list.creator}
        purpose={list.purpose}
        avatarType="list">
        <ReportDialog
          control={reportDialogControl}
          subject={{
            ...list,
            $type: 'app.bsky.graph.defs#listView',
          }}
        />
        {isCurateList ? (
          <Button
            testID={isPinned ? 'unpinBtn' : 'pinBtn'}
            type={isPinned ? 'default' : 'inverted'}
            label={isPinned ? _(msg`Unpin`) : _(msg`Pin to home`)}
            onPress={onTogglePinned}
            disabled={isPending}
          />
        ) : isModList ? (
          isBlocking ? (
            <Button
              testID="unblockBtn"
              type="default"
              label={_(msg`Unblock`)}
              onPress={onUnsubscribeBlock}
            />
          ) : isMuting ? (
            <Button
              testID="unmuteBtn"
              type="default"
              label={_(msg`Unmute`)}
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
            <FontAwesomeIcon
              icon="ellipsis"
              size={20}
              color={pal.colors.text}
            />
          </View>
        </NativeDropdown>

        <Prompt.Basic
          control={deleteListPromptControl}
          title={_(msg`Delete this list?`)}
          description={_(
            msg`If you delete this list, you won't be able to recover it.`,
          )}
          onConfirm={onPressDelete}
          confirmButtonCta={_(msg`Delete`)}
          confirmButtonColor="negative"
        />

        <Prompt.Basic
          control={subscribeMutePromptControl}
          title={_(msg`Mute these accounts?`)}
          description={_(
            msg`Muting is private. Muted accounts can interact with you, but you will not see their posts or receive notifications from them.`,
          )}
          onConfirm={onSubscribeMute}
          confirmButtonCta={_(msg`Mute list`)}
        />

        <Prompt.Basic
          control={subscribeBlockPromptControl}
          title={_(msg`Block these accounts?`)}
          description={_(
            msg`Blocking is public. Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.`,
          )}
          onConfirm={onSubscribeBlock}
          confirmButtonCta={_(msg`Block list`)}
          confirmButtonColor="negative"
        />
      </ProfileSubpageHeader>
      {descriptionRT ? (
        <View style={[a.px_lg, a.pt_sm, a.pb_sm, a.gap_md]}>
          <RichText value={descriptionRT} style={[a.text_md, a.leading_snug]} />
        </View>
      ) : null}
    </>
  )
}

interface FeedSectionProps {
  feed: FeedDescriptor
  headerHeight: number
  scrollElRef: ListRef
  isFocused: boolean
  isOwner: boolean
  onPressAddUser: () => void
}
const FeedSection = React.forwardRef<SectionRef, FeedSectionProps>(
  function FeedSectionImpl(
    {feed, scrollElRef, headerHeight, isFocused, isOwner, onPressAddUser},
    ref,
  ) {
    const queryClient = useQueryClient()
    const [hasNew, setHasNew] = React.useState(false)
    const [isScrolledDown, setIsScrolledDown] = React.useState(false)
    const isScreenFocused = useIsFocused()
    const {_} = useLingui()

    const onScrollToTop = useCallback(() => {
      scrollElRef.current?.scrollToOffset({
        animated: isNative,
        offset: -headerHeight,
      })
      queryClient.resetQueries({queryKey: FEED_RQKEY(feed)})
      setHasNew(false)
    }, [scrollElRef, headerHeight, queryClient, feed, setHasNew])
    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    React.useEffect(() => {
      if (!isScreenFocused) {
        return
      }
      return listenSoftReset(onScrollToTop)
    }, [onScrollToTop, isScreenFocused])

    const renderPostsEmpty = useCallback(() => {
      return (
        <View style={[a.gap_xl, a.align_center]}>
          <EmptyState icon="hashtag" message={_(msg`This feed is empty.`)} />
          {isOwner && (
            <NewButton
              label={_(msg`Start adding people`)}
              onPress={onPressAddUser}
              color="primary"
              size="small"
              variant="solid">
              <ButtonIcon icon={PersonPlusIcon} />
              <ButtonText>
                <Trans>Start adding people!</Trans>
              </ButtonText>
            </NewButton>
          )}
        </View>
      )
    }, [_, onPressAddUser, isOwner])

    return (
      <View>
        <PostFeed
          testID="listFeed"
          enabled={isFocused}
          feed={feed}
          pollInterval={60e3}
          disablePoll={hasNew}
          scrollElRef={scrollElRef}
          onHasNew={setHasNew}
          onScrolledDownChange={setIsScrolledDown}
          renderEmptyState={renderPostsEmpty}
          headerOffset={headerHeight}
        />
        {(isScrolledDown || hasNew) && (
          <LoadLatestBtn
            onPress={onScrollToTop}
            label={_(msg`Load new posts`)}
            showIndicator={hasNew}
          />
        )}
      </View>
    )
  },
)

interface AboutSectionProps {
  list: AppBskyGraphDefs.ListView
  onPressAddUser: () => void
  headerHeight: number
  scrollElRef: ListRef
}
const AboutSection = React.forwardRef<SectionRef, AboutSectionProps>(
  function AboutSectionImpl(
    {list, onPressAddUser, headerHeight, scrollElRef},
    ref,
  ) {
    const {_} = useLingui()
    const {currentAccount} = useSession()
    const {isMobile} = useWebMediaQueries()
    const [isScrolledDown, setIsScrolledDown] = React.useState(false)
    const isOwner = list.creator.did === currentAccount?.did

    const onScrollToTop = useCallback(() => {
      scrollElRef.current?.scrollToOffset({
        animated: isNative,
        offset: -headerHeight,
      })
    }, [scrollElRef, headerHeight])

    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    const renderHeader = React.useCallback(() => {
      if (!isOwner) {
        return <View />
      }
      if (isMobile) {
        return (
          <View style={[a.px_sm, a.py_sm]}>
            <NewButton
              testID="addUserBtn"
              label={_(msg`Add a user to this list`)}
              onPress={onPressAddUser}
              color="primary"
              size="small"
              variant="outline"
              style={[a.py_md]}>
              <ButtonIcon icon={PersonPlusIcon} />
              <ButtonText>
                <Trans>Add people</Trans>
              </ButtonText>
            </NewButton>
          </View>
        )
      }
      return (
        <View style={[a.px_lg, a.py_md, a.flex_row_reverse]}>
          <NewButton
            testID="addUserBtn"
            label={_(msg`Add a user to this list`)}
            onPress={onPressAddUser}
            color="primary"
            size="small"
            variant="ghost"
            style={[a.py_sm]}>
            <ButtonIcon icon={PersonPlusIcon} />
            <ButtonText>
              <Trans>Add people</Trans>
            </ButtonText>
          </NewButton>
        </View>
      )
    }, [isOwner, _, onPressAddUser, isMobile])

    const renderEmptyState = useCallback(() => {
      return (
        <View style={[a.gap_xl, a.align_center]}>
          <EmptyState
            icon="users-slash"
            message={_(msg`This list is empty.`)}
          />
          {isOwner && (
            <NewButton
              testID="emptyStateAddUserBtn"
              label={_(msg`Start adding people`)}
              onPress={onPressAddUser}
              color="primary"
              size="small"
              variant="solid">
              <ButtonIcon icon={PersonPlusIcon} />
              <ButtonText>
                <Trans>Start adding people!</Trans>
              </ButtonText>
            </NewButton>
          )}
        </View>
      )
    }, [_, onPressAddUser, isOwner])

    return (
      <View>
        <ListMembers
          testID="listItems"
          list={list.uri}
          scrollElRef={scrollElRef}
          renderHeader={renderHeader}
          renderEmptyState={renderEmptyState}
          headerOffset={headerHeight}
          onScrolledDownChange={setIsScrolledDown}
        />
        {isScrolledDown && (
          <LoadLatestBtn
            onPress={onScrollToTop}
            label={_(msg`Scroll to top`)}
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
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderTopWidth: StyleSheet.hairlineWidth,
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
          accessibilityLabel={_(msg`Go back`)}
          accessibilityHint={_(msg`Returns to previous page`)}
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
