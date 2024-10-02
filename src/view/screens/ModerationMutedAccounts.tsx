import React from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native'
import {AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useMyMutedAccountsQuery} from '#/state/queries/my-muted-accounts'
import {useSetMinimalShellMode} from '#/state/shell'
import {ProfileCard} from '#/view/com/profile/ProfileCard'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {Text} from '#/view/com/util/text/Text'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ModerationMutedAccounts'
>
export function ModerationMutedAccounts({}: Props) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {isTabletOrDesktop} = useWebMediaQueries()

  const [isPTRing, setIsPTRing] = React.useState(false)
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
  const profiles = React.useMemo(() => {
    if (data?.pages) {
      return data.pages.flatMap(page => page.mutes)
    }
    return []
  }, [data])

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh my muted accounts', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
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
  }) => (
    <ProfileCard
      testID={`mutedAccount-${index}`}
      key={item.did}
      profile={item}
      noModFilter
    />
  )
  return (
    <Layout.Screen testID="mutedAccountsScreen">
      <CenteredView
        style={[
          styles.container,
          isTabletOrDesktop && styles.containerDesktop,
          pal.view,
          pal.border,
        ]}
        testID="mutedAccountsScreen">
        <ViewHeader title={_(msg`Muted Accounts`)} showOnDesktop />
        <Text
          type="sm"
          style={[
            styles.description,
            pal.text,
            isTabletOrDesktop && styles.descriptionDesktop,
          ]}>
          <Trans>
            Muted accounts have their posts removed from your feed and from your
            notifications. Mutes are completely private.
          </Trans>
        </Text>
        {isEmpty ? (
          <View style={[pal.border, !isTabletOrDesktop && styles.flex1]}>
            {isError ? (
              <ErrorScreen
                title="Oops!"
                message={cleanError(error)}
                onPressTryAgain={refetch}
              />
            ) : (
              <View style={[styles.empty, pal.viewLight]}>
                <Text type="lg" style={[pal.text, styles.emptyText]}>
                  <Trans>
                    You have not muted any accounts yet. To mute an account, go
                    to their profile and select "Mute account" from the menu on
                    their account.
                  </Trans>
                </Text>
              </View>
            )}
          </View>
        ) : (
          <FlatList
            style={[!isTabletOrDesktop && styles.flex1]}
            data={profiles}
            keyExtractor={item => item.did}
            refreshControl={
              <RefreshControl
                refreshing={isPTRing}
                onRefresh={onRefresh}
                tintColor={pal.colors.text}
                titleColor={pal.colors.text}
              />
            }
            onEndReached={onEndReached}
            renderItem={renderItem}
            initialNumToRender={15}
            // FIXME(dan)

            ListFooterComponent={() => (
              <View style={styles.footer}>
                {(isFetching || isFetchingNextPage) && <ActivityIndicator />}
              </View>
            )}
            // @ts-ignore our .web version only -prf
            desktopFixedHeight
          />
        )}
      </CenteredView>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
  },
  containerDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: 0,
  },
  title: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 30,
    marginBottom: 14,
  },
  descriptionDesktop: {
    marginTop: 14,
  },

  flex1: {
    flex: 1,
  },
  empty: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
  },

  footer: {
    height: 200,
    paddingTop: 20,
  },
})
