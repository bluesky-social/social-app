import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {View} from 'react-native'
import {useAnimatedRef} from 'react-native-reanimated'
import {
  type AppBskyActorDefs,
  AppBskyGraphDefs,
  AtUri,
  moderateUserList,
  type ModerationOpts,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useHaptics} from '#/lib/haptics'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {ComposeIcon2} from '#/lib/icons'
import {makeListLink} from '#/lib/routes/links'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {type NavigationProp} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {cleanError} from '#/lib/strings/errors'
import {toShareUrl} from '#/lib/strings/url-helpers'
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
import {type FeedDescriptor} from '#/state/queries/post-feed'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {
  useAddSavedFeedsMutation,
  usePreferencesQuery,
  type UsePreferencesQueryResponse,
  useRemoveFeedMutation,
  useUpdateSavedFeedsMutation,
} from '#/state/queries/preferences'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {ListMembers} from '#/view/com/lists/ListMembers'
import {PagerWithHeader} from '#/view/com/pager/PagerWithHeader'
import {PostFeed} from '#/view/com/posts/PostFeed'
import {ProfileSubpageHeader} from '#/view/com/profile/ProfileSubpageHeader'
import {EmptyState} from '#/view/com/util/EmptyState'
import {FAB} from '#/view/com/util/fab/FAB'
import {type ListRef} from '#/view/com/util/List'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {ListHiddenScreen} from '#/screens/List/ListHiddenScreen'
import {atoms as a, platform, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {ListAddRemoveUsersDialog} from '#/components/dialogs/lists/ListAddRemoveUsersDialog'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLink} from '#/components/icons/ChainLink'
import {DotGrid_Stroke2_Corner0_Rounded as DotGridIcon} from '#/components/icons/DotGrid'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {PencilLine_Stroke2_Corner0_Rounded as PencilLineIcon} from '#/components/icons/Pencil'
import {
  PersonCheck_Stroke2_Corner0_Rounded as PersonCheckIcon,
  PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon,
  PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person'
import {Pin_Stroke2_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Menu from '#/components/Menu'
import * as Hider from '#/components/moderation/Hider'
import {
  ReportDialog,
  useReportDialogControl,
} from '#/components/moderation/ReportDialog'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

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
      <>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Could not load list</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <Layout.Content centerContent>
          <ErrorScreen
            error={_(
              msg`We're sorry, but we were unable to resolve this list. If this persists, please contact the list creator, @${handleOrDid}.`,
            )}
          />
        </Layout.Content>
      </>
    )
  }
  if (listError) {
    return (
      <>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Could not load list</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <Layout.Content centerContent>
          <ErrorScreen error={cleanError(listError)} />
        </Layout.Content>
      </>
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
    <>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content />
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content
        centerContent
        contentContainerStyle={platform({
          web: [a.mx_auto],
          native: [a.align_center],
        })}>
        <Loader size="2xl" />
      </Layout.Content>
    </>
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
  const {openComposer} = useOpenComposer()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {currentAccount} = useSession()
  const {rkey} = route.params
  const feedSectionRef = useRef<SectionRef>(null)
  const aboutSectionRef = useRef<SectionRef>(null)
  const isCurateList = list.purpose === AppBskyGraphDefs.CURATELIST
  const isScreenFocused = useIsFocused()
  const isHidden = list.labels?.findIndex(l => l.val === '!hide') !== -1
  const isOwner = currentAccount?.did === list.creator.did
  const scrollElRef = useAnimatedRef()
  const addUserDialogControl = useDialogControl()
  const sectionTitlesCurate = [_(msg`Posts`), _(msg`People`)]

  const moderation = useMemo(() => {
    return moderateUserList(list, moderationOpts)
  }, [list, moderationOpts])

  useSetTitle(isHidden ? _(msg`List Hidden`) : list.name)

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onChangeMembers = () => {
    if (isCurateList) {
      truncateAndInvalidate(queryClient, FEED_RQKEY(`list|${list.uri}`))
    }
  }

  const onCurrentPageSelected = useCallback(
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
          <View style={[a.util_screen_outer]}>
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
                  onPressAddUser={addUserDialogControl.open}
                />
              )}
              {({headerHeight, scrollElRef}) => (
                <AboutSection
                  ref={aboutSectionRef}
                  scrollElRef={scrollElRef as ListRef}
                  list={list}
                  onPressAddUser={addUserDialogControl.open}
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
          <ListAddRemoveUsersDialog
            control={addUserDialogControl}
            list={list}
            onChange={onChangeMembers}
          />
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
        <View style={[a.util_screen_outer]}>
          <Layout.Center>{renderHeader()}</Layout.Center>
          <AboutSection
            list={list}
            scrollElRef={scrollElRef as ListRef}
            onPressAddUser={addUserDialogControl.open}
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
        <ListAddRemoveUsersDialog
          control={addUserDialogControl}
          list={list}
          onChange={onChangeMembers}
        />
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
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const isCurateList = list.purpose === AppBskyGraphDefs.CURATELIST
  const isModList = list.purpose === AppBskyGraphDefs.MODLIST
  const isBlocking = !!list.viewer?.blocked
  const isMuting = !!list.viewer?.muted
  const playHaptic = useHaptics()

  const {mutateAsync: muteList, isPending: isMutePending} =
    useListMuteMutation()
  const {mutateAsync: blockList, isPending: isBlockPending} =
    useListBlockMutation()
  const {mutateAsync: addSavedFeeds, isPending: isAddSavedFeedPending} =
    useAddSavedFeedsMutation()
  const {mutateAsync: updateSavedFeeds, isPending: isUpdatingSavedFeeds} =
    useUpdateSavedFeedsMutation()

  const isPending = isAddSavedFeedPending || isUpdatingSavedFeeds

  const savedFeedConfig = preferences?.savedFeeds?.find(
    f => f.value === list.uri,
  )
  const isPinned = Boolean(savedFeedConfig?.pinned)

  const onTogglePinned = async () => {
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
      Toast.show(_(msg`There was an issue contacting the server`), {
        type: 'error',
      })
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }

  const onUnsubscribeMute = async () => {
    try {
      await muteList({uri: list.uri, mute: false})
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
  }

  const onUnsubscribeBlock = async () => {
    try {
      await blockList({uri: list.uri, block: false})
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
  }

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
        {isCurateList ? (
          <Button
            testID={isPinned ? 'unpinBtn' : 'pinBtn'}
            color={isPinned ? 'secondary' : 'primary_subtle'}
            label={isPinned ? _(msg`Unpin`) : _(msg`Pin to home`)}
            onPress={onTogglePinned}
            disabled={isPending}
            size="small"
            style={[a.rounded_full]}>
            {!isPinned && <ButtonIcon icon={isPending ? Loader : PinIcon} />}
            <ButtonText>
              {isPinned ? <Trans>Unpin</Trans> : <Trans>Pin to home</Trans>}
            </ButtonText>
          </Button>
        ) : isModList ? (
          isBlocking ? (
            <Button
              testID="unblockBtn"
              color="secondary"
              label={_(msg`Unblock`)}
              onPress={onUnsubscribeBlock}
              size="small"
              style={[a.rounded_full]}
              disabled={isBlockPending}>
              {isBlockPending && <ButtonIcon icon={Loader} />}
              <ButtonText>
                <Trans>Unblock</Trans>
              </ButtonText>
            </Button>
          ) : isMuting ? (
            <Button
              testID="unmuteBtn"
              color="secondary"
              label={_(msg`Unmute`)}
              onPress={onUnsubscribeMute}
              size="small"
              style={[a.rounded_full]}
              disabled={isMutePending}>
              {isMutePending && <ButtonIcon icon={Loader} />}
              <ButtonText>
                <Trans>Unmute</Trans>
              </ButtonText>
            </Button>
          ) : (
            <SubscribeMenu list={list} />
          )
        ) : null}
        <MoreOptionsMenu list={list} />
      </ProfileSubpageHeader>
      {descriptionRT ? (
        <View style={[a.px_lg, a.pt_sm, a.pb_sm, a.gap_md]}>
          <RichText value={descriptionRT} style={[a.text_md, a.leading_snug]} />
        </View>
      ) : null}
    </>
  )
}

function SubscribeMenu({list}: {list: AppBskyGraphDefs.ListView}) {
  const {_} = useLingui()
  const subscribeMutePromptControl = Prompt.usePromptControl()
  const subscribeBlockPromptControl = Prompt.usePromptControl()

  const {mutateAsync: muteList, isPending: isMutePending} =
    useListMuteMutation()
  const {mutateAsync: blockList, isPending: isBlockPending} =
    useListBlockMutation()

  const isPending = isMutePending || isBlockPending

  const onSubscribeMute = async () => {
    try {
      await muteList({uri: list.uri, mute: true})
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
        {type: 'error'},
      )
    }
  }

  const onSubscribeBlock = async () => {
    try {
      await blockList({uri: list.uri, block: true})
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
        {type: 'error'},
      )
    }
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Subscribe to this list`)}>
          {({props}) => (
            <Button
              label={props.accessibilityLabel}
              testID="subscribeBtn"
              size="small"
              color="primary_subtle"
              style={[a.rounded_full]}
              disabled={isPending}
              {...props}>
              {isPending && <ButtonIcon icon={Loader} />}
              <ButtonText>
                <Trans>Subscribe</Trans>
              </ButtonText>
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer>
          <Menu.Group>
            <Menu.Item
              label={_(msg`Mute accounts`)}
              onPress={subscribeMutePromptControl.open}>
              <Menu.ItemText>
                <Trans>Mute accounts</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon position="right" icon={MuteIcon} />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Block accounts`)}
              onPress={subscribeBlockPromptControl.open}>
              <Menu.ItemText>
                <Trans>Block accounts</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon position="right" icon={PersonXIcon} />
            </Menu.Item>
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>

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
    </>
  )
}

function MoreOptionsMenu({
  list,
  savedFeedConfig,
}: {
  list: AppBskyGraphDefs.ListView
  savedFeedConfig?: AppBskyActorDefs.SavedFeed
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {openModal} = useModalControls()
  const deleteListPromptControl = useDialogControl()
  const reportDialogControl = useReportDialogControl()
  const navigation = useNavigation<NavigationProp>()

  const {mutateAsync: removeSavedFeed} = useRemoveFeedMutation()
  const {mutateAsync: deleteList} = useListDeleteMutation()
  const {mutateAsync: muteList} = useListMuteMutation()
  const {mutateAsync: blockList} = useListBlockMutation()

  const isCurateList = list.purpose === AppBskyGraphDefs.CURATELIST
  const isModList = list.purpose === AppBskyGraphDefs.MODLIST
  const isBlocking = !!list.viewer?.blocked
  const isMuting = !!list.viewer?.muted
  const isPinned = Boolean(savedFeedConfig?.pinned)
  const isOwner = currentAccount?.did === list.creator.did

  const onPressShare = () => {
    const {rkey} = new AtUri(list.uri)
    const url = toShareUrl(`/profile/${list.creator.did}/lists/${rkey}`)
    shareUrl(url)
  }

  const onRemoveFromSavedFeeds = async () => {
    if (!savedFeedConfig) return
    try {
      await removeSavedFeed(savedFeedConfig)
      Toast.show(_(msg`Removed from your feeds`))
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), {
        type: 'error',
      })
      logger.error('Failed to remove pinned list', {message: e})
    }
  }

  const onPressEdit = () => {
    openModal({
      name: 'create-or-edit-list',
      list,
    })
  }

  const onPressDelete = async () => {
    await deleteList({uri: list.uri})

    if (savedFeedConfig) {
      await removeSavedFeed(savedFeedConfig)
    }

    Toast.show(_(msg({message: 'List deleted', context: 'toast'})))
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }

  const onUnpinModList = async () => {
    try {
      if (!savedFeedConfig) return
      await removeSavedFeed(savedFeedConfig)
      Toast.show(_(msg`Unpinned list`))
    } catch {
      Toast.show(_(msg`Failed to unpin list`), {
        type: 'error',
      })
    }
  }

  const onUnsubscribeMute = async () => {
    try {
      await muteList({uri: list.uri, mute: false})
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
  }

  const onUnsubscribeBlock = async () => {
    try {
      await blockList({uri: list.uri, block: false})
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
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger label={_(msg`More options`)}>
          {({props}) => (
            <Button
              label={props.accessibilityLabel}
              testID="moreOptionsBtn"
              size="small"
              color="secondary"
              shape="round"
              {...props}>
              <ButtonIcon icon={DotGridIcon} />
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer>
          <Menu.Group>
            <Menu.Item
              label={isWeb ? _(msg`Copy link to list`) : _(msg`Share via...`)}
              onPress={onPressShare}>
              <Menu.ItemText>
                {isWeb ? (
                  <Trans>Copy link to list</Trans>
                ) : (
                  <Trans>Share via...</Trans>
                )}
              </Menu.ItemText>
              <Menu.ItemIcon
                position="right"
                icon={isWeb ? ChainLink : ShareIcon}
              />
            </Menu.Item>
            {savedFeedConfig && (
              <Menu.Item
                label={_(msg`Remove from my feeds`)}
                onPress={onRemoveFromSavedFeeds}>
                <Menu.ItemText>
                  <Trans>Remove from my feeds</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon position="right" icon={TrashIcon} />
              </Menu.Item>
            )}
          </Menu.Group>

          <Menu.Divider />

          {isOwner ? (
            <Menu.Group>
              <Menu.Item
                label={_(msg`Edit list details`)}
                onPress={onPressEdit}>
                <Menu.ItemText>
                  <Trans>Edit list details</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon position="right" icon={PencilLineIcon} />
              </Menu.Item>
              <Menu.Item
                label={_(msg`Delete list`)}
                onPress={deleteListPromptControl.open}>
                <Menu.ItemText>
                  <Trans>Delete list</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon position="right" icon={TrashIcon} />
              </Menu.Item>
            </Menu.Group>
          ) : (
            <Menu.Group>
              <Menu.Item
                label={_(msg`Repost list`)}
                onPress={reportDialogControl.open}>
                <Menu.ItemText>
                  <Trans>Repost list</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon position="right" icon={WarningIcon} />
              </Menu.Item>
            </Menu.Group>
          )}

          {isModList && isPinned && (
            <>
              <Menu.Divider />
              <Menu.Group>
                <Menu.Item
                  label={_(msg`Unpin moderation list`)}
                  onPress={onUnpinModList}>
                  <Menu.ItemText>
                    <Trans>Unpin moderation list</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={PinIcon} />
                </Menu.Item>
              </Menu.Group>
            </>
          )}

          {isCurateList && (isBlocking || isMuting) && (
            <>
              <Menu.Divider />
              <Menu.Group>
                {isBlocking && (
                  <Menu.Item
                    label={_(msg`Unblock list`)}
                    onPress={onUnsubscribeBlock}>
                    <Menu.ItemText>
                      <Trans>Unblock list</Trans>
                    </Menu.ItemText>
                    <Menu.ItemIcon icon={PersonCheckIcon} />
                  </Menu.Item>
                )}
                {isMuting && (
                  <Menu.Item
                    label={_(msg`Unmute list`)}
                    onPress={onUnsubscribeMute}>
                    <Menu.ItemText>
                      <Trans>Unmute list</Trans>
                    </Menu.ItemText>
                    <Menu.ItemIcon icon={UnmuteIcon} />
                  </Menu.Item>
                )}
              </Menu.Group>
            </>
          )}
        </Menu.Outer>
      </Menu.Root>

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

      <ReportDialog
        control={reportDialogControl}
        subject={{
          ...list,
          $type: 'app.bsky.graph.defs#listView',
        }}
      />
    </>
  )
}

interface FeedSectionProps {
  ref?: React.Ref<SectionRef>
  feed: FeedDescriptor
  headerHeight: number
  scrollElRef: ListRef
  isFocused: boolean
  isOwner: boolean
  onPressAddUser: () => void
}

function FeedSection({
  ref,
  feed,
  scrollElRef,
  headerHeight,
  isFocused,
  isOwner,
  onPressAddUser,
}: FeedSectionProps) {
  const queryClient = useQueryClient()
  const [hasNew, setHasNew] = useState(false)
  const [isScrolledDown, setIsScrolledDown] = useState(false)
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
  useImperativeHandle(ref, () => ({
    scrollToTop: onScrollToTop,
  }))

  useEffect(() => {
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
          <Button
            label={_(msg`Start adding people`)}
            onPress={onPressAddUser}
            color="primary"
            size="small">
            <ButtonIcon icon={PersonPlusIcon} />
            <ButtonText>
              <Trans>Start adding people!</Trans>
            </ButtonText>
          </Button>
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
}

interface AboutSectionProps {
  ref?: React.Ref<SectionRef>
  list: AppBskyGraphDefs.ListView
  onPressAddUser: () => void
  headerHeight: number
  scrollElRef: ListRef
}

function AboutSection({
  ref,
  list,
  onPressAddUser,
  headerHeight,
  scrollElRef,
}: AboutSectionProps) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {isMobile} = useWebMediaQueries()
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const isOwner = list.creator.did === currentAccount?.did

  const onScrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: isNative,
      offset: -headerHeight,
    })
  }, [scrollElRef, headerHeight])

  useImperativeHandle(ref, () => ({
    scrollToTop: onScrollToTop,
  }))

  const renderHeader = useCallback(() => {
    if (!isOwner) {
      return <View />
    }
    if (isMobile) {
      return (
        <View style={[a.px_sm, a.py_sm]}>
          <Button
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
          </Button>
        </View>
      )
    }
    return (
      <View style={[a.px_lg, a.py_md, a.flex_row_reverse]}>
        <Button
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
        </Button>
      </View>
    )
  }, [isOwner, _, onPressAddUser, isMobile])

  const renderEmptyState = useCallback(() => {
    return (
      <View style={[a.gap_xl, a.align_center]}>
        <EmptyState icon="users-slash" message={_(msg`This list is empty.`)} />
        {isOwner && (
          <Button
            testID="emptyStateAddUserBtn"
            label={_(msg`Start adding people`)}
            onPress={onPressAddUser}
            color="primary"
            size="small">
            <ButtonIcon icon={PersonPlusIcon} />
            <ButtonText>
              <Trans>Start adding people!</Trans>
            </ButtonText>
          </Button>
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
}

function ErrorScreen({error}: {error: React.ReactNode}) {
  const t = useTheme()
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
    <View style={[a.px_xl, a.py_md, a.gap_md]}>
      <Text style={[a.text_4xl, a.font_heavy]}>
        <Trans>Could not load list</Trans>
      </Text>
      <Text style={[a.text_md, t.atoms.text_contrast_high, a.leading_snug]}>
        {error}
      </Text>

      <View style={[a.flex_row, a.mt_lg]}>
        <Button
          label={_(msg`Go back`)}
          accessibilityHint={_(msg`Returns to previous page`)}
          onPress={onPressBack}
          size="small"
          color="secondary">
          <ButtonText>
            <Trans>Go back</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
