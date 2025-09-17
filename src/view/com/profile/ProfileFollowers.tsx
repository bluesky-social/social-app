import React from 'react'
import {type AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useProfileFollowersQuery} from '#/state/queries/profile-followers'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {useSession} from '#/state/session'
import {useTheme} from '#/alf'
import {PeopleRemove2_Stroke1_Corner0_Rounded as PeopleRemoveIcon} from '#/components/icons/PeopleRemove2'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {List} from '../util/List'
import {ProfileCardWithFollowBtn} from './ProfileCard'

function renderItem({
  item,
  index,
}: {
  item: ActorDefs.ProfileView
  index: number
}) {
  return (
    <ProfileCardWithFollowBtn
      key={item.did}
      profile={item}
      noBorder={index === 0}
    />
  )
}

function keyExtractor(item: ActorDefs.ProfileViewBasic) {
  return item.did
}

export function ProfileFollowers({name}: {name: string}) {
  const {_} = useLingui()
  const navigation = useNavigation()
  const initialNumToRender = useInitialNumToRender()
  const {currentAccount} = useSession()
  const t = useTheme()

  const [isPTRing, setIsPTRing] = React.useState(false)
  const {
    data: resolvedDid,
    isLoading: isDidLoading,
    error: resolveError,
  } = useResolveDidQuery(name)
  const {
    data,
    isLoading: isFollowersLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useProfileFollowersQuery(resolvedDid)

  const isError = !!resolveError || !!error
  const isMe = resolvedDid === currentAccount?.did

  const followers = React.useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.followers)
    }
    return []
  }, [data])

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh followers', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || !!error) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more followers', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  if (followers.length < 1) {
    return (
      <ListMaybePlaceholder
        isLoading={isDidLoading || isFollowersLoading}
        isError={isError}
        emptyType="results"
        emptyMessage={
          isMe
            ? _(msg`No followers yet.`)
            : _(msg`This user doesn't have any followers.`)
        }
        errorMessage={cleanError(resolveError || error)}
        onRetry={isError ? refetch : undefined}
        sideBorders={false}
        useEmptyState={true}
        emptyStateIcon={
          <PeopleRemoveIcon size="3xl" fill={t.atoms.text_contrast_low.color} />
        }
        emptyStateButton={{
          label: _(msg`Go back`),
          text: _(msg`Go back`),
          color: 'secondary',
          size: 'small',
          onPress: () => navigation.goBack(),
        }}
      />
    )
  }

  return (
    <List
      data={followers}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshing={isPTRing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={4}
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          error={cleanError(error)}
          onRetry={fetchNextPage}
        />
      }
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
      initialNumToRender={initialNumToRender}
      windowSize={11}
      sideBorders={false}
    />
  )
}
