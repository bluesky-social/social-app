import React from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {AppBskyActorDefs,AtUri} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useHaptics} from '#/lib/haptics'
import {makeProfileLink} from '#/lib/routes/links'
import {makeCustomFeedLink} from '#/lib/routes/links'
import {shareUrl} from '#/lib/sharing'
import {sanitizeHandle} from '#/lib/strings/handles'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {FeedSourceFeedInfo} from '#/state/queries/feed'
import {useLikeMutation, useUnlikeMutation} from '#/state/queries/like'
import {
  useAddSavedFeedsMutation,
  usePreferencesQuery,
  useRemoveFeedMutation,
  useUpdateSavedFeedsMutation,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {formatCount} from '#/view/com/util/numeric/format'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {useRichText} from '#/components/hooks/useRichText'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled,
  Heart2_Stroke2_Corner0_Rounded as Heart,
} from '#/components/icons/Heart2'
import {
  Pin_Filled_Corner0_Rounded as PinFilled,
  Pin_Stroke2_Corner0_Rounded as Pin,
} from '#/components/icons/Pin'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {ReportDialog, useReportDialogControl} from '#/components/ReportDialog'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

export function ProfileFeedHeader({info}: {info: FeedSourceFeedInfo}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const {hasSession} = useSession()
  const {gtPhone, gtMobile} = useBreakpoints()
  const {top} = useSafeAreaInsets()
  const infoControl = Dialog.useDialogControl()
  const playHaptic = useHaptics()

  const [likeUri, setLikeUri] = React.useState(info.likeUri || '')
  const isLiked = !!likeUri
  const likeCount =
    isLiked && likeUri ? (info.likeCount || 0) + 1 : info.likeCount || 0

  const {data: preferences} = usePreferencesQuery()
  const savedFeedConfig = preferences?.savedFeeds?.find(
    f => f.value === info.uri,
  )
  const isPinned = Boolean(savedFeedConfig?.pinned)
  const {mutateAsync: addSavedFeeds, isPending: isAddSavedFeedPending} =
    useAddSavedFeedsMutation()
  const {mutateAsync: updateSavedFeeds, isPending: isUpdateFeedPending} =
    useUpdateSavedFeedsMutation()
  const isOuterPinPending = isAddSavedFeedPending || isUpdateFeedPending

  const onTogglePinned = async () => {
    if (isOuterPinPending) return

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
          Toast.show(_(msg`Pinned ${info.displayName} to Home`))
        } else {
          Toast.show(_(msg`Un-pinned ${info.displayName} from Home`))
        }
      } else {
        await addSavedFeeds([
          {
            type: 'feed',
            value: info.uri,
            pinned: true,
          },
        ])
        Toast.show(_(msg`Pinned ${info.displayName} to Home`))
      }
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), 'xmark')
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }

  return (
    <>
      <Layout.Center
        style={[
          t.atoms.bg,
          a.z_10,
          {paddingTop: top},
          web([a.sticky, a.z_10, {top: 0}]),
        ]}>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content align="left">
            <Button
              label={_(msg`Open feed info screen`)}
              style={[
                a.justify_start,
                {
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  paddingRight: 12,
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
                      a.transition_transform,
                      t.atoms.bg_contrast_25,
                      pressed && t.atoms.bg_contrast_50,
                      hovered && {
                        transform: [{scaleX: 1.01}, {scaleY: 1.1}],
                      },
                    ]}
                  />

                  <View
                    style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
                    {info.avatar && (
                      <UserAvatar size={32} type="algo" avatar={info.avatar} />
                    )}

                    <View style={[a.flex_1]}>
                      <Text
                        style={[
                          a.text_md,
                          a.font_heavy,
                          a.leading_tight,
                          gtMobile && a.text_xl,
                        ]}
                        numberOfLines={2}>
                        {info.displayName}
                      </Text>
                      <View style={[a.flex_row, {gap: 6}]}>
                        <Text
                          style={[
                            a.flex_shrink,
                            a.text_xs,
                            a.leading_snug,
                            t.atoms.text_contrast_medium,
                            gtPhone && a.text_sm,
                          ]}
                          numberOfLines={1}>
                          {sanitizeHandle(info.creatorHandle, '@')}
                        </Text>
                        <View style={[a.flex_row, a.align_center, {gap: 2}]}>
                          <HeartFilled
                            size="xs"
                            fill={
                              likeUri
                                ? t.palette.like
                                : t.atoms.text_contrast_low.color
                            }
                          />
                          <Text
                            style={[
                              a.text_xs,
                              a.leading_snug,
                              t.atoms.text_contrast_medium,
                              gtPhone && a.text_sm,
                            ]}
                            numberOfLines={1}>
                            {formatCount(i18n, likeCount)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <ChevronDown
                      size="md"
                      fill={t.atoms.text_contrast_low.color}
                    />
                  </View>
                </>
              )}
            </Button>
          </Layout.Header.Content>

          {hasSession && (
            <Layout.Header.Slot>
              <Button
                label={
                  isPinned
                    ? _(`Un-pin ${info.displayName} from Home`)
                    : _(msg`Pin ${info.displayName} to Home`)
                }
                size="small"
                variant="ghost"
                shape="square"
                color="secondary"
                onPress={onTogglePinned}>
                {isPinned ? (
                  <PinFilled size="lg" fill={t.palette.primary_500} />
                ) : (
                  <ButtonIcon icon={Pin} size="lg" />
                )}
              </Button>
            </Layout.Header.Slot>
          )}
        </Layout.Header.Outer>
      </Layout.Center>

      <Dialog.Outer control={infoControl}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={_(msg`Feed menu`)}
          style={[gtMobile ? {width: 'auto', minWidth: 450} : a.w_full]}>
          <DialogInner
            info={info}
            likeUri={likeUri}
            setLikeUri={setLikeUri}
            likeCount={likeCount}
            isPinned={isPinned}
            onTogglePinned={onTogglePinned}
            isOuterPinPending={isOuterPinPending}
            savedFeedConfig={savedFeedConfig}
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
  onTogglePinned,
  isOuterPinPending,
  savedFeedConfig,
}: {
  info: FeedSourceFeedInfo
  likeUri: string
  setLikeUri: (uri: string) => void
  likeCount: number
  isPinned: boolean
  onTogglePinned: () => void
  isOuterPinPending: boolean
  savedFeedConfig: AppBskyActorDefs.SavedFeed | undefined
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {hasSession} = useSession()
  const playHaptic = useHaptics()
  const control = Dialog.useDialogContext()
  const reportDialogControl = useReportDialogControl()
  const [rt, loading] = useRichText(info.description.text)
  const {mutateAsync: likeFeed, isPending: isLikePending} = useLikeMutation()
  const {mutateAsync: unlikeFeed, isPending: isUnlikePending} =
    useUnlikeMutation()

  const isLiked = !!likeUri
  const feedRkey = React.useMemo(() => new AtUri(info.uri).rkey, [info.uri])

  const onToggleLiked = React.useCallback(async () => {
    try {
      playHaptic()

      if (isLiked && likeUri) {
        await unlikeFeed({uri: likeUri})
        setLikeUri('')
      } else {
        const res = await likeFeed({uri: info.uri, cid: info.cid})
        setLikeUri(res.uri)
      }
    } catch (err) {
      Toast.show(
        _(
          msg`There was an issue contacting the server, please check your internet connection and try again.`,
        ),
        'xmark',
      )
      logger.error('Failed to toggle like', {message: err})
    }
  }, [playHaptic, isLiked, likeUri, unlikeFeed, setLikeUri, likeFeed, info, _])

  const isSaved = Boolean(savedFeedConfig)
  const {mutateAsync: removeFeed, isPending: isRemovePending} =
    useRemoveFeedMutation()
  const {mutateAsync: addSavedFeeds, isPending: isAddSavedFeedPending} =
    useAddSavedFeedsMutation()
  const isFeedChangePending =
    isOuterPinPending || isRemovePending || isAddSavedFeedPending
  const onToggleSaved = async () => {
    if (isFeedChangePending) return

    try {
      playHaptic()

      if (savedFeedConfig) {
        await removeFeed(savedFeedConfig)
        Toast.show(_(msg`Removed from your feeds`))
      } else {
        await addSavedFeeds([
          {
            type: 'feed',
            value: info.uri,
            pinned: false,
          },
        ])
        Toast.show(_(msg`Saved to your feeds`))
      }
    } catch (err) {
      Toast.show(
        _(
          msg`There was an issue updating your feeds, please check your internet connection and try again.`,
        ),
        'xmark',
      )
      logger.error('Failed to update feeds', {message: err})
    }
  }
  const onTogglePinnedInner = () => {
    if (isFeedChangePending) return
    onTogglePinned()
  }

  const onPressShare = () => {
    const url = toShareUrl(info.route.href)
    shareUrl(url)
  }

  const onPressReport = () => {
    reportDialogControl.open()
  }

  return loading ? (
    <Loader size="xl" />
  ) : (
    <View style={[a.gap_md]}>
      <View style={[a.flex_row, a.align_center, a.gap_md]}>
        <UserAvatar type="algo" size={48} avatar={info.avatar} />

        <View style={[a.flex_1, a.gap_2xs]}>
          <Text
            style={[a.text_2xl, a.font_heavy, a.leading_tight]}
            numberOfLines={2}>
            {info.displayName}
          </Text>
          <Text
            style={[a.text_sm, a.leading_tight, t.atoms.text_contrast_medium]}
            numberOfLines={1}>
            <Trans>By</Trans>{' '}
            <InlineLinkText
              label={_(msg`View ${info.creatorHandle}'s profile`)}
              to={makeProfileLink({
                did: info.creatorDid,
                handle: info.creatorHandle,
              })}
              style={[
                a.text_sm,
                a.leading_tight,
                a.underline,
                t.atoms.text_contrast_medium,
              ]}
              numberOfLines={1}
              onPress={() => control.close()}>
              {sanitizeHandle(info.creatorHandle, '@')}
            </InlineLinkText>
          </Text>
        </View>

        <Button
          label={_(msg`Share this feed`)}
          size="small"
          variant="ghost"
          color="secondary"
          shape="round"
          onPress={onPressShare}>
          <ButtonIcon icon={Share} size="lg" />
        </Button>
      </View>

      <RichText value={rt} style={[a.text_md, a.leading_snug]} />

      <View style={[a.flex_row, a.gap_sm, a.align_center, {marginTop: -3}]}>
        <Button
          size="small"
          variant="solid"
          color="secondary"
          shape="round"
          label={isLiked ? _(msg`Unlike this feed`) : _(msg`Like this feed`)}
          testID="toggleLikeBtn"
          disabled={!hasSession || isLikePending || isUnlikePending}
          onPress={onToggleLiked}>
          {isLiked ? (
            <HeartFilled size="md" fill={t.palette.like} />
          ) : (
            <Heart size="md" fill={t.atoms.text_contrast_medium.color} />
          )}
        </Button>

        {typeof likeCount === 'number' && (
          <InlineLinkText
            label={_(msg`View users who like this feed`)}
            to={makeCustomFeedLink(info.creatorDid, feedRkey, 'liked-by')}
            style={[a.underline, t.atoms.text_contrast_medium]}
            onPress={() => control.close()}>
            <Plural
              value={likeCount}
              one="Liked by # user"
              other="Liked by # users"
            />
          </InlineLinkText>
        )}
      </View>

      {hasSession && (
        <>
          <View style={[a.flex_row, a.gap_sm, a.align_center]}>
            <Button
              label={
                isPinned
                  ? _(`Remove ${info.displayName} from my saved feeds`)
                  : _(msg`Add ${info.displayName} to my saved feeds`)
              }
              size="small"
              variant="solid"
              color={'secondary'}
              onPress={onToggleSaved}
              style={[a.flex_1]}>
              <ButtonText>
                {isSaved ? <Trans>Saved</Trans> : <Trans>Save feed</Trans>}
              </ButtonText>
              <ButtonIcon icon={isSaved ? Check : Plus} position="right" />
            </Button>
            <Button
              label={
                isPinned
                  ? _(`Un-pin ${info.displayName} from Home`)
                  : _(msg`Pin ${info.displayName} to Home`)
              }
              size="small"
              variant="solid"
              color={isPinned ? 'secondary_inverted' : 'primary'}
              onPress={onTogglePinnedInner}
              style={[a.flex_1]}>
              <ButtonText>
                {isPinned ? (
                  <Trans>Pinned</Trans>
                ) : isSaved ? (
                  <Trans>Pin</Trans>
                ) : (
                  <Trans>Pin and save</Trans>
                )}
              </ButtonText>
              <ButtonIcon icon={isPinned ? Check : Pin} position="right" />
            </Button>
          </View>

          <View style={[a.pt_xs, a.gap_lg]}>
            <Divider />

            <View
              style={[a.flex_row, a.align_center, a.gap_sm, a.justify_between]}>
              <Text style={[a.italic, t.atoms.text_contrast_medium]}>
                Something wrong? Let us know.
              </Text>

              <Button
                label={_(msg`Report feed`)}
                size="small"
                variant="solid"
                color="secondary"
                onPress={onPressReport}>
                <ButtonText>
                  <Trans>Report feed</Trans>
                </ButtonText>
                <ButtonIcon icon={CircleInfo} position="right" />
              </Button>
            </View>

            <ReportDialog
              control={reportDialogControl}
              params={{
                type: 'feedgen',
                uri: info.uri,
                cid: info.cid,
              }}
            />
          </View>
        </>
      )}
    </View>
  )
}
