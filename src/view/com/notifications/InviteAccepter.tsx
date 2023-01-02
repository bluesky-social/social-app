import React, {useState} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import * as apilib from '../../../state/lib/api'
import {NotificationsViewItemModel} from '../../../state/models/notifications-view'
import {ConfirmModal} from '../../../state/models/shell-ui'
import {useStores} from '../../../state'
import {ProfileCard} from '../profile/ProfileCard'
import * as Toast from '../util/Toast'
import {Text} from '../util/text/Text'
import {s, colors, gradients} from '../../lib/styles'

export function InviteAccepter({item}: {item: NotificationsViewItemModel}) {
  const store = useStores()
  const [confirmationUri, setConfirmationUri] = useState<string>('')
  const isMember =
    confirmationUri !== '' || store.me.memberships?.isMemberOf(item.author.did)
  const onPressAccept = async () => {
    store.shell.openModal(
      new ConfirmModal(
        'Join this scene?',
        () => (
          <View>
            <View style={styles.profileCardContainer}>
              <ProfileCard
                did={item.author.did}
                handle={item.author.handle}
                displayName={item.author.displayName}
                avatar={item.author.avatar}
              />
            </View>
          </View>
        ),
        onPressConfirmAccept,
      ),
    )
  }
  const onPressConfirmAccept = async () => {
    const uri = await apilib.acceptSceneInvite(store, {
      originator: {
        did: item.author.did,
        declarationCid: item.author.declaration.cid,
      },
      assertion: {
        uri: item.uri,
        cid: item.cid,
      },
    })
    store.me.refreshMemberships()
    Toast.show('Invite accepted')
    setConfirmationUri(uri)
  }
  return (
    <View style={styles.container}>
      {!isMember ? (
        <TouchableOpacity onPress={onPressAccept}>
          <LinearGradient
            colors={[gradients.primary.start, gradients.primary.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.btn]}>
            <Text style={[s.white, s.bold, s.f16]}>Accept Invite</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <View style={styles.inviteAccepted}>
          <FontAwesomeIcon icon="check" size={14} style={s.mr5} />
          <Text style={[s.gray5, s.f15]}>Invite accepted</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  btn: {
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: colors.gray1,
  },
  profileCardContainer: {
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 6,
  },
  inviteAccepted: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
