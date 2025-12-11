import {useCallback, useState} from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
import * as Contacts from 'expo-contacts'
import {
  type AppBskyContactDefs,
  type AppBskyContactGetSyncStatus,
  type ModerationOpts,
} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  findContactsStatusQueryKey,
  useContactsMatchesQuery,
  useContactsSyncStatusQuery,
} from '#/state/queries/find-contacts'
import {useAgent} from '#/state/session'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {List} from '#/view/com/util/List'
import {atoms as a, tokens, useGutters, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ContactsHeroImage} from '#/components/contacts/components/HeroImage'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ResyncIcon} from '#/components/icons/ArrowRotateCounterClockwise'
import {Contacts_Stroke2_Corner2_Rounded as FindContactsIcon} from '#/components/icons/Contacts'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Layout from '#/components/Layout'
import {InlineLinkText, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<AllNavigatorParams, 'FindContactsSettings'>
export function FindContactsSettingsScreen({}: Props) {
  const {_} = useLingui()

  const {data, error, refetch} = useContactsSyncStatusQuery()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Find Contacts</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      {isNative ? (
        data ? (
          !data.syncStatus ? (
            <Intro />
          ) : (
            <SyncStatus info={data.syncStatus} refetch={refetch} />
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
            to="#"
            label={_(msg`Learn more`)}
            style={[a.text_md, a.leading_snug]}>
            TODO: Learn more
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
  refetch,
}: {
  info: AppBskyContactDefs.SyncStatus
  refetch: () => Promise<any>
}) {
  const {data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage} =
    useContactsMatchesQuery()
  const moderationOpts = useModerationOpts()

  const [isPTR, setIsPTR] = useState(false)

  const onRefresh = () => {
    setIsPTR(true)
    refetch().finally(() => {
      setIsPTR(false)
    })
  }

  const profiles = data?.pages?.flatMap(page => page.matches) ?? []

  const numProfiles = profiles.length
  const renderItem = useCallback(
    ({item, index}: ListRenderItemInfo<bsky.profile.AnyProfileView>) => {
      if (!moderationOpts) return null
      return (
        <MatchItem
          profile={item}
          isFirst={index === 0}
          isLast={index === numProfiles - 1}
          moderationOpts={moderationOpts}
        />
      )
    },
    [numProfiles, moderationOpts],
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
        <StatusHeader numMatches={info.matchesCount} isPending={isPending} />
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
}: {
  profile: bsky.profile.AnyProfileView
  isFirst: boolean
  isLast: boolean
  moderationOpts: ModerationOpts
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
          />
          {!shadow.viewer?.following && (
            <Button
              color="secondary"
              variant="ghost"
              label={_(msg`Remove suggestion`)}
              // onPress={() => onRemoveSuggestion(profile.did)}
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
}: {
  numMatches: number
  isPending: boolean
}) {
  const t = useTheme()

  if (isPending) {
    return (
      <View style={[a.w_full, a.py_5xl, a.align_center]}>
        <Loader size="xl" />
      </View>
    )
  }

  return (
    <SettingsList.Item
      style={[a.pt_xl, a.pb_md, numMatches === 0 && a.align_start]}>
      <SettingsList.ItemIcon icon={FindContactsIcon} />
      {numMatches > 1 ? (
        <SettingsList.ItemText>
          <Plural
            value={numMatches}
            one="# contact found"
            other="# contacts found"
          />
        </SettingsList.ItemText>
      ) : (
        <View style={[a.flex_1, a.gap_2xs]}>
          <SettingsList.ItemText>
            <Trans>Waiting for your friends to join</Trans>
          </SettingsList.ItemText>
          <Text
            style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]}>
            <Trans>We will notify you when your contacts sign up.</Trans>
          </Text>
        </View>
      )}
    </SettingsList.Item>
  )
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
      <View style={[a.gap_sm, a.align_start]}>
        <Link
          label={_(msg`Resync contacts`)}
          to={{screen: 'FindContactsFlow'}}
          size="small"
          color="primary_subtle">
          <ButtonIcon icon={ResyncIcon} />
          <ButtonText>
            <Trans>Resync contacts</Trans>
          </ButtonText>
        </Link>
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            Contacts last uploaded on{' '}
            {i18n.date(new Date(syncedAt), {
              dateStyle: 'long',
            })}
          </Trans>
        </Text>
      </View>

      <View style={[a.gap_sm, a.align_start]}>
        <Button
          label={_(msg`Remove all contacts`)}
          onPress={() => removeData()}
          size="small"
          color="negative_subtle"
          disabled={isPending}>
          <ButtonIcon icon={isPending ? Loader : TrashIcon} />
          <ButtonText>
            <Trans>Remove all contacts</Trans>
          </ButtonText>
        </Button>
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            Deleting your contact matching data will remove you from future
            friend suggestions and immediately delete all non-matching data.
          </Trans>
        </Text>
      </View>
    </View>
  )
}
