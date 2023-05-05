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
import {isDesktopWeb} from 'platform/detection'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {MutedAccountsModel} from 'state/models/lists/muted-accounts'
import {useAnalytics} from 'lib/analytics'
import {useFocusEffect} from '@react-navigation/native'
import {ViewHeader} from '../com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {ProfileCard} from 'view/com/profile/ProfileCard'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ModerationMutedAccounts'
>
export const ModerationMutedAccounts = withAuthRequired(
  observer(({}: Props) => {
    const pal = usePalette('default')
    const store = useStores()
    const {screen} = useAnalytics()
    const mutedAccounts = useMemo(() => new MutedAccountsModel(store), [store])

    useFocusEffect(
      React.useCallback(() => {
        screen('MutedAccounts')
        store.shell.setMinimalShellMode(false)
        mutedAccounts.refresh()
      }, [screen, store, mutedAccounts]),
    )

    const onRefresh = React.useCallback(() => {
      mutedAccounts.refresh()
    }, [mutedAccounts])
    const onEndReached = React.useCallback(() => {
      mutedAccounts
        .loadMore()
        .catch(err =>
          store.log.error('Failed to load more muted accounts', err),
        )
    }, [mutedAccounts, store])

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
        overrideModeration
      />
    )
    return (
      <CenteredView
        style={[
          styles.container,
          isDesktopWeb && styles.containerDesktop,
          pal.view,
          pal.border,
        ]}
        testID="mutedAccountsScreen">
        <ViewHeader title="Muted Accounts" showOnDesktop />
        <Text
          type="sm"
          style={[
            styles.description,
            pal.text,
            isDesktopWeb && styles.descriptionDesktop,
          ]}>
          Muted accounts have their posts removed from your feed and from your
          notifications. Mutes are completely private.
        </Text>
        {!mutedAccounts.hasContent ? (
          <View style={[pal.border, !isDesktopWeb && styles.flex1]}>
            <View style={[styles.empty, pal.viewLight]}>
              <Text type="lg" style={[pal.text, styles.emptyText]}>
                You have not muted any accounts yet. To mute an account, go to
                their profile and selected "Mute account" from the menu on their
                account.
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            style={[!isDesktopWeb && styles.flex1]}
            data={mutedAccounts.mutes}
            keyExtractor={(item: ActorDefs.ProfileView) => item.did}
            refreshControl={
              <RefreshControl
                refreshing={mutedAccounts.isRefreshing}
                onRefresh={onRefresh}
                tintColor={pal.colors.text}
                titleColor={pal.colors.text}
              />
            }
            onEndReached={onEndReached}
            renderItem={renderItem}
            initialNumToRender={15}
            ListFooterComponent={() => (
              <View style={styles.footer}>
                {mutedAccounts.isLoading && <ActivityIndicator />}
              </View>
            )}
            extraData={mutedAccounts.isLoading}
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
    paddingBottom: isDesktopWeb ? 0 : 100,
  },
  containerDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
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
