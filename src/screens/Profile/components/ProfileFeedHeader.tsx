import {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {AtUri} from '@atproto/api'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {makeCustomFeedLink, makeProfileLink} from '#/lib/routes/links'
import {shareUrl} from '#/lib/sharing'
import {sanitizeHandle} from '#/lib/strings/handles'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {type FeedSourceFeedInfo} from '#/state/queries/feed'
import {useLikeMutation, useUnlikeMutation} from '#/state/queries/like'
import {
  useAddSavedFeedsMutation,
  usePreferencesQuery,
  useRemoveFeedMutation,
  useUpdateSavedFeedsMutation,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {formatCount} from '#/view/com/util/numeric/format'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilledIcon,
  Heart2_Stroke2_Corner0_Rounded as HeartIcon,
} from '#/components/icons/Heart2'
import {
  Pin_Filled_Corner0_Rounded as PinFilledIcon,
  Pin_Stroke2_Corner0_Rounded as PinIcon,
} from '#/components/icons/Pin'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import * as Menu from '#/components/Menu'
import {
  ReportDialog,
  useReportDialogControl,
} from '#/components/moderation/ReportDialog'
import {RichText} from '#/components/RichText'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'

export function ProfileFeedHeaderSkeleton() {
  const t = useTheme()

  return (
    <Layout.Header.Outer>
      <Layout.Header.BackButton />
      <Layout.Header.Content>
        <View
          style={[a.w_full, a.rounded_sm, t.atoms.bg_contrast_25, {height: 40}]}
        />
      </Layout.Header.Content>
      <Layout.Header.Slot>
        <View
          style={[
            a.justify_center,
            a.align_center,
            a.rounded_full,
            t.atoms.bg_contrast_25,
            {
              height: 34,
              width: 34,
            },
          ]}>
          <PinIcon size="lg" fill={t.atoms.text_contrast_low.color} />
        </View>
      </Layout.Header.Slot>
    </Layout.Header.Outer>
  )
}

export function ProfileFeedHeader({
  info,
  isTrending,
}: {
  info: FeedSourceFeedInfo
  isTrending: boolean
}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const ax = useAnalytics()
  const {hasSession} = useSession()
  const {gtMobile} = useBreakpoints()
  const infoControl = Dialog.useDialogControl()
  const playHaptic = useHaptics()

  const {data: preferences} = usePreferencesQuery()

  const [likeUri, setLikeUri] = useState(info.likeUri || '')
  const likeCount =
    (info.likeCount || 0) +
    (likeUri && !info.likeUri ? 1 : !likeUri && info.likeUri ? -1 : 0)

  const {mutateAsync: addSavedFeeds, isPending: isAddSavedFeedPending} =
    useAddSavedFeedsMutation()
  const {mutateAsync: removeFeed, isPending: isRemovePending} =
    useRemoveFeedMutation()
  const {mutateAsync: updateSavedFeeds, isPending: isUpdateFeedPending} =
    useUpdateSavedFeedsMutation()

  const isFeedStateChangePending =
    isAddSavedFeedPending || isRemovePending || isUpdateFeedPending
  const savedFeedConfig = preferences?.savedFeeds?.find(
    f => f.value === info.uri,
  )
  const isSaved = Boolean(savedFeedConfig)
  const isPinned = Boolean(savedFeedConfig?.pinned)

  const onToggleSaved = async () => {
    try {
      playHaptic()

      if (savedFeedConfig) {
        await removeFeed(savedFeedConfig)
        Toast.show(l`Removed from your feeds`)
        ax.metric('feed:unsave', {feedUrl: info.uri})
      } else {
        await addSavedFeeds([
          {
            type: 'feed',
            value: info.uri,
            pinned: false,
          },
        ])
        Toast.show(l`Saved to your feeds`)
        ax.metric('feed:save', {feedUrl: info.uri})
      }
    } catch (err) {
      Toast.show(
        l`There was an issue updating your feeds, please check your internet connection and try again.`,
        {
          type: 'error',
        },
      )
      logger.error('Failed to update feeds', {message: err})
    }
  }

  const onTogglePinned = async () => {
    try {
      playHaptic()

      if (savedFeedConfig) {
        const pinned = !savedFeedConfig.pinned
        await updateSavedFeeds([
          {
            ...savedFeedConfig,
            pinned,
          },
        ])

        if (pinned) {
          Toast.show(l`Pinned ${info.displayName} to Home`)
          ax.metric('feed:pin', {feedUrl: info.uri})
        } else {
          Toast.show(l`Unpinned ${info.displayName} from Home`)
          ax.metric('feed:unpin', {feedUrl: info.uri})
        }
      } else {
        await addSavedFeeds([
          {
            type: 'feed',
            value: info.uri,
            pinned: true,
          },
        ])
        Toast.show(l`Pinned ${info.displayName} to Home`)
        ax.metric('feed:pin', {feedUrl: info.uri})
      }
    } catch (e) {
      Toast.show(l`There was an issue contacting the server`, {
        type: 'error',
      })
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }

  return (
    <>
      <Layout.Center
        style={[t.atoms.bg, a.z_10, web([a.sticky, a.z_10, {top: 0}])]}>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content align="left">
            {isTrending ? (
              <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
                <View style={[a.flex_1]}>
                  <Text
                    style={[
                      a.text_md,
                      a.font_bold,
                      a.leading_snug,
                      gtMobile && a.text_lg,
                    ]}
                    numberOfLines={2}
                    emoji>
                    {info.displayName}
                  </Text>
                </View>
                <Button
                  label={l`Open feed info screen`}
                  size="medium"
                  shape="round"
                  color="secondary"
                  variant="ghost"
                  onPress={() => {
                    playHaptic()
                    infoControl.open()
                  }}>
                  <ButtonIcon icon={EllipsisIcon} />
                </Button>
              </View>
            ) : (
              <Button
                label={l`Open feed info screen`}
                style={[
                  a.justify_start,
                  {
                    paddingVertical: IS_WEB ? 2 : 4,
                    paddingRight: 8,
                  },
                ]}
                onPress={() => {
                  playHaptic()
                  infoControl.open()
                }}>
                {({hovered, pressed}) => (
                  <>
                    <View
                      style={[
                        a.absolute,
                        a.inset_0,
                        a.rounded_sm,
                        a.transition_all,
                        t.atoms.bg_contrast_25,
                        {
                          opacity: 0,
                          left: IS_WEB ? -2 : -4,
                          right: 0,
                        },
                        pressed && {
                          opacity: 1,
                        },
                        hovered && {
                          opacity: 1,
                          transform: [{scaleX: 1.01}, {scaleY: 1.1}],
                        },
                      ]}
                    />

                    <View
                      style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
                      {info.avatar && (
                        <UserAvatar
                          size={36}
                          type="algo"
                          avatar={info.avatar}
                        />
                      )}

                      <View style={[a.flex_1]}>
                        <Text
                          style={[
                            a.text_md,
                            a.font_bold,
                            a.leading_snug,
                            gtMobile && a.text_lg,
                          ]}
                          numberOfLines={2}
                          emoji>
                          {info.displayName}
                        </Text>
                        <View style={[a.flex_row, a.gap_2xs]}>
                          <Text
                            style={[
                              a.flex_shrink,
                              a.text_sm,
                              a.leading_snug,
                              t.atoms.text_contrast_high,
                            ]}
                            numberOfLines={1}>
                            {sanitizeHandle(info.creatorHandle, '@')}
                          </Text>
                          {likeCount > 0 ? (
                            <View
                              style={[a.flex_row, a.align_center, {gap: 2}]}>
                              <HeartFilledIcon
                                size="xs"
                                fill={
                                  likeUri
                                    ? t.palette.pink
                                    : t.atoms.text_contrast_low.color
                                }
                                style={[{width: 14, height: 14}]}
                              />
                              <Text
                                style={[
                                  a.text_sm,
                                  a.leading_snug,
                                  t.atoms.text_contrast_high,
                                ]}
                                numberOfLines={1}>
                                {formatCount(i18n, likeCount)}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <EllipsisIcon
                        size="md"
                        fill={t.atoms.text_contrast_high.color}
                      />
                    </View>
                  </>
                )}
              </Button>
            )}
          </Layout.Header.Content>

          {!isTrending && hasSession ? (
            <Layout.Header.Slot>
              {isPinned ? (
                <Menu.Root>
                  <Menu.Trigger label={l`Open feed options menu`}>
                    {({props}) => {
                      return (
                        <Button
                          {...props}
                          label={l`Open feed options menu`}
                          size="small"
                          variant="ghost"
                          shape="square"
                          color="secondary">
                          <PinFilledIcon
                            size="lg"
                            fill={t.palette.primary_500}
                          />
                        </Button>
                      )
                    }}
                  </Menu.Trigger>

                  <Menu.Outer>
                    <Menu.Item
                      disabled={isFeedStateChangePending}
                      label={l`Unpin from home`}
                      onPress={() => void onTogglePinned()}>
                      <Menu.ItemText>{l`Unpin from home`}</Menu.ItemText>
                      <Menu.ItemIcon icon={XIcon} position="right" />
                    </Menu.Item>
                    <Menu.Item
                      disabled={isFeedStateChangePending}
                      label={
                        isSaved ? l`Remove from my feeds` : l`Save to my feeds`
                      }
                      onPress={() => void onToggleSaved()}>
                      <Menu.ItemText>
                        {isSaved
                          ? l`Remove from my feeds`
                          : l`Save to my feeds`}
                      </Menu.ItemText>
                      <Menu.ItemIcon
                        icon={isSaved ? TrashIcon : PlusIcon}
                        position="right"
                      />
                    </Menu.Item>
                  </Menu.Outer>
                </Menu.Root>
              ) : (
                <Button
                  label={l`Pin to Home`}
                  size="small"
                  variant="ghost"
                  shape="square"
                  color="secondary"
                  onPress={() => void onTogglePinned()}>
                  <ButtonIcon icon={PinIcon} size="lg" />
                </Button>
              )}
            </Layout.Header.Slot>
          ) : null}
        </Layout.Header.Outer>
      </Layout.Center>
      <Dialog.Outer control={infoControl}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={l`Feed menu`}
          style={[gtMobile ? {width: 'auto', minWidth: 450} : a.w_full]}>
          <DialogInner
            info={info}
            likeUri={likeUri}
            setLikeUri={setLikeUri}
            likeCount={likeCount}
            isPinned={isPinned}
            isTrending={isTrending}
            onTogglePinned={() => void onTogglePinned()}
            isFeedStateChangePending={isFeedStateChangePending}
          />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}

function DialogInner({
  info,
  likeUri,
  setLikeUri,
  likeCount,
  isPinned,
  isTrending,
  onTogglePinned,
  isFeedStateChangePending,
}: {
  info: FeedSourceFeedInfo
  likeUri: string
  setLikeUri: (uri: string) => void
  likeCount: number
  isPinned: boolean
  isTrending: boolean
  onTogglePinned: () => void
  isFeedStateChangePending: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {hasSession} = useSession()
  const playHaptic = useHaptics()
  const control = Dialog.useDialogContext()
  const reportDialogControl = useReportDialogControl()
  const {mutateAsync: likeFeed, isPending: isLikePending} = useLikeMutation()
  const {mutateAsync: unlikeFeed, isPending: isUnlikePending} =
    useUnlikeMutation()

  const isLiked = !!likeUri
  const feedRkey = useMemo(() => new AtUri(info.uri).rkey, [info.uri])

  const onToggleLiked = async () => {
    try {
      playHaptic()

      if (isLiked && likeUri) {
        await unlikeFeed({uri: likeUri})
        setLikeUri('')
        ax.metric('feed:unlike', {feedUrl: info.uri})
      } else {
        const res = await likeFeed({uri: info.uri, cid: info.cid})
        setLikeUri(res.uri)
        ax.metric('feed:like', {feedUrl: info.uri})
      }
    } catch (err) {
      Toast.show(
        l`There was an issue contacting the server, please check your internet connection and try again.`,
        {
          type: 'error',
        },
      )
      logger.error('Failed to toggle like', {message: err})
    }
  }

  const onPressShare = useCallback(() => {
    playHaptic()
    const url = toShareUrl(info.route.href)
    void shareUrl(url)
    ax.metric('feed:share', {feedUrl: info.uri})
  }, [ax, info, playHaptic])

  const onPressReport = useCallback(() => {
    reportDialogControl.open()
  }, [reportDialogControl])

  return (
    <View style={[a.gap_md]}>
      <View style={[a.flex_row, a.align_center, a.gap_md]}>
        <UserAvatar type="algo" size={48} avatar={info.avatar} />

        <View style={[a.flex_1, a.gap_2xs]}>
          <Text
            style={[a.text_2xl, a.font_bold, a.leading_tight]}
            numberOfLines={2}
            emoji>
            {info.displayName}
          </Text>
          <Text
            style={[a.text_sm, a.leading_relaxed, t.atoms.text_contrast_medium]}
            numberOfLines={1}>
            <Trans>
              By{' '}
              <InlineLinkText
                label={l`View ${info.creatorHandle}'s profile`}
                to={makeProfileLink({
                  did: info.creatorDid,
                  handle: info.creatorHandle,
                })}
                style={[a.text_sm, a.underline, t.atoms.text_contrast_medium]}
                numberOfLines={1}
                onPress={() => control.close()}>
                {sanitizeHandle(info.creatorHandle, '@')}
              </InlineLinkText>
            </Trans>
          </Text>
        </View>

        <Button
          label={l`Share this feed`}
          size="small"
          variant="ghost"
          color="secondary"
          shape="round"
          onPress={onPressShare}>
          <ButtonIcon icon={ShareIcon} size="lg" />
        </Button>
      </View>
      <RichText value={info.description} style={[a.text_md]} />

      {typeof likeCount === 'number' && likeCount > 0 ? (
        <View style={[a.flex_row, a.gap_sm, a.align_center]}>
          <InlineLinkText
            label={l`View users who like this feed`}
            to={makeCustomFeedLink(info.creatorDid, feedRkey, 'liked-by')}
            style={[a.underline, t.atoms.text_contrast_medium]}
            onPress={() => control.close()}>
            <Trans>
              Liked by <Plural value={likeCount} one="# user" other="# users" />
            </Trans>
          </InlineLinkText>
        </View>
      ) : null}
      {hasSession ? (
        <>
          {!isTrending ? (
            <View style={[a.flex_row, a.gap_sm, a.align_center, a.pt_sm]}>
              <Button
                disabled={isLikePending || isUnlikePending}
                label={l`Like this feed`}
                size="small"
                color="secondary"
                onPress={() => void onToggleLiked()}
                style={[a.flex_1]}>
                {isLiked ? (
                  <HeartFilledIcon size="sm" fill={t.palette.pink} />
                ) : (
                  <ButtonIcon icon={HeartIcon} />
                )}

                <ButtonText>
                  {isLiked ? <Trans>Unlike</Trans> : <Trans>Like</Trans>}
                </ButtonText>
              </Button>
              <Button
                disabled={isFeedStateChangePending}
                label={isPinned ? l`Unpin feed` : l`Pin feed`}
                size="small"
                color={isPinned ? 'secondary' : 'primary'}
                onPress={onTogglePinned}
                style={[a.flex_1]}>
                <ButtonText>
                  {isPinned ? (
                    <Trans>Unpin feed</Trans>
                  ) : (
                    <Trans>Pin feed</Trans>
                  )}
                </ButtonText>
                <ButtonIcon icon={PinIcon} position="right" />
              </Button>
            </View>
          ) : null}

          <View style={[a.pt_xs, a.gap_lg]}>
            <Divider />

            <View
              style={[a.flex_row, a.align_center, a.gap_sm, a.justify_between]}>
              <Text style={[a.italic, t.atoms.text_contrast_medium]}>
                <Trans>Something wrong? Let us know.</Trans>
              </Text>

              <Button
                label={l`Report feed`}
                size="small"
                variant="solid"
                color="secondary"
                onPress={onPressReport}>
                <ButtonText>
                  <Trans>Report feed</Trans>
                </ButtonText>
                <ButtonIcon icon={CircleInfoIcon} position="right" />
              </Button>
            </View>

            {info.view && (
              <ReportDialog
                control={reportDialogControl}
                subject={{
                  ...info.view,
                  $type: 'app.bsky.feed.defs#generatorView',
                }}
              />
            )}
          </View>
        </>
      ) : null}
    </View>
  )
}
