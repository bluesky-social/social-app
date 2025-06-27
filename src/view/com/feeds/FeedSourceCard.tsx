import {type StyleProp, View, type ViewStyle} from 'react-native'
import {
  type $Typed,
  AppBskyFeedDefs,
  type AppBskyGraphDefs,
  AtUri,
} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {isNative, isWeb} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  type FeedSourceInfo,
  getFeedTypeFromUri,
  hydrateFeedGenerator,
  hydrateList,
  useFeedSourceInfoQuery,
} from '#/state/queries/feed'
import {useProfileQuery} from '#/state/queries/profile'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {Link} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

type FeedSourceCardProps = {
  feedUri: string
  feedData?:
    | $Typed<AppBskyFeedDefs.GeneratorView>
    | $Typed<AppBskyGraphDefs.ListView>
  style?: StyleProp<ViewStyle>
  showSaveBtn?: boolean
  showDescription?: boolean
  showLikes?: boolean
  pinOnSave?: boolean
  showMinimalPlaceholder?: boolean
  hideTopBorder?: boolean
  link?: boolean
}

export function FeedSourceCard({
  feedUri,
  feedData,
  ...props
}: FeedSourceCardProps) {
  if (feedData) {
    let feed: FeedSourceInfo
    if (AppBskyFeedDefs.isGeneratorView(feedData)) {
      feed = hydrateFeedGenerator(feedData)
    } else {
      feed = hydrateList(feedData)
    }
    return <FeedSourceCardLoaded feedUri={feedUri} feed={feed} {...props} />
  } else {
    return <FeedSourceCardWithoutData feedUri={feedUri} {...props} />
  }
}

export function FeedSourceCardWithoutData({
  feedUri,
  ...props
}: Omit<FeedSourceCardProps, 'feedData'>) {
  const {data: feed, error} = useFeedSourceInfoQuery({
    uri: feedUri,
  })

  return (
    <FeedSourceCardLoaded
      feedUri={feedUri}
      feed={feed}
      error={error}
      {...props}
    />
  )
}

export function FeedSourceCardLoaded({
  feedUri,
  feed,
  style,
  showDescription = false,
  showLikes = false,
  showMinimalPlaceholder,
  hideTopBorder,
  link = true,
  error,
}: {
  feedUri: string
  feed?: FeedSourceInfo
  style?: StyleProp<ViewStyle>
  showDescription?: boolean
  showLikes?: boolean
  showMinimalPlaceholder?: boolean
  hideTopBorder?: boolean
  link?: boolean
  error?: unknown
}) {
  const t = useTheme()
  const {_} = useLingui()

  /*
   * LOAD STATE
   *
   * This state also captures the scenario where a feed can't load for whatever
   * reason.
   */
  if (!feed) {
    if (error) {
      return (
        <MissingFeed
          uri={feedUri}
          style={style}
          hideTopBorder={hideTopBorder}
          error={error}
        />
      )
    }

    return (
      <FeedLoadingPlaceholder
        style={[
          t.atoms.border_contrast_low,
          !(showMinimalPlaceholder || hideTopBorder) && a.border_t,
          a.flex_1,
          style,
        ]}
        showTopBorder={false}
        showLowerPlaceholder={!showMinimalPlaceholder}
      />
    )
  }

  const inner = (
    <>
      <View style={[a.flex_row, a.align_center]}>
        <View style={[a.mr_md]}>
          <UserAvatar type="algo" size={36} avatar={feed.avatar} />
        </View>
        <View style={[a.flex_1]}>
          <Text
            emoji
            style={[a.text_sm, a.font_bold, a.leading_snug]}
            numberOfLines={1}>
            {feed.displayName}
          </Text>
          <Text
            style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]}
            numberOfLines={1}>
            {feed.type === 'feed' ? (
              <Trans>Feed by {sanitizeHandle(feed.creatorHandle, '@')}</Trans>
            ) : (
              <Trans>List by {sanitizeHandle(feed.creatorHandle, '@')}</Trans>
            )}
          </Text>
        </View>
      </View>
      {showDescription && feed.description ? (
        <RichText
          style={[t.atoms.text_contrast_high, a.flex_1, a.flex_wrap]}
          value={feed.description}
          numberOfLines={3}
        />
      ) : null}
      {showLikes && feed.type === 'feed' ? (
        <Text
          style={[
            a.text_sm,
            a.font_bold,
            t.atoms.text_contrast_medium,
            a.leading_snug,
          ]}>
          <Trans>
            Liked by{' '}
            <Plural value={feed.likeCount || 0} one="# user" other="# users" />
          </Trans>
        </Text>
      ) : null}
    </>
  )

  if (link) {
    return (
      <Link
        testID={`feed-${feed.displayName}`}
        label={_(
          feed.type === 'feed'
            ? msg`${feed.displayName}, a feed by ${sanitizeHandle(feed.creatorHandle, '@')}, liked by ${feed.likeCount || 0}`
            : msg`${feed.displayName}, a list by ${sanitizeHandle(feed.creatorHandle, '@')}`,
        )}
        to={{
          screen: feed.type === 'feed' ? 'ProfileFeed' : 'ProfileList',
          params: {name: feed.creatorDid, rkey: new AtUri(feed.uri).rkey},
        }}
        style={[
          a.flex_1,
          a.p_lg,
          a.gap_md,
          !hideTopBorder && !a.border_t,
          t.atoms.border_contrast_low,
          style,
        ]}>
        {inner}
      </Link>
    )
  } else {
    return (
      <View
        style={[
          a.flex_1,
          a.p_lg,
          a.gap_md,
          !hideTopBorder && !a.border_t,
          t.atoms.border_contrast_low,
          style,
        ]}>
        {inner}
      </View>
    )
  }
}

function MissingFeed({
  style,
  hideTopBorder,
  uri,
  error,
}: {
  style?: StyleProp<ViewStyle>
  hideTopBorder?: boolean
  uri: string
  error?: unknown
}) {
  const t = useTheme()
  const {_} = useLingui()
  const atUri = new AtUri(uri)
  const {data: profile, isError: isProfileError} = useProfileQuery({
    did: atUri.host,
  })
  const moderationOpts = useModerationOpts()
  const control = Dialog.useDialogControl()

  const type = getFeedTypeFromUri(uri)

  return (
    <>
      <Button
        label={
          type === 'feed'
            ? _(msg`Could not connect to custom feed`)
            : _(msg`Deleted list`)
        }
        accessibilityHint={_(msg`Tap for more information`)}
        onPress={control.open}
        style={[
          a.flex_1,
          a.p_lg,
          a.gap_md,
          !hideTopBorder && !a.border_t,
          t.atoms.border_contrast_low,
          a.justify_start,
          style,
        ]}>
        <View style={[a.flex_row, a.align_center]}>
          <View
            style={[
              {width: 36, height: 36},
              t.atoms.bg_contrast_25,
              a.rounded_sm,
              a.mr_md,
              a.align_center,
              a.justify_center,
            ]}>
            <WarningIcon size="lg" />
          </View>
          <View style={[a.flex_1]}>
            <Text
              emoji
              style={[a.text_sm, a.font_bold, a.leading_snug, a.italic]}
              numberOfLines={1}>
              {type === 'feed' ? (
                <Trans>Feed unavailable</Trans>
              ) : (
                <Trans>Deleted list</Trans>
              )}
            </Text>
            <Text
              style={[
                a.text_sm,
                t.atoms.text_contrast_medium,
                a.leading_snug,
                a.italic,
              ]}
              numberOfLines={1}>
              {isWeb ? (
                <Trans>Click for information</Trans>
              ) : (
                <Trans>Tap for information</Trans>
              )}
            </Text>
          </View>
        </View>
      </Button>

      <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />

        <Dialog.ScrollableInner
          label={_(msg`Unavailable feed information`)}
          style={web({maxWidth: 500})}>
          <View style={[a.gap_sm]}>
            <Text style={[a.font_heavy, a.text_2xl]}>
              {type === 'feed' ? (
                <Trans>Could not connect to feed service</Trans>
              ) : (
                <Trans>Deleted list</Trans>
              )}
            </Text>
            <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
              {type === 'feed' ? (
                <Trans>
                  We could not connect to the service that provides this custom
                  feed. It may be temporarily unavailable and experiencing
                  issues, or permanently unavailable.
                </Trans>
              ) : (
                <Trans>
                  We could not find this list. It was probably deleted.
                </Trans>
              )}
            </Text>
            <Divider style={[a.my_md]} />
            <Text style={[a.font_bold, t.atoms.text_contrast_high]}>
              {type === 'feed' ? (
                <Trans>Feed creator</Trans>
              ) : (
                <Trans>List creator</Trans>
              )}
            </Text>
            {profile && moderationOpts && (
              <View style={[a.w_full, a.align_start]}>
                <ProfileCard.Link
                  profile={profile}
                  onPress={() => control.close()}>
                  <ProfileCard.Header>
                    <ProfileCard.Avatar
                      profile={profile}
                      moderationOpts={moderationOpts}
                      disabledPreview
                    />
                    <ProfileCard.NameAndHandle
                      profile={profile}
                      moderationOpts={moderationOpts}
                    />
                  </ProfileCard.Header>
                </ProfileCard.Link>
              </View>
            )}
            {isProfileError && (
              <Text
                style={[
                  t.atoms.text_contrast_high,
                  a.italic,
                  a.text_center,
                  a.w_full,
                ]}>
                <Trans>Could not find profile</Trans>
              </Text>
            )}
            {type === 'feed' && (
              <>
                <Text
                  style={[a.font_bold, t.atoms.text_contrast_high, a.mt_md]}>
                  <Trans>Feed identifier</Trans>
                </Text>
                <Text style={[a.text_md, t.atoms.text_contrast_high, a.italic]}>
                  {atUri.rkey}
                </Text>
              </>
            )}
            {error instanceof Error && (
              <>
                <Text
                  style={[a.font_bold, t.atoms.text_contrast_high, a.mt_md]}>
                  <Trans>Error message</Trans>
                </Text>
                <Text style={[a.text_md, t.atoms.text_contrast_high, a.italic]}>
                  {cleanError(error.message)}
                </Text>
              </>
            )}
          </View>
          {isNative && (
            <Button
              label={_(msg`Close`)}
              onPress={() => control.close()}
              size="small"
              variant="solid"
              color="secondary"
              style={[a.mt_5xl]}>
              <ButtonText>
                <Trans>Close</Trans>
              </ButtonText>
            </Button>
          )}
          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
