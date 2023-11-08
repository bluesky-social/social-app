import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {ComAtprotoServerDefs} from '@atproto/api'
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
import {useModalControls} from '#/state/modals'
import {useInvitesState, useInvitesAPI} from '#/state/invites'
import {UserInfoText} from '../util/UserInfoText'
import {makeProfileLink} from '#/lib/routes/links'
import {Link} from '../util/Link'

export const snapPoints = ['70%']

export function Component({}: {}) {
  const pal = usePalette('default')
  const store = useStores()
  const {closeModal} = useModalControls()
  const {isTabletOrDesktop} = useWebMediaQueries()

  const onClose = React.useCallback(() => {
    closeModal()
  }, [closeModal])

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
            invite={invite}
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
  invite,
  used,
}: {
  testID: string
  invite: ComAtprotoServerDefs.InviteCode
  used?: boolean
}) {
  const pal = usePalette('default')
  const store = useStores()
  const {invitesAvailable} = store.me
  const invitesState = useInvitesState()
  const {setInviteCopied} = useInvitesAPI()

  const onPress = React.useCallback(() => {
    Clipboard.setString(invite.code)
    Toast.show('Copied to clipboard')
    setInviteCopied(invite.code)
  }, [setInviteCopied, invite])

  return (
    <View
      style={[
        pal.border,
        {borderBottomWidth: 1, paddingHorizontal: 20, paddingVertical: 14},
      ]}>
      <TouchableOpacity
        testID={testID}
        style={[styles.inviteCode]}
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
          {invite.code}
        </Text>
        <View style={styles.flex1} />
        {!used && invitesState.copiedInvites.includes(invite.code) && (
          <Text style={[pal.textLight, styles.codeCopied]}>Copied</Text>
        )}
        {!used && (
          <FontAwesomeIcon
            icon={['far', 'clone']}
            style={pal.text as FontAwesomeIconStyle}
          />
        )}
      </TouchableOpacity>
      {invite.uses.length > 0 ? (
        <View
          style={{
            flexDirection: 'column',
            gap: 8,
            paddingTop: 6,
          }}>
          <Text style={pal.text}>Used by:</Text>
          {invite.uses.map(use => (
            <Link
              key={use.usedBy}
              href={makeProfileLink({handle: use.usedBy, did: ''})}
              style={{
                flexDirection: 'row',
              }}>
              <Text style={pal.text}>• </Text>
              <UserInfoText did={use.usedBy} style={pal.link} />
            </Link>
          ))}
        </View>
      ) : null}
    </View>
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
