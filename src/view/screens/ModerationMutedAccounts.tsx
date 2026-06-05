import {useCallback, useMemo, useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {type AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {
  getModerationTimeoutRecord,
  isExpired,
} from '#/state/moderation-timeouts'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useMyMutedAccountsQuery} from '#/state/queries/my-muted-accounts'
import {useSession} from '#/state/session'
import {useTickEveryMinute} from '#/state/shell'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ModerationMutedAccounts'
>
export function ModerationMutedAccounts({}: Props) {
  const t = useTheme()
  const {i18n} = useLingui()
  const moderationOpts = useModerationOpts()
  const {currentAccount} = useSession()
  const tick = useTickEveryMinute()

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
  const profiles = useMemo(() => {
    if (!currentAccount || !data?.pages) {
      return []
    }

    return data.pages
      .flatMap(page => page.mutes)
      .filter(mute => {
        const timeout = getModerationTimeoutRecord(
          currentAccount.did,
          'mute',
          mute.did,
        )
        return !timeout || !isExpired(timeout.expiresAt)
      })
  }, [currentAccount, data, tick])

  const isEmpty = !isFetching && profiles.length === 0

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
    const timeout = currentAccount
      ? getModerationTimeoutRecord(currentAccount.did, 'mute', item.did)
      : undefined
    return (
      <View
        style={[a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low]}
        key={item.did}>
        <View style={[a.gap_xs]}>
          <ProfileCard.Link profile={item} testID={`mutedAccount-${index}`}>
            <ProfileCard.Outer>
              <ProfileCard.Header>
                <ProfileCard.Avatar
                  profile={item}
                  moderationOpts={moderationOpts}
                />
                <ProfileCard.NameAndHandle
                  profile={item}
                  moderationOpts={moderationOpts}
                />
              </ProfileCard.Header>
              <ProfileCard.Labels
                profile={item}
                moderationOpts={moderationOpts}
              />
              <ProfileCard.Description profile={item} />
            </ProfileCard.Outer>
          </ProfileCard.Link>
          {timeout?.expiresAt && !isExpired(timeout.expiresAt) ? (
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              <Trans>Expires on</Trans>{' '}
              {i18n.date(new Date(timeout.expiresAt), {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </Text>
          ) : null}
        </View>
      </View>
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
