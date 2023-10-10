import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import Clipboard from '@react-native-clipboard/clipboard'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import * as Toast from '../util/Toast'
import {useStores} from 'state/index'
import {ScrollView} from './util'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

export const snapPoints = ['70%']

export function Component({}: {}) {
  const pal = usePalette('default')
  const store = useStores()
  const {isTabletOrDesktop} = useWebMediaQueries()

  const onClose = React.useCallback(() => {
    store.shell.closeModal()
  }, [store])

  if (store.me.invites.length === 0) {
    return (
      <View style={[styles.container, pal.view]} testID="inviteCodesModal">
        <View style={[styles.empty, pal.viewLight]}>
          <Text type="lg" style={[pal.text, styles.emptyText]}>
            You don't have any invite codes yet! We'll send you some when you've
            been on Bluesky for a little longer.
          </Text>
        </View>
        <View style={styles.flex1} />
        <View
          style={[
            styles.btnContainer,
            isTabletOrDesktop && styles.btnContainerDesktop,
          ]}>
          <Button
            type="primary"
            label="Done"
            style={styles.btn}
            labelStyle={styles.btnLabel}
            onPress={onClose}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, pal.view]} testID="inviteCodesModal">
      <Text type="title-xl" style={[styles.title, pal.text]}>
        Invite a Friend
      </Text>
      <Text type="lg" style={[styles.description, pal.text]}>
        Each code works once. You'll receive more invite codes periodically.
      </Text>
      <ScrollView style={[styles.scrollContainer, pal.border]}>
        {store.me.invites.map((invite, i) => (
          <InviteCode
            testID={`inviteCode-${i}`}
            key={invite.code}
            code={invite.code}
            used={invite.available - invite.uses.length <= 0 || invite.disabled}
          />
        ))}
      </ScrollView>
      <View style={styles.btnContainer}>
        <Button
          testID="closeBtn"
          type="primary"
          label="Done"
          style={styles.btn}
          labelStyle={styles.btnLabel}
          onPress={onClose}
        />
      </View>
    </View>
  )
}

const InviteCode = observer(function InviteCodeImpl({
  testID,
  code,
  used,
}: {
  testID: string
  code: string
  used?: boolean
}) {
  const pal = usePalette('default')
  const store = useStores()
  const {invitesAvailable} = store.me

  const onPress = React.useCallback(() => {
    Clipboard.setString(code)
    Toast.show('Copied to clipboard')
    store.invitedUsers.setInviteCopied(code)
  }, [store, code])

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.inviteCode, pal.border]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        invitesAvailable === 1
          ? 'Invite codes: 1 available'
          : `Invite codes: ${invitesAvailable} available`
      }
      accessibilityHint="Opens list of invite codes">
      <Text
        testID={`${testID}-code`}
        type={used ? 'md' : 'md-bold'}
        style={used ? [pal.textLight, styles.strikeThrough] : pal.text}>
        {code}
      </Text>
      <View style={styles.flex1} />
      {!used && store.invitedUsers.isInviteCopied(code) && (
        <Text style={[pal.textLight, styles.codeCopied]}>Copied</Text>
      )}
      {!used && (
        <FontAwesomeIcon
          icon={['far', 'clone']}
          style={pal.text as FontAwesomeIconStyle}
        />
      )}
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isWeb ? 0 : 50,
  },
  title: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 42,
    marginBottom: 14,
  },

  scrollContainer: {
    flex: 1,
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

  inviteCode: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  codeCopied: {
    marginRight: 8,
  },
  strikeThrough: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },

  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btnContainerDesktop: {
    marginTop: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    paddingHorizontal: 60,
    paddingVertical: 14,
  },
  btnLabel: {
    fontSize: 18,
  },
})
