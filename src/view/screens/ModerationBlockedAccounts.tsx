import React, {useMemo} from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native'
import {AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {Text} from '../com/util/text/Text'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {BlockedAccountsModel} from 'state/models/lists/blocked-accounts'
import {useAnalytics} from 'lib/analytics/analytics'
import {useFocusEffect} from '@react-navigation/native'
import {ViewHeader} from '../com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {ProfileCard} from 'view/com/profile/ProfileCard'
import {logger} from '#/logger'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ModerationBlockedAccounts'
>
export const ModerationBlockedAccounts = withAuthRequired(
  observer(function ModerationBlockedAccountsImpl({}: Props) {
    const pal = usePalette('default')
    const store = useStores()
    const {isTabletOrDesktop} = useWebMediaQueries()
    const {screen} = useAnalytics()
    const blockedAccounts = useMemo(
      () => new BlockedAccountsModel(store),
      [store],
    )

    useFocusEffect(
      React.useCallback(() => {
        screen('BlockedAccounts')
        store.shell.setMinimalShellMode(false)
        blockedAccounts.refresh()
      }, [screen, store, blockedAccounts]),
    )

    const onRefresh = React.useCallback(() => {
      blockedAccounts.refresh()
    }, [blockedAccounts])
    const onEndReached = React.useCallback(() => {
      blockedAccounts
        .loadMore()
        .catch(err =>
          logger.error('Failed to load more blocked accounts', {error: err}),
        )
    }, [blockedAccounts])

    const renderItem = ({
      item,
      index,
    }: {
      item: ActorDefs.ProfileView
      index: number
    }) => (
      <ProfileCard
        testID={`blockedAccount-${index}`}
        key={item.did}
        profile={item}
      />
    )
    return (
      <CenteredView
        style={[
          styles.container,
          isTabletOrDesktop && styles.containerDesktop,
          pal.view,
          pal.border,
        ]}
        testID="blockedAccountsScreen">
        <ViewHeader title="Blocked Accounts" showOnDesktop />
        <Text
          type="sm"
          style={[
            styles.description,
            pal.text,
            isTabletOrDesktop && styles.descriptionDesktop,
          ]}>
          Blocked accounts cannot reply in your threads, mention you, or
          otherwise interact with you. You will not see their content and they
          will be prevented from seeing yours.
        </Text>
        {!blockedAccounts.hasContent ? (
          <View style={[pal.border, !isTabletOrDesktop && styles.flex1]}>
            <View style={[styles.empty, pal.viewLight]}>
              <Text type="lg" style={[pal.text, styles.emptyText]}>
                You have not blocked any accounts yet. To block an account, go
                to their profile and selected "Block account" from the menu on
                their account.
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            style={[!isTabletOrDesktop && styles.flex1]}
            data={blockedAccounts.blocks}
            keyExtractor={(item: ActorDefs.ProfileView) => item.did}
            refreshControl={
              <RefreshControl
                refreshing={blockedAccounts.isRefreshing}
                onRefresh={onRefresh}
                tintColor={pal.colors.text}
                titleColor={pal.colors.text}
              />
            }
            onEndReached={onEndReached}
            renderItem={renderItem}
            initialNumToRender={15}
            // FIXME(dan)
            // eslint-disable-next-line react/no-unstable-nested-components
            ListFooterComponent={() => (
              <View style={styles.footer}>
                {blockedAccounts.isLoading && <ActivityIndicator />}
              </View>
            )}
            extraData={blockedAccounts.isLoading}
            // @ts-ignore our .web version only -prf
            desktopFixedHeight
          />
        )}
      </CenteredView>
    )
  }),
)

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
