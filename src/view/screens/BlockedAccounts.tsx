import React, {useMemo} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Alert} from 'view/com/util/Alert'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ScrollView} from 'react-native-gesture-handler'
import {AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {Text} from '../com/util/text/Text'
import {Button} from '../com/util/forms/Button'
import * as Toast from '../com/util/Toast'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {BlockedAccountsModel} from 'state/models/lists/blocked-accounts'
import {useAnalytics} from 'lib/analytics'
import {useFocusEffect} from '@react-navigation/native'
import {ViewHeader} from '../com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'BlockedAccounts'>
export const BlockedAccounts = withAuthRequired(
  observer(({}: Props) => {
    const pal = usePalette('default')
    const store = useStores()
    const {screen} = useAnalytics()
    const blockedAccounts = useMemo(
      () => new BlockedAccountsModel(store),
      [store],
    )

    useFocusEffect(
      React.useCallback(() => {
        screen('BlockedAccounts')
        store.shell.setMinimalShellMode(false)
      }, [screen, store]),
    )

    return (
      <CenteredView
        style={[
          styles.container,
          isDesktopWeb && styles.containerDesktop,
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
            isDesktopWeb && styles.descriptionDesktop,
          ]}>
          Blocked accounts cannot reply in your threads, mention you, or
          otherwise interact with you. You will not see their content and they
          will be prevented from seeing yours.
        </Text>
        <ScrollView
          style={[
            styles.scrollContainer,
            pal.border,
            !isDesktopWeb && styles.flex1,
          ]}>
          {!blockedAccounts.hasContent ? (
            <View style={[styles.empty, pal.viewLight]}>
              <Text type="lg" style={[pal.text, styles.emptyText]}>
                You have not blocked any accounts yet. To block an account, go
                to their profile and selected "Block account" from the menu on
                their account.
              </Text>
            </View>
          ) : (
            blockedAccounts.blocks.map((block, i) => (
              <BlockedAccount
                testID={`blockedAccount-${i}`}
                key={block.did}
                block={block}
              />
            ))
          )}
        </ScrollView>
      </CenteredView>
    )
  }),
)

function BlockedAccount({
  testID,
  block,
}: {
  testID: string
  block: ActorDefs.ProfileView
}) {
  const pal = usePalette('default')
  return (
    <TouchableOpacity testID={testID} style={[styles.item, pal.border]}>
      <Text type="md-bold" style={pal.text}>
        {block.displayName}
      </Text>
      <View style={styles.flex1} />
      <FontAwesomeIcon icon={['far', 'trash-can']} style={styles.trashIcon} />
    </TouchableOpacity>
  )
}

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

  scrollContainer: {
    borderTopWidth: 1,
    marginTop: 4,
    marginBottom: 16,
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

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  pr10: {
    marginRight: 10,
  },
})
