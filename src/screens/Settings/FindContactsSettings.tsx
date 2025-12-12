import {useCallback, useEffect, useState} from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
import * as Contacts from 'expo-contacts'
import {
  type AppBskyContactDefs,
  type AppBskyContactGetSyncStatus,
  type ModerationOpts,
} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useIsFocused} from '@react-navigation/native'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {HITSLOP_10, urls} from '#/lib/constants'
import {isBlockedOrBlocking, isMuted} from '#/lib/moderation/blocked-and-muted'
import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {
  updateProfileShadow,
  useProfileShadow,
} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  findContactsStatusQueryKey,
  optimisticRemoveMatch,
  useContactsMatchesQuery,
  useContactsSyncStatusQuery,
} from '#/state/queries/find-contacts'
import {useAgent, useSession} from '#/state/session'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {List} from '#/view/com/util/List'
import {atoms as a, tokens, useGutters, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ContactsHeroImage} from '#/components/contacts/components/HeroImage'
import {ArrowRotateClockwise_Stroke2_Corner0_Rounded as ResyncIcon} from '#/components/icons/ArrowRotate'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Layout from '#/components/Layout'
import {InlineLinkText, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {bulkWriteFollows} from '../Onboarding/util'

type Props = NativeStackScreenProps<AllNavigatorParams, 'FindContactsSettings'>
export function FindContactsSettingsScreen({}: Props) {
  const {_} = useLingui()

  const {data, error, refetch} = useContactsSyncStatusQuery()

  const isFocused = useIsFocused()
  useEffect(() => {
    if (data && isFocused) {
      logger.metric('contacts:settings:presented', {
        hasPreviouslySynced: !!data.syncStatus,
        matchCount: data.syncStatus?.matchesCount,
      })
    }
  }, [data, isFocused])

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Find Friends</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      {isNative ? (
        data ? (
          !data.syncStatus ? (
            <Intro />
          ) : (
            <SyncStatus info={data.syncStatus} refetchStatus={refetch} />
          )
        ) : error ? (
          <ErrorScreen
            title={_(msg`Error getting the latest data.`)}
            message={cleanError(error)}
            onPressTryAgain={refetch}
          />
        ) : (
          <View style={[a.flex_1, a.justify_center, a.align_center]}>
            <Loader size="xl" />
          </View>
        )
      ) : (
        <ErrorScreen
          title={_(msg`Not available on this platform.`)}
          message={_(msg`Please use the native app to sync your contacts.`)}
        />
      )}
    </Layout.Screen>
  )
}

function Intro() {
  const gutter = useGutters(['base'])
  const t = useTheme()
  const {_} = useLingui()

  const {data: isAvailable, isSuccess} = useQuery({
    queryKey: ['contacts-available'],
    queryFn: async () => await Contacts.isAvailableAsync(),
  })

  return (
    <Layout.Content contentContainerStyle={[gutter, a.gap_lg]}>
      <ContactsHeroImage />
      <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
        <Trans>
          Find your friends on Bluesky by verifying your phone number and
          matching with your contacts. We protect your information and you
          control what happens next.{' '}
          <InlineLinkText
            to={urls.website.blog.findFriendsAnnouncement}
            label={_(
              msg({
                message: `Learn more about importing contacts`,
                context: `english-only-resource`,
              }),
            )}
            style={[a.text_md, a.leading_snug]}>
            <Trans context="english-only-resource">Learn more</Trans>
          </InlineLinkText>
        </Trans>
      </Text>
      {isAvailable ? (
        <Link
          to={{screen: 'FindContactsFlow'}}
          label={_(msg`Import contacts`)}
          size="large"
          color="primary"
          style={[a.flex_1, a.justify_center]}>
          <ButtonText>
            <Trans>Import contacts</Trans>
          </ButtonText>
        </Link>
      ) : (
        isSuccess && (
          <Admonition type="error">
            <Trans>
              Contact sync is not available on this device, as the app is unable
              to access your contacts.
            </Trans>
          </Admonition>
        )
      )}
    </Layout.Content>
  )
}

function SyncStatus({
  info,
  refetchStatus,
}: {
  info: AppBskyContactDefs.SyncStatus
  refetchStatus: () => Promise<any>
}) {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()

  const {
    data,
    isPending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchMatches,
  } = useContactsMatchesQuery()

  const [isPTR, setIsPTR] = useState(false)

  const onRefresh = () => {
    setIsPTR(true)
    Promise.all([refetchStatus(), refetchMatches()]).finally(() => {
      setIsPTR(false)
    })
  }

  const {mutate: dismissMatch} = useMutation({
    mutationFn: async (did: string) => {
      await agent.app.bsky.contact.dismissMatch({subject: did})
    },
    onMutate: async (did: string) => {
      logger.metric('contacts:settings:dismiss', {})
      optimisticRemoveMatch(queryClient, did)
    },
    onError: err => {
      refetchMatches()
      if (isNetworkError(err)) {
        Toast.show(
          _(
            msg`Could not follow all matches - please check your network connection.`,
          ),
          {type: 'error'},
        )
      } else {
        logger.error('Failed to follow all matches', {safeMessage: err})
        Toast.show(_(msg`Could not follow all matches. ${cleanError(err)}`), {
          type: 'error',
        })
      }
    },
  })

  const profiles = data?.pages?.flatMap(page => page.matches) ?? []

  const numProfiles = profiles.length
  const isAnyUnfollowed = profiles.some(profile => !profile.viewer?.following)

  const renderItem = useCallback(
    ({item, index}: ListRenderItemInfo<bsky.profile.AnyProfileView>) => {
      if (!moderationOpts) return null
      return (
        <MatchItem
          profile={item}
          isFirst={index === 0}
          isLast={index === numProfiles - 1}
          moderationOpts={moderationOpts}
          dismissMatch={dismissMatch}
        />
      )
    },
    [numProfiles, moderationOpts, dismissMatch],
  )

  const onEndReached = () => {
    if (!hasNextPage || isFetchingNextPage) return
    fetchNextPage()
  }

  return (
    <List
      data={profiles}
      renderItem={renderItem}
      ListHeaderComponent={
        <StatusHeader
          numMatches={info.matchesCount}
          isPending={isPending}
          isAnyUnfollowed={isAnyUnfollowed}
        />
      }
      ListFooterComponent={<StatusFooter syncedAt={info.syncedAt} />}
      onRefresh={onRefresh}
      refreshing={isPTR}
      onEndReached={onEndReached}
    />
  )
}

function MatchItem({
  profile,
  isFirst,
  isLast,
  moderationOpts,
  dismissMatch,
}: {
  profile: bsky.profile.AnyProfileView
  isFirst: boolean
  isLast: boolean
  moderationOpts: ModerationOpts
  dismissMatch: (did: string) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const shadow = useProfileShadow(profile)

  return (
    <View style={[a.px_xl]}>
      <View
        style={[
          a.p_md,
          a.border_t,
          a.border_x,
          t.atoms.border_contrast_high,
          isFirst && [
            a.curve_continuous,
            {borderTopLeftRadius: tokens.borderRadius.lg},
            {borderTopRightRadius: tokens.borderRadius.lg},
          ],
          isLast && [
            a.border_b,
            a.curve_continuous,
            {borderBottomLeftRadius: tokens.borderRadius.lg},
            {borderBottomRightRadius: tokens.borderRadius.lg},
            a.mb_sm,
          ],
        ]}>
        <ProfileCard.Header>
          <ProfileCard.Avatar
            profile={profile}
            moderationOpts={moderationOpts}
          />
          <ProfileCard.NameAndHandle
            profile={profile}
            moderationOpts={moderationOpts}
          />
          <ProfileCard.FollowButton
            profile={profile}
            moderationOpts={moderationOpts}
            logContext="FindContacts"
            onFollow={() => logger.metric('contacts:settings:follow', {})}
          />
          {!shadow.viewer?.following && (
            <Button
              color="secondary"
              variant="ghost"
              label={_(msg`Remove suggestion`)}
              onPress={() => dismissMatch(profile.did)}
              hoverStyle={[a.bg_transparent, {opacity: 0.5}]}
              hitSlop={8}>
              <ButtonIcon icon={XIcon} />
            </Button>
          )}
        </ProfileCard.Header>
      </View>
    </View>
  )
}

function StatusHeader({
  numMatches,
  isPending,
  isAnyUnfollowed,
}: {
  numMatches: number
  isPending: boolean
  isAnyUnfollowed: boolean
}) {
  const {_} = useLingui()
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()

  const {
    mutate: onFollowAll,
    isPending: isFollowingAll,
    isSuccess: hasFollowedAll,
  } = useMutation({
    mutationFn: async () => {
      const didsToFollow = []

      let cursor: string | undefined
      do {
        const page = await agent.app.bsky.contact.getMatches({
          limit: 100,
          cursor,
        })
        cursor = page.data.cursor
        for (const profile of page.data.matches) {
          if (
            profile.did !== currentAccount?.did &&
            !isBlockedOrBlocking(profile) &&
            !isMuted(profile) &&
            !profile.viewer?.following
          ) {
            didsToFollow.push(profile.did)
          }
        }
      } while (cursor)

      logger.metric('contacts:settings:followAll', {
        followCount: didsToFollow.length,
      })

      const uris = await wait(500, bulkWriteFollows(agent, didsToFollow))

      for (const did of didsToFollow) {
        const uri = uris.get(did)
        updateProfileShadow(queryClient, did, {
          followingUri: uri,
        })
      }
    },
    onSuccess: () => {
      Toast.show(_(msg`Followed all matches`), {type: 'success'})
    },
    onError: err => {
      if (isNetworkError(err)) {
        Toast.show(
          _(
            msg`Could not follow all matches - please check your network connection.`,
          ),
          {type: 'error'},
        )
      } else {
        logger.error('Failed to follow all matches', {safeMessage: err})
        Toast.show(_(msg`Could not follow all matches. ${cleanError(err)}`), {
          type: 'error',
        })
      }
    },
  })

  if (numMatches > 0) {
    if (isPending) {
      return (
        <View style={[a.w_full, a.py_3xl, a.align_center]}>
          <Loader size="xl" />
        </View>
      )
    }

    return (
      <View
        style={[
          a.pt_xl,
          a.px_xl,
          a.pb_md,
          a.flex_row,
          a.justify_between,
          a.align_center,
        ]}>
        <Text style={[a.text_md, a.font_semi_bold]}>
          <Plural
            value={numMatches}
            one="1 contact found"
            other="# contacts found"
          />
        </Text>
        {isAnyUnfollowed && (
          <Button
            label={_(msg`Follow all`)}
            color="primary"
            size="small"
            variant="ghost"
            onPress={() => onFollowAll()}
            disabled={isFollowingAll || hasFollowedAll}
            hitSlop={HITSLOP_10}
            style={[a.px_0, a.py_0, a.rounded_0]}
            hoverStyle={[a.bg_transparent, {opacity: 0.5}]}>
            <ButtonText>
              <Trans>Follow all</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
    )
  }

  return null
}

function StatusFooter({syncedAt}: {syncedAt: string}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const agent = useAgent()
  const queryClient = useQueryClient()

  const {mutate: removeData, isPending} = useMutation({
    mutationFn: async () => {
      await agent.app.bsky.contact.removeData({})
    },
    onMutate: () => logger.metric('contacts:settings:removeData', {}),
    onSuccess: () => {
      Toast.show(_(msg`Contacts removed`))
      queryClient.setQueryData<AppBskyContactGetSyncStatus.OutputSchema>(
        findContactsStatusQueryKey,
        {syncStatus: undefined},
      )
    },
    onError: err => {
      if (isNetworkError(err)) {
        Toast.show(
          _(
            msg`Failed to remove data due to a network error, please check your internet connection.`,
          ),
          {type: 'error'},
        )
      } else {
        logger.error('Remove data failed', {safeMessage: err})
        Toast.show(_(msg`Failed to remove data. ${cleanError(err)}`), {
          type: 'error',
        })
      }
    },
  })

  return (
    <View style={[a.px_xl, a.py_xl, a.gap_4xl]}>
      <View style={[a.gap_xs, a.align_start]}>
        <Text style={[a.text_md, a.font_semi_bold]}>
          <Trans>Contacts uploaded</Trans>
        </Text>
        <View style={[a.gap_2xs]}>
          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>We will notify you when we find your friends.</Trans>
          </Text>
          <Text
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              Uploaded on{' '}
              {i18n.date(new Date(syncedAt), {
                dateStyle: 'long',
              })}
            </Trans>
          </Text>
        </View>
        <Link
          label={_(msg`Resync contacts`)}
          to={{screen: 'FindContactsFlow'}}
          onPress={() => {
            const daysSinceLastSync = Math.floor(
              (Date.now() - new Date(syncedAt).getTime()) /
                (1000 * 60 * 60 * 24),
            )
            logger.metric('contacts:settings:resync', {
              daysSinceLastSync,
            })
          }}
          size="small"
          color="primary_subtle"
          style={[a.mt_xs]}>
          <ButtonIcon icon={ResyncIcon} />
          <ButtonText>
            <Trans>Resync contacts</Trans>
          </ButtonText>
        </Link>
      </View>

      <View style={[a.gap_xs, a.align_start]}>
        <Text style={[a.text_md, a.font_semi_bold]}>
          <Trans>Delete contacts</Trans>
        </Text>
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            Bluesky stores your contacts as encoded data. Removing your contacts
            will immediately delete this data.
          </Trans>
        </Text>
        <Button
          label={_(msg`Remove all contacts`)}
          onPress={() => removeData()}
          size="small"
          color="negative_subtle"
          disabled={isPending}
          style={[a.mt_xs]}>
          <ButtonIcon icon={isPending ? Loader : TrashIcon} />
          <ButtonText>
            <Trans>Remove all contacts</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
