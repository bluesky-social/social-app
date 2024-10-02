import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useProfileKnownFollowersQuery} from '#/state/queries/known-followers'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {useSetMinimalShellMode} from '#/state/shell'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {List} from '#/view/com/util/List'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import * as Layout from '#/components/Layout'
import {
  ListFooter,
  ListHeaderDesktop,
  ListMaybePlaceholder,
} from '#/components/Lists'

function renderItem({item}: {item: AppBskyActorDefs.ProfileViewBasic}) {
  return <ProfileCardWithFollowBtn key={item.did} profile={item} />
}

function keyExtractor(item: AppBskyActorDefs.ProfileViewBasic) {
  return item.did
}

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ProfileKnownFollowers'
>
export const ProfileKnownFollowersScreen = ({route}: Props) => {
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const initialNumToRender = useInitialNumToRender()

  const {name} = route.params

  const [isPTRing, setIsPTRing] = React.useState(false)
  const {
    data: resolvedDid,
    isLoading: isDidLoading,
    error: resolveError,
  } = useResolveDidQuery(route.params.name)
  const {
    data,
    isLoading: isFollowersLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useProfileKnownFollowersQuery(resolvedDid)

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

  const followers = React.useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.followers)
    }
    return []
  }, [data])

  const isError = Boolean(resolveError || error)

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  if (followers.length < 1) {
    return (
      <Layout.Screen>
        <ListMaybePlaceholder
          isLoading={isDidLoading || isFollowersLoading}
          isError={isError}
          emptyType="results"
          emptyMessage={_(msg`You don't follow any users who follow @${name}.`)}
          errorMessage={cleanError(resolveError || error)}
          onRetry={isError ? refetch : undefined}
        />
      </Layout.Screen>
    )
  }

  return (
    <Layout.Screen>
      <ViewHeader title={_(msg`Followers you know`)} />
      <List
        data={followers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={isPTRing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        onEndReachedThreshold={4}
        ListHeaderComponent={
          <ListHeaderDesktop title={_(msg`Followers you know`)} />
        }
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
      />
    </Layout.Screen>
  )
}
