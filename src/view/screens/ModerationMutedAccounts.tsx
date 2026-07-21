import {useCallback, useMemo, useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {
  type AppBskyActorDefs as ActorDefs,
  moderateProfile,
  type ModerationOpts,
} from '@atproto/api'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {getModerationCauseKey} from '#/lib/moderation'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useMyMutedAccountsQuery} from '#/state/queries/my-muted-accounts'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import * as Pills from '#/components/Pills'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import {getMuteState} from '#/types/bsky/mute'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ModerationMutedAccounts'
>
export function ModerationMutedAccounts({}: Props) {
  const moderationOpts = useModerationOpts()

  const [isPTRing, setIsPTRing] = useState(false)
  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMyMutedAccountsQuery()
  const isEmpty = !isFetching && !data?.pages[0]?.mutes.length
  const profiles = useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.mutes)
    }
    return []
  }, [data])

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh my muted accounts', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return

    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more of my muted accounts', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const renderItem = ({
    item,
    index,
  }: {
    item: ActorDefs.ProfileView
    index: number
  }) => {
    if (!moderationOpts) return null
    return (
      <MutedAccountRow
        key={item.did}
        profile={item}
        moderationOpts={moderationOpts}
        index={index}
      />
    )
  }
  return (
    <Layout.Screen testID="mutedAccountsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Muted Accounts</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Center>
        {isEmpty ? (
          <View>
            <Info style={[a.border_b]} />
            {isError ? (
              <ErrorScreen
                title="Oops!"
                message={cleanError(error)}
                onPressTryAgain={refetch}
              />
            ) : (
              <Empty />
            )}
          </View>
        ) : (
          <List
            data={profiles}
            keyExtractor={item => item.did}
            refreshing={isPTRing}
            onRefresh={onRefresh}
            onEndReached={onEndReached}
            renderItem={renderItem}
            initialNumToRender={15}
            // FIXME(dan)

            ListHeaderComponent={Info}
            ListFooterComponent={
              <ListFooter
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                error={cleanError(error)}
                onRetry={fetchNextPage}
              />
            }
          />
        )}
      </Layout.Center>
    </Layout.Screen>
  )
}

function MutedAccountRow({
  profile,
  moderationOpts,
  index,
}: {
  profile: ActorDefs.ProfileView
  moderationOpts: ModerationOpts
  index: number
}) {
  const t = useTheme()
  /*
   * Shadow the profile so the mute-kind pill updates live when the mute is
   * edited elsewhere in the app.
   */
  const shadowed = useProfileShadow(profile)
  const {muted, mutedReposts, mutedQuoteposts} = getMuteState(shadowed.viewer)

  /*
   * Same pill row as ProfileCard.Labels, except the generic "Account Muted"
   * label is replaced by the mute-kind pill - every row on this screen is
   * muted, so the kind is the useful information.
   */
  const moderation = moderateProfile(shadowed, moderationOpts)
  const modui = moderation.ui('profileList')
  const followedBy = shadowed.viewer?.followedBy
  const causes = [...modui.alerts, ...modui.informs].filter(
    cause => cause.type !== 'muted',
  )

  return (
    <View style={[a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low]}>
      <ProfileCard.Link profile={shadowed} testID={`mutedAccount-${index}`}>
        <ProfileCard.Outer>
          <ProfileCard.Header>
            <ProfileCard.Avatar
              profile={shadowed}
              moderationOpts={moderationOpts}
            />
            <ProfileCard.NameAndHandle
              profile={shadowed}
              moderationOpts={moderationOpts}
            />
          </ProfileCard.Header>
          <Pills.Row style={[a.pt_xs]}>
            {followedBy && <Pills.FollowsYou />}
            {(muted || mutedReposts || mutedQuoteposts) && (
              <MuteKindPill
                muted={muted}
                mutedReposts={mutedReposts}
                mutedQuoteposts={mutedQuoteposts}
              />
            )}
            {causes.map(cause => (
              <Pills.Label key={getModerationCauseKey(cause)} cause={cause} />
            ))}
          </Pills.Row>
          <ProfileCard.Description profile={shadowed} />
        </ProfileCard.Outer>
      </ProfileCard.Link>
    </View>
  )
}

function MuteKindPill({
  muted,
  mutedReposts,
  mutedQuoteposts,
}: {
  muted: boolean
  mutedReposts: boolean
  mutedQuoteposts: boolean
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.justify_center,
        t.atoms.bg_contrast_50,
        {
          paddingHorizontal: 6,
          paddingVertical: 3,
          borderRadius: 4,
        },
      ]}>
      <Text style={[a.text_xs, a.leading_tight]}>
        {muted ? (
          <Trans>All activity muted</Trans>
        ) : mutedReposts && mutedQuoteposts ? (
          <Trans>Reposts and quote posts muted</Trans>
        ) : mutedReposts ? (
          <Trans>Reposts muted</Trans>
        ) : (
          <Trans>Quote posts muted</Trans>
        )}
      </Text>
    </View>
  )
}

function Empty() {
  const t = useTheme()
  return (
    <View style={[a.pt_2xl, a.px_xl, a.align_center]}>
      <View
        style={[
          a.py_md,
          a.px_lg,
          a.rounded_sm,
          t.atoms.bg_contrast_25,
          a.border,
          t.atoms.border_contrast_low,
          {maxWidth: 400},
        ]}>
        <Text style={[a.text_sm, a.text_center, t.atoms.text_contrast_high]}>
          <Trans>
            You have not muted any accounts yet. To mute an account, go to their
            profile and select "Mute account" from the menu on their account.
          </Trans>
        </Text>
      </View>
    </View>
  )
}

function Info({style}: {style?: StyleProp<ViewStyle>}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        t.atoms.bg_contrast_25,
        a.py_md,
        a.px_xl,
        a.border_t,
        {marginTop: a.border.borderWidth * -1},
        t.atoms.border_contrast_low,
        style,
      ]}>
      <Text style={[a.text_center, a.text_sm, t.atoms.text_contrast_high]}>
        <Trans>
          Muted accounts have their posts removed from your feed and from your
          notifications. Mutes are completely private.
        </Trans>
      </Text>
    </View>
  )
}
